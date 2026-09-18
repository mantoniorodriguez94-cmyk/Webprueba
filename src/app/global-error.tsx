"use client"

/**
 * El último recurso: se activa cuando revienta el propio layout raíz.
 *
 * `error.tsx` cubre los fallos DENTRO del layout. Si el que falla es el layout
 * —una fuente que no carga, un proveedor que lanza al montar— ese boundary
 * nunca llega a existir, y sin este archivo la persona ve la pantalla desnuda
 * de Next.
 *
 * ── POR QUÉ ESTÁ ESCRITO CON ESTILOS EN LÍNEA ───────────────────────────────
 *
 * Porque reemplaza al layout raíz por completo: tiene que traer su propio
 * <html> y su propio <body>, y no hereda nada. Podría usar las clases de
 * Tailwind, pero sería apostar a que la hoja de estilos cargó — y una hoja que
 * no carga es justo una de las cosas que pueden haber provocado este error.
 *
 * Una pantalla de último recurso que depende de lo que puede estar roto no es
 * una pantalla de último recurso. Los colores van copiados de la paleta a
 * mano, y esa duplicación es deliberada: si algún día cambian, que esta
 * pantalla se vea un poco distinta es mucho mejor que no verse.
 */

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app] Error global:", error, error.digest)
    /* Y a Sentry, que es quien lo va a ver. La consola vive en el navegador
       del usuario y no la lee nadie: sin esta línea, la pantalla de error es
       bonita y el fallo sigue siendo invisible. */
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          backgroundColor: "#E7E4F0",
          color: "#0E0E16",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            textAlign: "center",
            backgroundColor: "#F7F5FC",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "24px",
            padding: "32px",
          }}
        >
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 12px" }}>
            App Encuentra no pudo cargar
          </h1>

          <p style={{ color: "#6B6B78", lineHeight: 1.5, margin: "0 0 28px" }}>
            Algo falló antes de que la aplicación arrancara. Suele ser pasajero.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              width: "100%",
              backgroundColor: "#5B4FE8",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "16px",
              padding: "14px 24px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>

          {/* Un <a> normal y no un <Link>, a propósito.
              `Link` navega del lado del cliente: conserva vivo el mismo
              contexto de JavaScript que acaba de reventar, así que hay
              bastantes posibilidades de volver a caer aquí. Un enlace normal
              provoca una carga completa, que es justo lo que hace falta desde
              una pantalla rota — tira todo el estado y empieza de cero. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              display: "block",
              marginTop: "12px",
              padding: "12px 24px",
              borderRadius: "16px",
              backgroundColor: "rgba(0,0,0,0.05)",
              color: "#0E0E16",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Ir al inicio
          </a>
        </div>
      </body>
    </html>
  )
}
