"use client"

/**
 * Muestra negocios en la landing con un interruptor automático:
 *
 * - Mientras haya menos de MIN_REALES negocios en la base, enseña una vista
 *   previa del producto con ejemplos, enmarcada como tal. Los ejemplos viven
 *   acá, NUNCA en la base de datos: si se cargaran como negocios ficticios
 *   aparecerían en el feed, en la búsqueda y en los conteos del admin, y un
 *   usuario intentaría escribirle a un negocio que no existe.
 * - A partir de MIN_REALES, cambia sola a negocios reales. No hay que volver
 *   a tocar este archivo cuando la plataforma crezca.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"

const MIN_REALES = 6
const CUPOS = 6

type Negocio = {
  id: string
  name: string
  category: string | null
  logo_url?: string | null
  rating?: number | null
}

/** Degradados de la paleta, para los ejemplos que no tienen foto. */
const TELONES = [
  "from-[#DAD3F5] to-[#C9D9F6]",
  "from-[#C9D9F6] to-[#C3CFE0]",
  "from-[#C3CFE0] to-[#D9EDE7]",
  "from-[#D9EDE7] to-[#DAD3F5]",
  "from-[#DAD3F5] to-[#C3CFE0]",
  "from-[#C9D9F6] to-[#D9EDE7]",
]

const EJEMPLOS: Negocio[] = [
  { id: "e1", name: "Panadería La Espiga", category: "Panadería", rating: 4.8 },
  { id: "e2", name: "Repuestos El Volante", category: "Repuestos", rating: 4.6 },
  { id: "e3", name: "Peluquería Brenda", category: "Belleza", rating: 4.9 },
  { id: "e4", name: "Ferretería Central", category: "Ferretería", rating: 4.5 },
  { id: "e5", name: "Café Arábica", category: "Cafetería", rating: 4.7 },
  { id: "e6", name: "Veterinaria Patitas", category: "Veterinaria", rating: 4.8 },
]

function Tarjeta({
  negocio,
  indice,
  esEjemplo,
}: {
  negocio: Negocio
  indice: number
  esEjemplo: boolean
}) {
  const contenido = (
    <>
      <div className={`relative h-32 sm:h-36 bg-gradient-to-br ${TELONES[indice % TELONES.length]}`}>
        {negocio.logo_url && (
          <Image
            src={negocio.logo_url}
            alt={negocio.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display font-bold text-ink leading-snug mb-1 line-clamp-1">
          {negocio.name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-ink-2">
          <span className="line-clamp-1">{negocio.category || "Negocio"}</span>
          {typeof negocio.rating === "number" && (
            <>
              <span aria-hidden="true" className="opacity-40">·</span>
              <span className="font-mono text-xs tabular-nums whitespace-nowrap">
                {negocio.rating.toFixed(1).replace(".", ",")}
              </span>
            </>
          )}
        </div>
      </div>
    </>
  )

  const clases =
    "block overflow-hidden rounded-2xl bg-white border border-black/5 shadow-sm transition-shadow hover:shadow-lg"

  // Los ejemplos no enlazan a ningún lado: no existe un negocio detrás.
  return esEjemplo ? (
    <div className={clases}>{contenido}</div>
  ) : (
    <Link href={`/negocio/${negocio.id}`} className={clases}>
      {contenido}
    </Link>
  )
}

export default function BusinessShowcase() {
  const [reales, setReales] = useState<Negocio[] | null>(null)

  useEffect(() => {
    let vigente = true

    const traer = async () => {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("id, name, category, logo_url")
          .limit(CUPOS)

        if (error || !data || !vigente) return

        // Las calificaciones son un extra: si fallan, las tarjetas se muestran
        // igual, solo sin el número.
        const { data: stats } = await supabase
          .from("business_review_stats")
          .select("business_id, average_rating")
          .in(
            "business_id",
            data.map((n) => n.id)
          )

        if (!vigente) return

        const porId = new Map((stats || []).map((s) => [s.business_id, s.average_rating]))
        setReales(data.map((n) => ({ ...n, rating: porId.get(n.id) ?? null })))
      } catch {
        // Sin conexión o sin permisos: se queda la vista previa.
      }
    }

    traer()
    return () => {
      vigente = false
    }
  }, [])

  const hayCatalogo = (reales?.length ?? 0) >= MIN_REALES
  const aMostrar = hayCatalogo ? reales! : EJEMPLOS

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-3 text-balance">
          {hayCatalogo ? "Negocios en Encuentra" : "Así se ven los negocios en Encuentra"}
        </h2>
        <p className="text-ink-2 max-w-xl mx-auto">
          {hayCatalogo
            ? "Panaderías, talleres, peluquerías y servicios cerca de ti — con reseñas reales y chat directo."
            : "Una vista previa del directorio. Estos son ejemplos: los negocios reales aparecen acá a medida que se registran."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
        {aMostrar.map((negocio, i) => (
          <Tarjeta key={negocio.id} negocio={negocio} indice={i} esEjemplo={!hayCatalogo} />
        ))}
      </div>

      <div className="text-center mt-10">
        <Link
          href="/app/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-ink text-white font-semibold hover:bg-ink/90 transition-colors"
        >
          {hayCatalogo ? "Ver todos los negocios" : "Explorar el directorio"}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}
