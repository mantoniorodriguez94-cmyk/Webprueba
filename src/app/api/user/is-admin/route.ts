import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server' // Cliente para autenticación (Auth)
import { createClient as createServiceClient } from '@supabase/supabase-js' // Cliente para base de datos (Admin)

export async function GET() {
  try {
    // 1️⃣ PASO 1: Identificar al usuario (Usamos cliente normal)
    // Necesitamos verificar quién hace la petición leyendo las cookies
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ API is-admin: Usuario no autenticado')
      return NextResponse.json({ isAdmin: false, error: 'No autenticado' }, { status: 401 })
    }

    // 2️⃣ PASO 2: Leer la base de datos (Usamos Service Role)
    // ⚠️ CRUCIAL: Usamos DIRECTAMENTE el Service Role para saltarnos las RLS
    // Esto evita el error de "Infinite Recursion" que tienes ahora.
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ ERROR CRÍTICO: Falta SUPABASE_SERVICE_ROLE_KEY en .env.local')
      return NextResponse.json({ isAdmin: false, error: 'Error de configuración del servidor' }, { status: 500 })
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile, error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, email, role') // Traemos solo lo necesario
      .eq('id', user.id)
      .single()

    if (dbError) {
      console.error('❌ Error leyendo perfil (Admin Client):', dbError.message)
      // Si falla la DB, por seguridad devolvemos false
      return NextResponse.json({ isAdmin: false, error: dbError.message }, { status: 500 })
    }

    // 3️⃣ PASO 3: Validación estricta
    const isAdmin = profile?.is_admin === true

    console.log(`✅ Verificación Admin completada: ${user.email} -> ${isAdmin ? 'ES ADMIN' : 'NO ES ADMIN'}`)

    return NextResponse.json({
      isAdmin,
      debug: {
        userId: user.id,
        role: profile?.role // Útil para debug, pero no determina admin
      }
    })

  } catch (error: any) {
    console.error('❌ Error fatal en API is-admin:', error)
    return NextResponse.json(
      { isAdmin: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}