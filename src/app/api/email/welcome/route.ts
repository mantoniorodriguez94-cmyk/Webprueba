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

    const result = await sendWelcomeEmail({
      to: to.trim().toLowerCase(),
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
