# Plantillas de los correos de autenticación

Estos dos HTML se pegan **en el panel de Supabase**, no los usa la app:
*Authentication → Email Templates*.

Son los correos que manda Supabase, no Resend: recuperar contraseña y
confirmar cuenta. Los de la app (pago aprobado, etc.) viven en
`src/lib/emails/templates.ts` y no tienen nada que ver con estos.

| Archivo | Plantilla de Supabase | Asunto sugerido |
|---|---|---|
| `recuperar-contrasena.html` | Reset Password | `Cambia tu contraseña · App Encuentra` |
| `confirmar-cuenta.html` | Confirm signup | `Confirma tu cuenta · App Encuentra` |

## Lo importante: el enlace usa `{{ .TokenHash }}`, no `{{ .ConfirmationURL }}`

La plantilla por defecto manda a la gente al endpoint de verificación de
Supabase, que después rebota a tu sitio. Eso tiene dos problemas que ya
costaron un rato:

1. Si la URL de destino no está en la lista de *Redirect URLs*, Supabase la
   ignora y te deja en el **Site URL** — que es como el enlace de recuperación
   acababa llevando a la portada en vez de al formulario.
2. El rebote llega con `?code=`, que es PKCE y **exige el verificador guardado
   por el navegador que pidió el enlace**. Pedir el correo en el ordenador y
   abrirlo en el móvil falla siempre.

Con `{{ .TokenHash }}` el enlace apunta **directo a la página**, sin pasar por
el rebote, y se verifica contra el servidor. Funciona entre dispositivos y no
depende de la lista de redirects.

Las dos páginas ya saben leerlo: `reset-password` y `confirm-email` prueban
primero `token_hash` y dejan `code` como respaldo para los enlaces ya enviados.

## Sigue haciendo falta

- **Site URL correcto**, porque las plantillas usan `{{ .SiteURL }}`. Hoy está
  en `https://www.encuentrapp.com/`, que el propio middleware redirige a otro
  dominio. Debe ser `https://appencuentra.com`.
- **SMTP propio** (*Authentication → Emails → SMTP Settings*) para que salgan
  de `App Encuentra <contacto@appencuentra.com>` por Resend en vez de "Supabase
  Auth". Host `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña una
  clave de API de Resend. Sin esto el diseño cambia pero el remitente no.

## Si cambia el logo

Las dos plantillas apuntan a `https://appencuentra.com/icons/icon-512.png`, que
es el icono a tamaño completo del repo. Al regenerarlo con
`node scripts/generar-iconos.mjs` el correo se actualiza solo: no hay copia del
dibujo aquí dentro.
