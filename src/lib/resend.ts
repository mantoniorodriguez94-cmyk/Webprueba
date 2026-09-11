/**
 * Cliente de Resend para envío de correos electrónicos
 */

import { Resend } from 'resend'

// Inicializar Resend solo si hay API key (evita errores durante build)
export const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY no está configurada. El envío de correos no funcionará.')
}

/**
 * Remitente de los correos transaccionales.
 *
 * Antes era 'onboarding@resend.dev', el remitente de PRUEBAS de Resend: en el
 * plan gratuito solo entrega a la casilla del dueño de la cuenta. Los correos
 * de aprobación y rechazo de pagos lo usaban, así que un cliente que pagaba y
 * era aprobado probablemente nunca recibía la confirmación.
 *
 * Ahora sale del mismo lugar que el resto de los correos de la app, para que
 * haya un solo remitente configurable y no dos criterios distintos.
 *
 * Requiere tener el dominio verificado en Resend (registros DNS de SPF y DKIM).
 */
export const FROM_EMAIL = `${process.env.RESEND_FROM_NAME ?? 'App Encuentra'} <${
  process.env.RESEND_FROM_EMAIL ?? 'contacto@appencuentra.com'
}>`

