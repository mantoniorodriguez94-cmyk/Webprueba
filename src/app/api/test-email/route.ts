import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY is not defined in environment variables.' },
      { status: 500 }
    )
  }

  try {
    const data = await resend.emails.send({
      from: 'Portal Encuentra <contacto@appencuentra.com>',
      to: ['mantoniorodriguez@gmail.com'],
      subject: 'Prueba de Integración Resend 🚀',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px; max-width: 600px;">
          <h2 style="color: #0056b3;">¡Sistemas en línea!</h2>
          <p>Hola,</p>
          <p>Si estás leyendo esto, significa que <strong>Resend</strong> está perfectamente conectado con el dominio <em>appencuentra.com</em> y tu aplicación Next.js.</p>
          <p>¡El motor de correos está listo para producción!</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'Email sent successfully!', data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Test Email Error:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
