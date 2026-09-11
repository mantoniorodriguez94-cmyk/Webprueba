/**
 * Recibe los mensajes del formulario de soporte.
 *
 * Hace dos cosas a propósito: guarda en la base Y envía un correo. Si el
 * correo se pierde o cae en spam, el reclamo sigue existiendo en el panel;
 * si la base fallara, al menos llega el aviso. Un solo canal deja agujeros.
 */

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { resend, FROM_EMAIL } from "@/lib/resend"

const CORREO_SOPORTE = process.env.SUPPORT_EMAIL ?? "contacto@appencuentra.com"

const LIMITES = { name: 80, email: 160, subject: 120, message: 4000 }

function textoValido(valor: unknown, max: number): valor is string {
  return typeof valor === "string" && valor.trim().length > 0 && valor.trim().length <= max
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 })
    }

    const name = String(body.name ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()
    const subject = String(body.subject ?? "").trim()
    const message = String(body.message ?? "").trim()

    // Validación en el servidor: el cliente puede saltearse la del formulario.
    if (
      !textoValido(name, LIMITES.name) ||
      !textoValido(email, LIMITES.email) ||
      !textoValido(subject, LIMITES.subject) ||
      !textoValido(message, LIMITES.message)
    ) {
      return NextResponse.json(
        { error: "Revisá los campos: todos son obligatorios y tienen un largo máximo." },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "El correo no parece válido." }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: errorBase } = await supabase.from("support_messages").insert({
      user_id: typeof body.userId === "string" ? body.userId : null,
      plan_tier: typeof body.planTier === "number" ? body.planTier : null,
      name,
      email,
      subject,
      message,
    })

    if (errorBase) {
      console.error("[soporte] No se pudo guardar el mensaje:", errorBase.message)
      return NextResponse.json(
        { error: "No pudimos registrar tu mensaje. Intentá de nuevo en un momento." },
        { status: 500 }
      )
    }

    // El correo es el aviso, no el registro: si falla, el mensaje ya está a
    // salvo en la base, así que no se le devuelve error a la persona.
    if (resend) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: CORREO_SOPORTE,
          // Así se responde directo al cliente desde el correo, sin copiar
          // la dirección a mano.
          replyTo: email,
          subject: `[Soporte] ${subject}`,
          text: [
            `De: ${name} <${email}>`,
            body.planTier ? `Plan: nivel ${body.planTier}` : "Plan: sin membresía",
            body.userId ? `Usuario: ${body.userId}` : "Usuario: sin sesión",
            "",
            message,
          ].join("\n"),
        })
      } catch (errorCorreo) {
        console.error("[soporte] Mensaje guardado pero el correo falló:", errorCorreo)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[soporte] Error inesperado:", err)
    return NextResponse.json({ error: "Error inesperado. Intentá de nuevo." }, { status: 500 })
  }
}
