import { createClient } from "@/utils/supabase/server"

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://encuentr.app"
  
  // Cargar todos los negocios públicos
  const supabase = await createClient()
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, updated_at")
    .order("updated_at", { ascending: false })

  // URLs estáticas
  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0
    }
  ]

  // URLs de negocios públicos
  const businessUrls = (businesses || []).map((business) => ({
    url: `${baseUrl}/negocio/${business.id}`,
    lastModified: business.updated_at ? new Date(business.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8
  }))

  return [...staticUrls, ...businessUrls]
}
