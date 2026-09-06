"use server"

/**
 * Server Action: Enviar pago manual de MEMBRESÍA para verificación
 *
 * Maneja la subida de archivos y creación del registro de pago manual
 * usando Supabase Storage y la tabla manual_payment_submissions.
 *
 * El producto es la MEMBRESÍA DE CUENTA (tier 1..3 por N meses). `business_id`
 * es opcional porque la membresía pertenece al usuario, no a un negocio.
 */

import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import {
  SUBSCRIPTION_TIER_CONECTA,
  SUBSCRIPTION_TIER_DESTACADO,
  SUBSCRIPTION_TIER_PATROCINA,
  calculateSubscriptionTotal,
} from '@/lib/memberships/tiers'
import type { SubscriptionTier } from '@/lib/memberships/tiers'

export interface SubmitManualPaymentResult {
  success: boolean
  error?: string
  submissionId?: string
  message?: string
  /** Monto calculado en servidor para el tier + meses enviados */
  amountUsd?: number
}

const PAYABLE_TIERS: SubscriptionTier[] = [
  SUBSCRIPTION_TIER_CONECTA,
  SUBSCRIPTION_TIER_DESTACADO,
  SUBSCRIPTION_TIER_PATROCINA,
]

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
    const targetTierRaw = formData.get('target_tier')
    const monthsRaw = formData.get('months')
    // business_id es OPCIONAL: la membresía es de cuenta, no de negocio
    const business_id = (formData.get('business_id') as string | null) || null
    const payment_method = formData.get('payment_method') as string
    const reference = formData.get('reference') as string | null
    const screenshot = formData.get('screenshot') as File

    // Validar campos requeridos
    if (!targetTierRaw || !monthsRaw || !payment_method || !screenshot) {
      const missingFields: string[] = []
      if (!targetTierRaw) missingFields.push('Nivel de membresía')
      if (!monthsRaw) missingFields.push('Duración (meses)')
      if (!payment_method) missingFields.push('Método de pago')
      if (!screenshot) missingFields.push('Captura de pantalla')

      return {
        success: false,
        error: `Faltan campos requeridos: ${missingFields.join(', ')}. Por favor, completa todos los campos del formulario.`
      }
    }

    // Validar tier objetivo (1 = Conecta, 2 = Destaca, 3 = Patrocina)
    const target_tier = parseInt(String(targetTierRaw), 10)
    if (!Number.isFinite(target_tier) || !PAYABLE_TIERS.includes(target_tier as SubscriptionTier)) {
      return {
        success: false,
        error: 'El nivel de membresía seleccionado no es válido.'
      }
    }

    // Validar meses
    const months = parseInt(String(monthsRaw), 10)
    if (!Number.isFinite(months) || months < 1) {
      return {
        success: false,
        error: 'La duración debe ser de al menos 1 mes.'
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

    // 3️⃣ Si se envió un negocio, verificar que pertenece al usuario.
    //    (Opcional: sirve solo como referencia; la membresía se aplica a la cuenta.)
    if (business_id) {
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
    }

    // 4️⃣ Calcular el monto en SERVIDOR (nunca confiar en el cliente).
    //    calculateSubscriptionTotal aplica el descuento "paga 10, recibe 12".
    const amount_usd = calculateSubscriptionTotal(target_tier, months)
    if (!Number.isFinite(amount_usd) || amount_usd <= 0) {
      return {
        success: false,
        error: 'No se pudo calcular el monto de la membresía seleccionada.'
      }
    }

    // 5️⃣ Subir imagen a Supabase Storage
    // Generar nombre único de archivo: userId/membership/timestamp-random.ext
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileExt = screenshot.name.split('.').pop() || 'jpg'
    const fileName = `${user.id}/membership/${timestamp}-${randomStr}.${fileExt}`

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
        business_id: business_id || null,
        target_tier,
        months,
        amount_usd,
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
        userFriendlyError = 'Ya existe una solicitud de pago pendiente para esta membresía. Por favor, espera a que sea procesada.'
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

    // 8️⃣ NOTA: ya NO se inserta en la tabla `payments`. Esa tabla quedó reservada
    //    exclusivamente para el sistema de referidos/comisiones
    //    (commissions.source_payment_id) y perdió la columna plan_id.

    // 9️⃣ Revalidar rutas relacionadas
    revalidatePath('/app/dashboard/membresia')
    revalidatePath('/app/admin/pagos')

    return {
      success: true,
      submissionId: submission.id,
      amountUsd: amount_usd,
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

