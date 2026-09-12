/**
 * POST /api/email/welcome
 *
 * Sends a Welcome Email via Resend when a new user registers.
 * Called server-to-server from the registration flow — RESEND_API_KEY
 * is never exposed to the browser.
 *
 * Request body: { to: string; userName: string }
 * Response:     { success: true } | { success: false; error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/emails'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)

    // Validate required fields
    const to: unknown = body?.to
    const userName: unknown = body?.userName

    if (
      !to ||
      typeof to !== 'string' ||
      !to.includes('@') ||
      !userName ||
      typeof userName !== 'string' ||
      userName.trim() === ''
    ) {
      return NextResponse.json(
        { success: false, error: 'Se requieren los campos: to (email válido) y userName.' },
        { status: 400 },
      )
    }

    const destino = to.trim().toLowerCase()

    // ── Sólo a quien acaba de registrarse ────────────────────────────────────
    // Esta ruta no puede exigir sesión: con confirmación de correo activada,
    // justo después de registrarse todavía no hay ninguna. Pero sin ningún
    // control aceptaba un `to` arbitrario, así que cualquiera podía hacer que
    // nuestra cuenta de Resend enviara correo a cualquier dirección, con
    // nuestro dominio de remitente — cuota quemada y dominio camino a las
    // listas negras.
    //
    // El compromiso: la dirección tiene que corresponder a una cuenta creada
    // en los últimos 15 minutos. El correo de bienvenida legítimo entra en esa
    // ventana siempre; para abusar de esto habría que registrar la cuenta
    // primero, que es justamente lo que hace que deje de ser útil como relay.
    const VENTANA_MINUTOS = 15
    let recienRegistrado = false

    try {
      const { data } = await getAdminClient()
        .from("profiles")
        .select("created_at")
        .eq("email", destino)
        .single()

      const creado = (data as { created_at?: string } | null)?.created_at
      if (creado) {
        const minutos = (Date.now() - new Date(creado).getTime()) / 60000
        recienRegistrado = minutos >= 0 && minutos <= VENTANA_MINUTOS
      }
    } catch {
      // Sin poder comprobarlo, no se envía. Falla cerrado.
    }

    if (!recienRegistrado) {
      // Misma respuesta que el camino feliz: decir "esa cuenta no existe" o
      // "no es reciente" convierte esta ruta en un detector de direcciones
      // registradas.
      return NextResponse.json({ success: true })
    }

    const result = await sendWelcomeEmail({
      to: destino,
      userName: userName.trim(),
    })

    if (!result.success) {
      // Log server-side but never leak internal details to the client
      return NextResponse.json(
        { success: false, error: 'No se pudo enviar el correo de bienvenida.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[api/email/welcome] Unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 },
    )
  }
}
