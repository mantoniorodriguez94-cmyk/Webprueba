import { createClient } from "@/utils/supabase/server"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import type { Business } from "@/types/business"
import StarRating from "@/components/reviews/StarRating"
import RegistrarVista from "@/components/analytics/RegistrarVista"
import EnlaceContacto from "@/components/analytics/EnlaceContacto"
import { notFound } from "next/navigation"
import { viasDeContacto } from "@/lib/memberships/perks"
import { claseBoton } from "@/lib/ui/botones"
// Forzar renderizado dinámico para SEO
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidar cada hora

/**
 * Generar metadata SEO para la página pública del negocio.
 *
 * OJO con el `export`: faltaba, y sin él Next ni se entera de que esta
 * función existe. El efecto era invisible desde el código —la función está
 * escrita entera, con su consulta y sus etiquetas— pero en producción TODAS
 * las fichas heredaban los metadatos de la portada: el mismo título para
 * cada negocio, la misma descripción, y ningún canonical propio. Compartir
 * un negocio por WhatsApp mostraba la tarjeta genérica de la app en vez de
 * la del negocio.
 *
 * Se descubrió comparando el HTML que sirve producción contra lo que decía
 * el código. Leer el archivo no bastaba: el cuerpo de la función parecía
 * correcto y lo que fallaba era una palabra en su primera línea.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  
  /* Sin average_rating ni total_reviews: esas dos columnas NO existen en
     `businesses`, viven en la vista business_review_stats. Pedirlas hacía
     fallar la consulta entera, así que `business` llegaba null y toda ficha
     compartida se anunciaba como "Negocio no encontrado". */
  const { data: business } = await supabase
    .from("businesses")
    .select("name, description, category, address, logo_url")
    .eq("id", id)
    .single()

  if (!business) {
    return {
      title: "Negocio no encontrado | App Encuentra",
      description: "El negocio que buscas no existe o ha sido eliminado."
    }
  }

  const title = `${business.name}${business.category ? ` - ${business.category}` : ''} | App Encuentra`
  /* La calificación salía de business.average_rating, que nunca existió: la
     expresión era siempre falsa y no añadía nada. Si se quiere en el
     resumen, hay que traerla de business_review_stats. */
  const description = business.description || `Conoce más sobre ${business.name}${business.address ? ` ubicado en ${business.address}` : ''}.`

  /* URL canónica. El respaldo lleva www, igual que el host que Vercel sirve:
     si NEXT_PUBLIC_APP_URL faltara, la ficha se anunciaba a sí misma bajo un
     dominio que redirige, que es exactamente lo que un canonical no debe
     hacer. */
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.appencuentra.com'
  const url = `${baseUrl}/negocio/${id}`
  /* La imagen de respaldo apuntaba a /og-default.png, que no existe en
     `public/`. Un negocio sin logo se compartía por WhatsApp con una vista
     previa rota — 404 en la imagen. Se usa la misma tarjeta de marca que ya
     emplea la portada. */
  const imageUrl = business.logo_url || `${baseUrl}/brand/og.png`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "App Encuentra",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: business.name
        }
      ],
      locale: "es_ES",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl]
    },
    alternates: {
      canonical: url
    }
  }
}

/**
 * Página pública del negocio (SEO-friendly)
 */
