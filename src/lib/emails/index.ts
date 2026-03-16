/**
 * Resend email utility — server-side only.
 *
 * IMPORTANT: This module must only be imported in server-side code
 * (API Routes, Server Actions, Server Components, middleware).
 * Never import it in Client Components — RESEND_API_KEY is a server secret.
 *
 * Usage:
 *   import { sendWelcomeEmail } from '@/lib/emails'
 *   const result = await sendWelcomeEmail({ to: 'user@example.com', userName: 'María' })
 */

import { Resend } from 'resend'

// ── Resend client ────────────────────────────────────────────────────────────
// Instantiated lazily from the environment variable so the build never fails
// when the key is absent (e.g. CI without secrets).
const apiKey = process.env.RESEND_API_KEY

if (!apiKey && process.env.NODE_ENV === 'production') {
  console.error('[email] RESEND_API_KEY is not set — emails will not be sent.')
}

export const resend = apiKey ? new Resend(apiKey) : null

// ── Shared sender identity ───────────────────────────────────────────────────
// Must match the domain verified in the Resend dashboard.
const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? 'contacto@appencuentra.com'
const FROM_NAME =
  process.env.RESEND_FROM_NAME ?? 'App Encuentra'
const FROM = `${FROM_NAME} <${FROM_ADDRESS}>`
const REPLY_TO = process.env.RESEND_FROM_REPLY_TO ?? FROM_ADDRESS
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://appencuentra.com'

// ── Result type ──────────────────────────────────────────────────────────────
export type EmailResult =
  | { success: true; id: string }
  | { success: false; error: string }

// ── sendWelcomeEmail ─────────────────────────────────────────────────────────
export interface SendWelcomeEmailProps {
  /** Recipient email address */
  to: string
  /** User's display name used inside the email body */
  userName: string
}

/**
 * Sends a branded Welcome Email to a newly registered user.
 *
 * Fires-and-forgets safely — never throws; always returns an `EmailResult`.
 */
export async function sendWelcomeEmail({
  to,
  userName,
}: SendWelcomeEmailProps): Promise<EmailResult> {
  if (!resend) {
    console.warn('[email] sendWelcomeEmail skipped — Resend client not initialised (RESEND_API_KEY missing?)')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [to],
      replyTo: REPLY_TO,
      subject: '¡Bienvenido a App Encuentra! 🎉',
      html: WelcomeEmailTemplate({ userName, appUrl: APP_URL }),
    })

    if (error) {
      console.error('[email] sendWelcomeEmail failed:', error)
      return { success: false, error: (error as any).message ?? 'Resend API error' }
    }

    return { success: true, id: (data as any)?.id ?? 'sent' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[email] sendWelcomeEmail threw:', msg)
    return { success: false, error: msg }
  }
}

// ── sendChatNotificationEmail ────────────────────────────────────────────────
export interface SendChatNotificationEmailProps {
  /** Business owner's email address */
  to: string
  /** Name of the business that received the message */
  businessName: string
  /** Display name of the visitor who sent the message */
  senderName: string
  /** First line of the message (optional preview) */
  messagePreview?: string
}

/**
 * Notifies a business owner that they have received a new chat message.
 *
 * Fire-and-forgets safely — never throws; always returns an `EmailResult`.
 */
export async function sendChatNotificationEmail({
  to,
  businessName,
  senderName,
  messagePreview,
}: SendChatNotificationEmailProps): Promise<EmailResult> {
  if (!resend) {
    console.warn('[email] sendChatNotificationEmail skipped — Resend client not initialised')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [to],
      replyTo: REPLY_TO,
      subject: `💬 Nuevo mensaje de ${senderName} en Portal Encuentra`,
      html: ChatNotificationEmailTemplate({ businessName, senderName, messagePreview, appUrl: APP_URL }),
    })

    if (error) {
      console.error('[email] sendChatNotificationEmail failed:', error)
      return { success: false, error: (error as any).message ?? 'Resend API error' }
    }

    return { success: true, id: (data as any)?.id ?? 'sent' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[email] sendChatNotificationEmail threw:', msg)
    return { success: false, error: msg }
  }
}

