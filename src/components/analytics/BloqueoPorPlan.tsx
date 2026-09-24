"use client"

import Link from "next/link"
import { Lock } from "lucide-react"
import { getLabelForTier, type SubscriptionTier } from "@/lib/memberships/tiers"

/**
 * Envuelve un bloque de estadísticas y lo deja borroso si el plan no alcanza.
 *
 * Borroso y no escondido a propósito: quien no tiene el plan ve que el dato
 * EXISTE —que hay barras, que hay un número de tres cifras— sin poder leerlo.
 * Una sección vacía no despierta nada; una tapada sí, porque ya sabe que se
 * está perdiendo algo concreto suyo.
 *
 * El contenido real se sigue renderizando debajo del velo. Eso es deliberado
 * para el efecto visual, así que acá NO va nada que deba mantenerse en
 * secreto: cualquiera con las herramientas del navegador puede leerlo. Sirve
 * para vender un plan, no para proteger datos.
 */
export default function BloqueoPorPlan({
  desbloqueado,
  tierRequerido,
  children,
}: {
  desbloqueado: boolean
  tierRequerido: SubscriptionTier
  children: React.ReactNode
}) {
  if (desbloqueado) return <>{children}</>

  return (
    <div className="relative">
      <div className="blur-[6px] select-none pointer-events-none" aria-hidden>
        {children}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-white/40 dark:bg-paper/60 p-4 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-paper-2 shadow-sm">
          <Lock className="h-5 w-5 text-ink-2" />
        </span>
        <p className="text-sm font-semibold text-ink">
          Disponible con {getLabelForTier(tierRequerido)}
        </p>
        <Link
          href="/app/dashboard/membresia"
          className="rounded-full bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-600"
        >
          Ver planes
        </Link>
      </div>
    </div>
  )
}
