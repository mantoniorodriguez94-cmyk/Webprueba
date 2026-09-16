import type { MetadataRoute } from "next"
import { createClient } from "@/utils/supabase/server"
import { SITIO } from "@/lib/seo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* El respaldo sale de la misma constante que usan el layout, los metadatos y
     las fichas. Antes estaba escrito a mano acá y apuntaba a
     https://encuentr.app, que es OTRO de los dominios y además redirige: si
     NEXT_PUBLIC_APP_URL faltara, el sitemap entero anunciaba las páginas bajo
     un host que no es el canónico — justo lo que un sitemap no debe hacer. */
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || SITIO

  // Cargar todos los negocios públicos.
  // La consulta va con el cliente normal, no con el de servicio, a propósito:
  // así las políticas de la base filtran solos los negocios ocultos, y no hay
  // que acordarse de excluirlos acá.
  const supabase = await createClient()
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, updated_at")
    .order("updated_at", { ascending: false })

  const portada: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ]

  /* Las páginas públicas que no son fichas. Faltaban las tres: existen, son
     indexables y no estaban en el sitemap, así que el buscador sólo llegaba a
     ellas si encontraba un enlace por su cuenta.
     Van sin `lastModified` a propósito: no cambian casi nunca, y poner la
     fecha de hoy en cada despliegue es decirle a Google que se actualizan a
     diario. Una fecha que miente entrena al buscador a ignorar el campo. */
  const paginasFijas: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/soporte`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
  ]

  const fichas: MetadataRoute.Sitemap = (businesses || []).map((business) => ({
    url: `${baseUrl}/negocio/${business.id}`,
    lastModified: business.updated_at ? new Date(business.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  return [...portada, ...paginasFijas, ...fichas]
}
