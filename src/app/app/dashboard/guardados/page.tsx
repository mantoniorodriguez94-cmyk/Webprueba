"use client"

/**
 * Negocios guardados.
 *
 * Existía el botón de marcador en las tarjetas del feed, que sí escribía en
 * `business_saves`, pero no había ninguna pantalla para recuperar lo guardado:
 * la gente podía guardar negocios y no volver a encontrarlos nunca. Esta
 * pantalla cierra ese circuito y le da sentido al botón.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bookmark } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import AuthGate from "@/components/auth/AuthGate"
import BusinessFeedCard from "@/components/feed/BusinessFeedCard"
import type { Business } from "@/types/business"

export default function GuardadosPage() {
  const { user, loading: userLoading } = useUser()
  const [negocios, setNegocios] = useState<Business[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true

    const traer = async () => {
      if (userLoading) return
      if (!user) {
        setCargando(false)
        return
      }

      try {
        const { data: guardados, error } = await supabase
          .from("business_saves")
          .select("business_id")
          .eq("user_id", user.id)

        if (error || !guardados?.length) {
          if (vigente) {
            setNegocios([])
            setCargando(false)
          }
          return
        }

        const { data: filas } = await supabase
          .from("businesses")
          .select("*")
          .in(
            "id",
            guardados.map((g) => g.business_id)
          )

        if (vigente) setNegocios((filas as Business[]) ?? [])
      } catch (err) {
        console.warn("[guardados] No se pudieron cargar:", err)
      } finally {
        if (vigente) setCargando(false)
      }
    }

    traer()
    return () => {
      vigente = false
    }
  }, [user, userLoading])

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!user) {
    return (
      <AuthGate
        accion="guardar negocios"
        detalle="Con tu cuenta podés guardar los negocios que te interesan y volver a encontrarlos acá cuando los necesites."
      />
    )
  }

  return (
    <div className="min-h-screen lg:pb-10">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-ink leading-tight">Guardados</h1>
            <p className="text-xs text-ink-2">
              {cargando
                ? "Cargando…"
                : `${negocios.length} negocio${negocios.length !== 1 ? "s" : ""} guardado${negocios.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {cargando ? (
          <div className="text-center py-16">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-blue-500" />
          </div>
        ) : negocios.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-5">
              <Bookmark className="w-9 h-9 text-ink-2/50" />
            </div>
            <h2 className="font-display text-xl font-bold text-ink mb-2">
              Todavía no guardaste ningún negocio
            </h2>
            <p className="text-ink-2 mb-6 max-w-sm mx-auto">
              Tocá el marcador en cualquier negocio del directorio y lo vas a encontrar acá
              cuando lo necesites.
            </p>
            <Link
              href="/app/dashboard"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-2xl transition-colors"
            >
              Explorar negocios
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {negocios.map((negocio) => (
              <BusinessFeedCard key={negocio.id} business={negocio} currentUser={user} />
            ))}
          </div>
        )}
      </main>

    </div>
  )
}
