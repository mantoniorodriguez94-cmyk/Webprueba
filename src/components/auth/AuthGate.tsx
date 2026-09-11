"use client"

/**
 * Pantalla que ve alguien sin sesión al entrar a una zona que requiere cuenta.
 *
 * Reemplaza a la anterior ("Acceso restringido · Debes iniciar sesión", con un
 * candado y un único botón de login), que tenía dos problemas de fondo:
 *
 * 1. El encuadre era de castigo. Alguien que llega desde "Explorar el
 *    directorio" no está restringido: simplemente todavía no tiene cuenta.
 *    Un candado y la palabra "restringido" le dicen que hizo algo mal.
 * 2. Ofrecía la única puerta que esa persona no puede usar. Sin cuenta, el
 *    botón "Iniciar sesión" es un callejón sin salida.
 *
 * Acá la acción principal es crear la cuenta, iniciar sesión queda como
 * secundaria, y ambas llevan a dónde la persona quería ir (`next`), así que
 * al terminar aterriza en su destino y no en el inicio.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"

interface AuthGateProps {
  /** Qué va a poder hacer al crear la cuenta. Se usa en el titular. */
  accion?: string
  /** Frase de apoyo, si el contexto merece una explicación propia. */
  detalle?: string
}

export default function AuthGate({
  accion = "ver los negocios",
  detalle = "Es gratis y toma menos de un minuto. Después vas a poder buscar negocios cerca de ti, chatear con ellos y dejar reseñas.",
}: AuthGateProps) {
  const pathname = usePathname()
  const destino = encodeURIComponent(pathname || "/app/dashboard")

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center surface-elevated rounded-3xl p-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E24FD6] via-[#7C5CF0] to-[#5B9BF0] flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M16 20a6 6 0 0 0-8 0" />
            <circle cx="12" cy="9.5" r="3.5" />
            <path d="M19 4.5v5M21.5 7h-5" />
          </svg>
        </div>

        <h2 className="font-display text-2xl font-bold text-ink mb-3 text-balance">
          Creá tu cuenta para {accion}
        </h2>
        <p className="text-ink-2 mb-7">{detalle}</p>

        <Link
          href={`/app/auth/register?next=${destino}`}
          className="block w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3.5 rounded-2xl transition-colors font-semibold"
        >
          Crear cuenta gratis
        </Link>

        <p className="text-sm text-ink-2 mt-4">
          ¿Ya tenés cuenta?{" "}
          <Link
            href={`/app/auth/login?next=${destino}`}
            className="text-blue-600 font-semibold hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
