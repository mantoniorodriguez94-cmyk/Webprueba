import type { MetadataRoute } from "next"

/**
 * Antes no existía, así que los buscadores podían indexar rutas internas.
 * Se bloquean las zonas privadas: el panel de administración, el área de
 * sesión y las rutas de API. El directorio público y las fichas de negocio
 * sí deben indexarse — es de donde viene el tráfico orgánico.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/admin", "/app/dashboard", "/app/auth", "/api/", "/auth/callback"],
    },
    sitemap: "https://www.appencuentra.com/sitemap.xml",
  }
}
