import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // ✅ Verificar Content-Type
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type debe ser application/json' },
        { status: 400 }
      )
    }

    // ✅ Parsear body de forma segura
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

    // ✅ Validaciones duras
    if (!secret || !email) {
      return NextResponse.json(
        { success: false, error: 'Secret y email son requeridos' },
        { status: 400 }
      )
    }

    // ✅ NO fallback de seguridad
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

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Supabase service role no configurado' },
        { status: 500 }
      )
    }

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 🔍 Buscar usuario
    const { data, error: listError } = await serviceSupabase.auth.admin.listUsers()

    if (listError) {
      return NextResponse.json(
        { success: false, er
