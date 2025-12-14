import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // 1. Validar Content-Type
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type debe ser application/json' },
        { status: 400 }
      )
    }

    // 2. Leer body de forma segura
    let body: { secret?: string; email?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Body JSON inválido o vacío' },
        { status: 400 }
      )
    }

    const { secret, email } = body

    if (!secret || !email) {
      return NextResponse.json(
        { success: false, error: 'Secret y email son requeridos' },
        { status: 400 }
      )
    }

    // 3. Validar secret
    if (!process.env.ADMIN_SETUP_SECRET) {
      return NextResponse.json(
        { success: false, error: 'ADMIN_SETUP_SECRET no configurado' },
        { status: 500 }
      )
    }

    if (secret !== process.env.ADMIN_SETUP_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Clave secreta inválida' },
        { status: 403 }
      )
    }

    // 4. Validar Supabase envs
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { success: false, error: 'Credenciales de Supabase no configuradas' },
        { status: 500 }
      )
    }

    // 5. Crear cliente service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 6. Buscar usuario
    const { data, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      return NextResponse.json(
        { success: false, error: listError.message },
        { status: 500 }
      )
    }

    const user = data.users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // 7. Actualizar perfil
    await supabase
      .from('profiles')
      .upsert(
        { id: user.id, email: user.email, is_admin: true },
        { onConflict: 'id' }
      )

    // 8. Actualizar metadata
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, is_admin: true },
    })

    return NextResponse.json({
      success: true,
      message: `Usuario ${email} configurado como administrador`,
    })
  } catch (error) {
    console.error('set-admin error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
