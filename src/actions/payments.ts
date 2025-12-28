"use server"

/**
 * Server Action: Enviar pago manual para verificación
 * 
 * Maneja la subida de archivos y creación del registro de pago manual
 * usando Supabase Storage y la tabla manual_payment_submissions
 */

import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface SubmitManualPaymentResult {
  success: boolean
  error?: string
  submissionId?: string
  message?: string
}

export async function submitManualPayment(
  formData: FormData
): Promise<SubmitManualPaymentResult> {
  try {
    // 1️⃣ Verificar autenticación
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'No autenticado. Por favor inicia sesión.'
      }
    }

    // 2️⃣ Extraer datos del FormData
    const plan_id = formData.get('plan_id') as string
    const business_id = formData.get('business_id') as string
    const payment_method = formData.get('payment_method') as string
    const reference = formData.get('reference') as string | null
    const screenshot = formData.get('screenshot') as File

    // Validar campos requeridos
    if (!plan_id || !business_id || !payment_method || !screenshot) {
      const missingFields: string[] = []
      if (!plan_id) missingFields.push('Plan')
      if (!business_id) missingFields.push('Negocio')
      if (!payment_method) missingFields.push('Método de pago')
      if (!screenshot) missingFields.push('Captura de pantalla')
      
      return {
        success: false,
        error: `Faltan campos requeridos: ${missingFields.join(', ')}. Por favor, completa todos los campos del formulario.`
      }
    }

    // Validar que el archivo sea una imagen
    if (!screenshot.type.startsWith('image/')) {
      return {
        success: false,
        error: 'El archivo debe ser una imagen (JPEG, PNG, WEBP, GIF)'
      }
    }

    // Validar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (screenshot.size > maxSize) {
      return {
        success: false,
        error: 'La imagen es demasiado grande. Máximo 10MB'
      }
    }

    // Mapear payment_method a valores válidos de la BD
    // El frontend puede enviar 'pago_movil', pero la BD espera valores específicos
    let mappedPaymentMethod = payment_method
    if (payment_method === 'pago_movil') {
      mappedPaymentMethod = 'bank_transfer' // Pago móvil es una forma de transferencia bancaria
    }

    // 3️⃣ Verificar que el negocio pertenece al usuario
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, owner_id, name')
      .eq('id', business_id)
      .eq('owner_id', user.id)
      .single()

    if (businessError || !business) {
      console.error('Error verificando negocio:', businessError)
      return {
        success: false,
        error: 'Negocio no encontrado o no autorizado'
      }
    }

    // 4️⃣ Obtener información del plan
    const { data: plan, error: planError } = await supabase
      .from('premium_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      console.error('Error obteniendo plan:', planError)
      return {
        success: false,
        error: 'Plan premium no encontrado o no está disponible'
      }
    }

    // 5️⃣ Subir imagen a Supabase Storage
    // Generar nombre único de archivo: userId/businessId/timestamp-random.ext
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileExt = screenshot.name.split('.').pop() || 'jpg'
    const fileName = `${user.id}/${business_id}/${timestamp}-${randomStr}.${fileExt}`

    // Usar Admin Client para subir archivo (bypassa políticas de Storage)
    // Esto evita problemas de permisos con archivos grandes
    const adminSupabase = getAdminClient()
    
    let uploadResult: { data: any; error: any } | null = null

    try {
      uploadResult = await adminSupabase.storage
        .from('payment_receipts')
        .upload(fileName, screenshot, {
          contentType: screenshot.type,
          upsert: false,
          cacheControl: '3600',
        })
    } catch (uploadErr: any) {
      console.error('Error subiendo archivo:', uploadErr)
      return {
        success: false,
        error: 'Error al subir la imagen. Por favor, verifica tu conexión e intenta nuevamente.'
      }
    }

    if (!uploadResult || uploadResult.error) {
      console.error('Error subiendo imagen:', uploadResult?.error)
      
      // Mensajes de error más amigables
      const errorMsg = uploadResult?.error?.message || 'Error desconocido'
      let userFriendlyError = 'Error al subir la captura de pantalla'
      
      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
        userFriendlyError = 'Esta imagen ya fue subida anteriormente. Por favor, intenta con otra imagen.'
      } else if (errorMsg.includes('size') || errorMsg.includes('too large')) {
        userFriendlyError = 'El archivo es demasiado grande. El tamaño máximo permitido es 10MB.'
      } else if (errorMsg.includes('permission') || errorMsg.includes('unauthorized')) {
        userFriendlyError = 'No tienes permisos para subir archivos. Por favor, verifica tu sesión.'
      } else if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
        userFriendlyError = 'Problema de conexión al subir la imagen. Por favor, verifica tu internet e intenta nuevamente.'
      } else {
        userFriendlyError = 'Error al subir la captura de pantalla. Por favor, intenta nuevamente o usa una imagen diferente.'
      }
      
      return {
        success: false,
        error: userFriendlyError
      }
    }

    // 6️⃣ Obtener URL del archivo subido
    // Usar admin client para obtener la URL (bucket puede ser privado)
    const { data: { publicUrl } } = adminSupabase.storage
      .from('payment_receipts')
      .getPublicUrl(fileName)

    // Construir la URL completa del archivo subido
    const receipt_url = publicUrl || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/payment_receipts/${fileName}`

    // 7️⃣ Crear registro en manual_payment_submissions usando Admin Client
    const { data: submission, error: submissionError } = await (adminSupabase as any)
      .from('manual_payment_submissions')
      .insert({
        user_id: user.id,
        business_id,
        plan_id,
        amount_usd: plan.price_usd,
        payment_method: mappedPaymentMethod,
        reference: reference || null,
        screenshot_url: receipt_url,
        status: 'pending',
      })
      .select()
      .single()

    if (!submission || submissionError) {
      console.error('Error creando registro de pago manual:', submissionError)
      
      // Intentar eliminar la imagen subida si falló el insert
      try {
        await adminSupabase.storage.from('payment_receipts').remove([fileName])
      } catch (cleanupErr) {
        console.error('Error limpiando archivo después de fallo:', cleanupErr)
      }

      // Mensaje de error más amigable
      const errorMsg = submissionError?.message || 'Error desconocido'
      let userFriendlyError = 'Error al procesar tu solicitud de pago'
      
      if (errorMsg.includes('duplicate') || errorMsg.includes('unique')) {
        userFriendlyError = 'Ya existe una solicitud de pago pendiente para este plan. Por favor, espera a que sea procesada.'
      } else if (errorMsg.includes('foreign key') || errorMsg.includes('constraint')) {
        userFriendlyError = 'Error en los datos del pago. Por favor, recarga la página e intenta nuevamente.'
      } else if (errorMsg.includes('permission') || errorMsg.includes('unauthorized')) {
        userFriendlyError = 'No tienes permisos para realizar esta acción. Por favor, verifica tu sesión.'
      } else {
        userFriendlyError = 'Error al registrar el pago. Por favor, intenta nuevamente o contacta al soporte si el problema persiste.'
      }

      return {
        success: false,
        error: userFriendlyError
      }
    }

    // 8️⃣ (Opcional) Crear registro en tabla payments también usando Admin Client
    try {
      await (adminSupabase as any)
        .from('payments')
        .insert({
          business_id,
          user_id: user.id,
          plan_id,
          method: 'manual',
          amount_usd: plan.price_usd,
          currency: 'USD',
          status: 'pending',
          external_id: submission.id,
        })
    } catch (paymentErr) {
      // No bloqueamos el flujo si esto falla, solo lo registramos
      console.warn('Error creando registro en tabla payments (no crítico):', paymentErr)
    }

    // 9️⃣ Revalidar rutas relacionadas
    revalidatePath(`/app/dashboard/negocios/${business_id}/premium`)
    revalidatePath('/app/admin/pagos')

    return {
      success: true,
      submissionId: submission.id,
      message: 'Tu pago ha sido enviado para verificación. Te notificaremos cuando sea aprobado.'
    }

  } catch (error: any) {
    console.error('Error en submitManualPayment:', error)
    return {
      success: false,
      error: error.message || 'Error interno del servidor'
    }
  }
}