// ── Chat Notification Email HTML template ─────────────────────────────────────
function ChatNotificationEmailTemplate({
  businessName,
  senderName,
  messagePreview,
  appUrl,
}: {
  businessName: string
  senderName: string
  messagePreview?: string
  appUrl: string
}): string {
  const inboxUrl = `${appUrl}/app/dashboard`
  const previewHtml = messagePreview
    ? `<table role="presentation" style="width:100%;border-collapse:collapse;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;margin:24px 0;">
        <tr>
          <td style="padding:14px 18px;color:#166534;font-size:14px;font-style:italic;line-height:1.6;">
            "${messagePreview.length > 120 ? messagePreview.slice(0, 120) + '…' : messagePreview}"
          </td>
        </tr>
      </table>`
    : ''

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nuevo mensaje en Portal Encuentra</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f3f4f6;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f3f4f6;padding:20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width:600px;width:100%;border-collapse:collapse;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:36px 24px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:36px;">💬</p>
              <h1 style="margin:0 0 6px 0;color:#ffffff;font-size:24px;font-weight:bold;">
                Nuevo mensaje recibido
              </h1>
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:15px;">
                Para: <strong>${businessName}</strong>
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 16px 0;color:#1f2937;font-size:16px;line-height:1.7;">
                ¡Hola! El usuario <strong>${senderName}</strong> te ha enviado un nuevo mensaje a través de
                <strong>Portal Encuentra</strong>.
              </p>

              ${previewHtml}

              <p style="margin:0 0 28px 0;color:#374151;font-size:15px;line-height:1.7;">
                No hagas esperar a tu cliente — una respuesta rápida genera confianza y más ventas. 🚀
              </p>

              <!-- CTA button -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${inboxUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:700;font-size:16px;letter-spacing:0.3px;">
                  Ver y Responder Mensaje →
                </a>
              </div>

              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
                Si no esperabas este mensaje, puedes ignorarlo con seguridad.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 6px 0;color:#6b7280;font-size:13px;">
                Notificación automática de <strong>Portal Encuentra</strong>.
              </p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} App Encuentra — Todos los derechos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// ── Welcome Email HTML template ──────────────────────────────────────────────
function WelcomeEmailTemplate({
  userName,
  appUrl,
}: {
  userName: string
  appUrl: string
}): string {
  const firstName = userName.split(' ')[0] || userName
  const dashboardUrl = `${appUrl}/app/dashboard`

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>¡Bienvenido a App Encuentra!</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f3f4f6;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f3f4f6;padding:20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width:600px;width:100%;border-collapse:collapse;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0288D1 0%,#0277BD 100%);padding:40px 24px;text-align:center;">
              <h1 style="margin:0 0 8px 0;color:#ffffff;font-size:32px;font-weight:bold;letter-spacing:-0.5px;">
                ¡Bienvenido, ${firstName}! 🎉
              </h1>
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:16px;">
                Tu cuenta en App Encuentra está lista
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <p style="margin:0 0 20px 0;color:#1f2937;font-size:16px;line-height:1.7;">
                ¡Hola <strong>${firstName}</strong>! Nos alegra tenerte aquí.
              </p>

              <p style="margin:0 0 24px 0;color:#374151;font-size:15px;line-height:1.7;">
                Tu cuenta ha sido creada exitosamente. Ahora puedes explorar y descubrir negocios locales, o publicar el tuyo para que más clientes te encuentren.
              </p>

              <!-- Feature list -->
              <table role="presentation" style="width:100%;border-collapse:collapse;background:#f0f9ff;border-radius:10px;padding:4px;margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 10px 0;color:#0277BD;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                      ¿Qué puedes hacer?
                    </p>
                    <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
                      <li>Explorar negocios locales por categoría</li>
                      <li>Guardar tus negocios favoritos</li>
                      <li>Publicar y gestionar tu propio negocio</li>
                      <li>Acceder a planes premium para más visibilidad</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${dashboardUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#0288D1 0%,#0277BD 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:700;font-size:16px;letter-spacing:0.3px;">
                  Ir a mi Dashboard →
                </a>
              </div>

              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;text-align:center;">
                Si tienes alguna duda, simplemente responde a este correo y te ayudamos con gusto.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 6px 0;color:#6b7280;font-size:13px;">
                Este correo fue enviado porque te registraste en <strong>App Encuentra</strong>.
              </p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} App Encuentra — Todos los derechos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
