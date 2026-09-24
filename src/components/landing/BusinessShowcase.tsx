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
 *
 * Los iconos de categoría son SVG dibujados acá: no pesan archivos, no tienen
 * licencia que respetar y heredan el color de la paleta.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import DistanceBadge from "@/components/ui/DistanceBadge"

const MIN_REALES = 6
const CUPOS = 6

type Negocio = {
  id: string
  name: string
  category: string | null
  logo_url?: string | null
  rating?: number | null
  latitude?: number | null
  longitude?: number | null
  /** Solo para los ejemplos: la distancia real sale de DistanceBadge. */
  distanciaEjemplo?: string
}

/** Degradados de la paleta, para las tarjetas sin foto. */
const TELONES = [
  "from-[#DAD3F5] to-[#C9D9F6]",
  "from-[#C9D9F6] to-[#C3CFE0]",
  "from-[#C3CFE0] to-[#D9EDE7]",
  "from-[#D9EDE7] to-[#DAD3F5]",
  "from-[#DAD3F5] to-[#C3CFE0]",
  "from-[#C9D9F6] to-[#D9EDE7]",
]

/* ── Iconos de categoría ──────────────────────────────────────────────
   Trazo simple, 24×24, heredan currentColor. Se usan tanto en los
   ejemplos como en los negocios reales que todavía no subieron logo. */

const ICONOS: Record<string, React.ReactNode> = {
  panaderia: (
    <>
      <ellipse cx="12" cy="13" rx="9" ry="6" />
      <path d="M8 10.5 6.5 13M12 10l-1.5 3M16 10.5 14.5 13" />
    </>
  ),
  repuestos: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" />
    </>
  ),
  belleza: (
    <>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="6" cy="6" r="2.5" />
      <path d="M8.1 7.4 20 18M8.1 16.6 20 6" />
    </>
  ),
  ferreteria: (
    <>
      <path d="M17.7 6.3a4.2 4.2 0 0 1-5.4 5.4l-6 6a1.8 1.8 0 1 0 2.5 2.5l6-6a4.2 4.2 0 0 0 5.4-5.4l-2.6 2.6-2.2-.4-.4-2.2 2.7-2.5Z" />
    </>
  ),
  cafeteria: (
    <>
      <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
      <path d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M8 3v2.5M12 3v2.5" />
    </>
  ),
  veterinaria: (
    <>
      <ellipse cx="8" cy="8.5" rx="1.9" ry="2.4" />
      <ellipse cx="16" cy="8.5" rx="1.9" ry="2.4" />
      <ellipse cx="4.8" cy="13.8" rx="1.7" ry="2.1" />
      <ellipse cx="19.2" cy="13.8" rx="1.7" ry="2.1" />
      <path d="M12 12.5c3 0 5 2.2 5 4.4 0 1.9-1.6 3.1-3.4 2.8-.9-.2-2.3-.2-3.2 0-1.8.3-3.4-.9-3.4-2.8 0-2.2 2-4.4 5-4.4Z" />
    </>
  ),
  generico: (
    <>
      <path d="M3.5 9.5h17v10a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-10Z" />
      <path d="M3 9.5 5 4h14l2 5.5" />
      <path d="M9.5 21v-5h5v5" />
    </>
  ),
}

/** Empareja la categoría escrita por el dueño con un icono. */
function iconoDe(categoria: string | null | undefined): React.ReactNode {
  const c = (categoria || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (/pan|reposter|pastel|dulc/.test(c)) return ICONOS.panaderia
  if (/repuesto|auto|taller|mecanic|carro|moto/.test(c)) return ICONOS.repuestos
  if (/bellez|peluqu|salon|barber|estetic|uñas|una/.test(c)) return ICONOS.belleza
  if (/ferreter|herramient|construc|plomer|electric/.test(c)) return ICONOS.ferreteria
  if (/cafe|restaur|comida|bar|pizzer|panader|food/.test(c)) return ICONOS.cafeteria
  if (/veterinar|mascot|animal|petshop|pet/.test(c)) return ICONOS.veterinaria
  return ICONOS.generico
}

const EJEMPLOS: Negocio[] = [
  { id: "e1", name: "Panadería La Espiga", category: "Panadería", rating: 4.8, distanciaEjemplo: "1,2 km" },
  { id: "e2", name: "Repuestos El Volante", category: "Repuestos", rating: 4.6, distanciaEjemplo: "3,4 km" },
  { id: "e3", name: "Peluquería Brenda", category: "Belleza", rating: 4.9, distanciaEjemplo: "650 m" },
  { id: "e4", name: "Ferretería Central", category: "Ferretería", rating: 4.5, distanciaEjemplo: "2,1 km" },
  { id: "e5", name: "Café Arábica", category: "Cafetería", rating: 4.7, distanciaEjemplo: "900 m" },
  { id: "e6", name: "Veterinaria Patitas", category: "Veterinaria", rating: 4.8, distanciaEjemplo: "1,8 km" },
]

function IconoPin() {
  return (
    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  )
}

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
      <div
        className={`relative h-32 sm:h-36 bg-gradient-to-br ${TELONES[indice % TELONES.length]} flex items-center justify-center`}
      >
        {negocio.logo_url ? (
          <Image
            src={negocio.logo_url}
            alt={negocio.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="w-14 h-14 text-ink/25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {iconoDe(negocio.category)}
          </svg>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display font-bold text-ink leading-snug mb-1.5 line-clamp-2">
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

        {/* La distancia es el diferencial del producto, así que va destacada.
            En los reales sale de la ubicación del visitante y desaparece sola
            si no dio permiso; en los ejemplos es parte de la vista previa. */}
        <div className="mt-2.5">
          {esEjemplo ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
              <IconoPin />
              <span className="font-mono tabular-nums">{negocio.distanciaEjemplo}</span>
            </span>
          ) : (
            <DistanceBadge latitude={negocio.latitude ?? null} longitude={negocio.longitude ?? null} />
          )}
        </div>
      </div>
    </>
  )

  const clases =
    "block overflow-hidden rounded-2xl bg-white dark:bg-paper-2 border border-black/5 dark:border-white/10 shadow-sm transition-shadow hover:shadow-lg"

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
  const { user } = useUser()

  useEffect(() => {
    let vigente = true

    const traer = async () => {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("id, name, category, logo_url, latitude, longitude")
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
            ? "Panaderías, talleres, peluquerías y servicios cerca de ti — con la distancia exacta, reseñas reales y chat directo."
            : "Una vista previa del directorio, con la distancia a cada negocio. Estos son ejemplos: los negocios reales aparecen acá a medida que se registran."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
        {aMostrar.map((negocio, i) => (
          <Tarjeta key={negocio.id} negocio={negocio} indice={i} esEjemplo={!hayCatalogo} />
        ))}
      </div>

      <div className="text-center mt-10">
        <Link
          /* A login, no a registro: esto es "ver negocios", o sea navegar, y
             quien navega suele tener cuenta ya. El login ofrece crear una
             justo debajo. Los botones de "publica tu negocio" sí van a
             registro, porque ahí el alta es el objetivo. */
          href={user ? "/app/dashboard" : `/app/auth/login?next=${encodeURIComponent("/app/dashboard")}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-ink hover:bg-ink/90 dark:bg-white/10 dark:hover:bg-white/15 dark:border dark:border-white/15 text-white font-semibold transition-colors"
        >
          {hayCatalogo ? "Ver todos los negocios" : "Explorar el directorio"}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}
