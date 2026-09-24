"use client"

/**
 * Las promociones de los negocios que patrocinan la plataforma.
 *
 * Vivía dentro de PromotionsSpotlight, que era su único consumidor. Ahora son
 * dos: la vitrina en sí y el contador del chip "Promociones" del feed, que
 * necesita saber CUÁNTAS hay antes de que nadie abra la pestaña.
 *
 * Se extrae acá y no se copia porque no es una consulta, son tres encadenadas
 * —promociones vigentes, sus negocios, los dueños con Patrocina al día— y
 * mantener dos copias de eso en sincronía es cuestión de tiempo.
 */

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { SUBSCRIPTION_TIER_PATROCINA, isTierActive } from "@/lib/memberships/tiers"
import { perkVigente } from "@/lib/memberships/perks"

export interface PromocionPatrocinada {
  id: string
  name: string
  price: number | null
  start_date: string
  end_date: string
  business_id: string
  business_name: string
}

/* Una sola cadena de consultas por carga de página, compartida.
   Sin esto los dos consumidores dispararían las tres consultas cada uno: seis
   viajes para pintar una vitrina y un número. Se guarda la PROMESA, no el
   resultado, para que dos componentes que montan a la vez se enganchen al
   mismo viaje en vez de lanzar uno cada uno.

   El caché dura lo que dure la pestaña abierta. Las promociones se dan de alta
   por día, no por minuto, así que no merece un TTL; quien acabe de crear una y
   quiera verla, recarga. */
let enCurso: Promise<PromocionPatrocinada[]> | null = null

/** Para las pruebas y para quien necesite forzar una relectura. */
export function olvidarPromocionesCacheadas() {
  enCurso = null
}

async function cargar(): Promise<PromocionPatrocinada[]> {
  const hoy = new Date().toISOString().split("T")[0]

  const { data: promociones, error: errorPromos } = await supabase
    .from("promotions")
    .select("id, name, price, start_date, end_date, business_id")
    .eq("is_active", true)
    .lte("start_date", hoy)
    .gte("end_date", hoy)
    .order("created_at", { ascending: false })
    .limit(20)

  if (errorPromos || !promociones?.length) return []

  const idsNegocios = [...new Set(promociones.map((p) => p.business_id))]
  const { data: negocios, error: errorNegocios } = await supabase
    .from("businesses")
    .select("id, name, owner_id, perk_promociones_hasta")
    .in("id", idsNegocios)

  if (errorNegocios || !negocios?.length) return []

  const idsDuenos = [...new Set(negocios.map((n) => n.owner_id))]
  /* El filtro por columna (.eq subscription_tier) no distingue un pago vigente
     de uno vencido hace meses — se trae también subscription_end_date y se
     filtra con isTierActive, la misma comprobación que usa el resto de la app. */
  const { data: perfiles, error: errorPerfiles } = await supabase
    .from("profiles")
    .select("id, subscription_tier, subscription_end_date")
    .in("id", idsDuenos)
    .eq("subscription_tier", SUBSCRIPTION_TIER_PATROCINA)

  if (errorPerfiles) return []

  const duenosPatrocinadores = new Set(
    (perfiles || [])
      .filter((p: any) => isTierActive(p.subscription_tier, p.subscription_end_date))
      .map((p) => p.id)
  )
  const porId = new Map(negocios.map((n) => [n.id, n]))

  // Entra en la vitrina quien tiene Patrocina vigente, o quien recibió el
  // módulo suelto desde el panel mientras la concesión no caduque.
  return promociones
    .filter((p) => {
      const negocio = porId.get(p.business_id)
      if (!negocio) return false
      return (
        duenosPatrocinadores.has(negocio.owner_id) ||
        perkVigente(
          (negocio as { perk_promociones_hasta?: string | null }).perk_promociones_hasta
        )
      )
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      start_date: p.start_date,
      end_date: p.end_date,
      business_id: p.business_id,
      business_name: porId.get(p.business_id)!.name,
    }))
}

export default function usePromocionesPatrocinadas() {
  const [promociones, setPromociones] = useState<PromocionPatrocinada[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true

    if (!enCurso) enCurso = cargar()

    enCurso
      .catch((err) => {
        console.error("[promociones] Error:", err)
        // Un fallo no se queda cacheado: el siguiente que monte reintenta.
        enCurso = null
        return [] as PromocionPatrocinada[]
      })
      .then((lista) => {
        if (!vigente) return
        setPromociones(lista)
        setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [])

  return { promociones, cargando }
}