export default async function PublicBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Cargar datos del negocio (incl. owner_id para tier y flags de chat)
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      description,
      category,
      address,
      phone,
      whatsapp,
      logo_url,
      gallery_urls,
      latitude,
      longitude,
      owner_id
    `)
    .eq("id", id)
    .single()

  if (businessError || !business) {
    notFound()
  }

  // Fetch owner profile for tier (used for contact visibility only)
  let ownerTierCrudo: number | null = null
  let ownerFinSuscripcion: string | null = null
  if (business.owner_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_end_date")
      .eq("id", business.owner_id)
      .maybeSingle()

    ownerTierCrudo = (profile as any)?.subscription_tier ?? 0
    ownerFinSuscripcion = (profile as any)?.subscription_end_date ?? null
  }

  /* La escalera de contacto sale de lib/memberships/perks, igual que en la
     tarjeta del feed y en la ficha del dashboard.

     Este archivo tenía la copia más peligrosa de las tres: no llamaba a
     isTierActive, se había reescrito a mano la comparación de fechas. O sea
     que un arreglo en la función compartida no llegaba nunca hasta acá.

     Y es donde más pesa. Esta es la página que indexa Google y la que se abre
     al compartir un negocio, y la que lleva las fichas sembradas por el
     equipo: sin dueño, o sea tier 0. El día que alguien vuelva a subir el
     corte del teléfono, esas fichas se quedan sin ninguna vía de contacto —un
     escaparate sin puerta justo en el escaparate más visible— y el argumento
     de venta para reclamarlas se cae con ellas. */
  const contacto = viasDeContacto(ownerTierCrudo, ownerFinSuscripcion)
  const ownerHasWhatsApp = contacto.whatsapp
  const ownerHasInAppChat = contacto.chat

  // Cargar estadísticas de reviews
  const { data: reviewStats } = await supabase
    .from("business_review_stats")
    .select("average_rating, total_reviews")
    .eq("business_id", id)
    .single()

  // Parsear gallery_urls
  const getGalleryUrls = (): string[] =>
    // gallery_urls es text[] en la base. Antes esto tenía además una rama
    // JSON.parse porque la columna era TEXT con un array serializado.
    business?.gallery_urls ?? []

  const galleryUrls = getGalleryUrls()
  // El respaldo era business.average_rating / business.total_reviews, campos
  // que no existen. La vista business_review_stats es la única fuente.
  const averageRating = reviewStats?.average_rating || 0
  const totalReviews = reviewStats?.total_reviews || 0

  // JSON-LD Schema para LocalBusiness
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": business.name,
    "description": business.description || undefined,
    "address": business.address ? {
      "@type": "PostalAddress",
      "streetAddress": business.address
    } : undefined,
    "telephone": business.phone || undefined,
    "image": business.logo_url || galleryUrls[0] || undefined,
    "aggregateRating": totalReviews > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": averageRating.toString(),
      "reviewCount": totalReviews.toString(),
      "bestRating": "5",
      "worstRating": "1"
    } : undefined,
    ...(business.latitude && business.longitude ? {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": business.latitude.toString(),
        "longitude": business.longitude.toString()
      }
    } : {})
  }

  return (
    <>
      {/* Esta página no contaba vistas: el enlace que el negocio comparte por
          WhatsApp podía traerle cincuenta visitas y sus estadísticas marcaban
          cero. Se registra desde el cliente para no contar rastreadores. */}
      <RegistrarVista businessId={business.id} />

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-ink-2 hover:text-ink transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al inicio
            </Link>
          </div>

          {/* Contenido Principal */}
          <div className="surface rounded-3xl shadow-sm p-6 md:p-8 mb-8">
            {/* Header del Negocio */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              {/* Logo */}
              {business.logo_url && (
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-black/10 flex-shrink-0">
                  <Image
                    src={business.logo_url}
                    alt={business.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              )}

              {/* Información */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-ink mb-2">{business.name}</h1>
                {business.category && (
                  <p className="text-blue-600 text-lg mb-4">{business.category}</p>
                )}
                {averageRating > 0 && (
                  <div className="flex items-center gap-3 mb-4">
                    <StarRating rating={averageRating} size="md" />
                    <span className="text-ink font-semibold">{averageRating.toFixed(1)}</span>
                    {totalReviews > 0 && (
                      <span className="text-ink-2">({totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'})</span>
                    )}
                  </div>
                )}
                {business.description && (
                  <p className="text-ink-2 text-lg leading-relaxed">{business.description}</p>
                )}
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {business.address && (
                <div className="flex items-start gap-3 p-4 bg-black/[0.02] rounded-xl">
                  <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-ink-2 mb-1">Dirección</p>
                    <p className="text-ink font-medium">{business.address}</p>
                  </div>
                </div>
              )}

              {contacto.telefono && business.phone && (
                <div className="flex items-start gap-3 p-4 bg-black/[0.02] rounded-xl">
                  <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="text-sm text-ink-2 mb-1">Teléfono</p>
                    <EnlaceContacto
                      businessId={business.id}
                      tipo="phone"
                      href={`tel:${business.phone}`}
                      className="text-ink font-medium hover:text-blue-600 transition-colors"
                    >
                      {business.phone}
                    </EnlaceContacto>
                  </div>
                </div>
              )}

              {ownerHasWhatsApp && business.whatsapp && (
                <div className="flex items-start gap-3 p-4 bg-black/[0.02] rounded-xl">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <div>
                    <p className="text-sm text-ink-2 mb-1">WhatsApp</p>
                    <EnlaceContacto
                      businessId={business.id}
                      tipo="whatsapp"
                      href={`https://wa.me/${business.whatsapp}`}
                      externo
                      className="text-ink font-medium hover:text-green-600 transition-colors"
                    >
                      {business.whatsapp}
                    </EnlaceContacto>
                  </div>
                </div>
              )}
            </div>

            {/* Galería */}
            {galleryUrls.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-ink mb-4">Galería</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {galleryUrls.slice(0, 8).map((url, idx) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden border-2 border-black/10">
                      <Image
                        src={url}
                        alt={`${business.name} - Imagen ${idx + 1}`}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-black/8">
              {/* Primary CTA — shows chat icon when in-app chat is available */}
              <Link
                href={`/app/dashboard/negocios/${business.id}`}
                className={claseBoton("primario", "normal", "flex-1")}
              >
                {ownerHasInAppChat ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Enviar Mensaje
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ver perfil en la app
                  </>
                )}
              </Link>

              {/* Sólo cuando no hay NINGUNA vía: ahora el teléfono está
                  siempre, así que este aviso casi nunca aparece. */}
              {!ownerHasInAppChat && !ownerHasWhatsApp && !(contacto.telefono && business.phone) && (
                <p className="text-center text-xs text-ink-2/70 self-center">
                  Este negocio todavía no tiene vías de contacto publicadas.
                </p>
              )}

              {/* WhatsApp — desde Conecta */}
              {ownerHasWhatsApp && business.whatsapp && (
                <EnlaceContacto
                  businessId={business.id}
                  tipo="whatsapp"
                  href={`https://wa.me/${business.whatsapp}`}
                  externo
                  className={claseBoton("whatsapp", "normal", "flex-1")}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Chatear por WhatsApp
                </EnlaceContacto>
              )}

            </div>
          </div>

          {/* CTA para unirse */}
          <div className="surface rounded-3xl shadow-sm p-8 text-center">
            <h3 className="text-2xl font-bold text-ink mb-4">¿Tienes un negocio?</h3>
            <p className="text-ink-2 mb-6">Únete a App Encuentra y conecta con más clientes</p>
            <Link
              href="/app/auth/register"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full transition-all font-semibold"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

