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

export const FROM_EMAIL = 'Encuentra <onboarding@resend.dev>'

