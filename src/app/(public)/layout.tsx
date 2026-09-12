"use client"

/**
 * Encabezado compartido de las páginas públicas anidadas: soporte, términos
 * y privacidad.
 *
 * Ninguna tenía forma de volver. Se llega a ellas desde el pie de la landing
 * o desde el perfil, y sin botón la única salida era el gesto del navegador
 * —que en la app instalada como PWA ni siquiera existe—. Son pantallas
 * anidadas, así que les corresponde volver, igual que a las subpantallas del
 * dashboard.
 *
 * Vive en un layout y no en cada página por el mismo motivo que la barra
 * inferior: si depende de que cada una se acuerde, alguna se olvida.
 */

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-black/10 barra-vidrio">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="-ml-2 flex-shrink-0 rounded-full p-2 text-ink-2 transition-colors hover:bg-black/5 hover:text-ink"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image
              src="/brand/encuentra-mark.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 flex-shrink-0"
              unoptimized
            />
            <span className="font-display truncate text-base font-bold text-ink">
              App Encuentra
            </span>
          </Link>
        </div>
      </header>

      {children}
    </div>
  )
}
