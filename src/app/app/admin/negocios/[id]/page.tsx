import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/utils/admin-auth"
import Image from "next/image"
import Link from "next/link"
import AdminActionButton from "../../components/AdminActionButton"
import { notFound } from "next/navigation"
import StarRating from "@/components/reviews/StarRating"
import ReviewStats from "@/components/reviews/ReviewStats"
import ReviewList from "@/components/reviews/ReviewList"
import BusinessClaimCodeSection from "@/components/admin/BusinessClaimCodeSection"

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

/**
 * Página de detalle de negocio para admin (BLOQUE 5)
 * Permite ver toda la información y ejecutar acciones administrativas
 */
export default async function AdminBusinessDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  await requireAdmin()
  const { id } = await params
  const supabase = await createClient()

  // Cargar información completa del negocio
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(`
      *,
      profiles:owner_id(full_name, email)
    `)
    .eq("id", id)
    .single()

  if (businessError || !business) {
    notFound()
  }

  const owner = Array.isArray(business.profiles) ? business.profiles[0] : business.profiles

  // Cargar estadísticas de reviews
  const { data: reviewStats } = await supabase
    .from("business_review_stats")
    .select("*")
    .eq("business_id", id)
    .single()

  // Cargar reviews
  let reviewsData: any[] = []
  try {
    const { data: reviews } = await supabase
      .rpc('get_business_reviews', { p_business_id: id })
    reviewsData = reviews || []
  } catch {
    // Fallback si la función no existe
    const { data: fallbackReviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false })
    reviewsData = fallbackReviews || []
  }

  // Parsear gallery_urls
  const getGalleryUrls = (): string[] => {
    if (!business.gallery_urls) return []
    if (Array.isArray(business.gallery_urls)) {
      return business.gallery_urls
    }
    if (typeof business.gallery_urls === 'string') {
      try {
        const parsed = JSON.parse(business.gallery_urls)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  }

  const galleryUrls = getGalleryUrls()

  // Cargar pagos manuales pendientes
  const { data: pendingPayments } = await supabase
    .from("manual_payment_submissions")
    .select(`
      id,
      amount_usd,
      payment_method,
      created_at,
      premium_plans(name, billing_period)
    `)
    .eq("business_id", id)
    .eq("status", "pending")

  return (
    <div className="min-h-screen text-white">
      {/* Header con botón volver */}
      <div className="mb-6">
        <Link
          href="/app/admin/negocios"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a negocios
        </Link>
        <h1 className="text-3xl font-bold mb-2">Gestión de Negocio</h1>
        <p className="text-gray-400 text-sm">ID: {id.substring(0, 8)}...</p>
      </div>

      {/* Código de Reclamación - SECCIÓN VISIBLE */}
      <div className="mb-6">
        <BusinessClaimCodeSection 
          businessId={business.id} 
          businessName={business.name || "Negocio"}
        />
      </div>

      {/* Información Principal */}
      <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* Logo */}
          {business.logo_url && (
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/20 flex-shrink-0">
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

          {/* Info básica */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{business.name}</h2>
                {business.category && (
                  <p className="text-blue-300 text-lg mb-2">{business.category}</p>
                )}
                {owner && (
                  <p className="text-gray-400 text-sm">
                    Propietario: {owner.full_name || owner.email || "N/A"}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {business.is_premium && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                    Premium
                  </span>
                )}
                {business.is_featured && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Destacado
                  </span>
                )}
                {business.is_verified && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/40">
                    Verificado
                  </span>
                )}
              </div>
            </div>

            {business.description && (
              <p className="text-gray-300 mb-4">{business.description}</p>
            )}

            {/* Info de contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {business.address && (
                <div className="flex items-start gap-2 text-sm">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-300">{business.address}</span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-300">{business.phone}</span>
                </div>
              )}
              {business.whatsapp && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span className="text-gray-300">{business.whatsapp}</span>
                </div>
              )}
            </div>

            {/* Estado Premium */}
            {business.is_premium && business.premium_until && (
              <div className="mt-4 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <p className="text-sm text-yellow-200">
                  Premium hasta: {new Date(business.premium_until).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </p>
                {business.max_photos && (
                  <p className="text-sm text-yellow-200 mt-1">
                    Límite de fotos: {business.max_photos}
                  </p>
                )}
              </div>
            )}

            {/* Fechas */}
            <div className="mt-4 text-xs text-gray-400 space-y-1">
              <p>Creado: {business.created_at ? new Date(business.created_at).toLocaleString("es-ES") : "N/A"}</p>
              {business.verified_at && (
                <p>Verificado: {new Date(business.verified_at).toLocaleString("es-ES")}</p>
              )}
            </div>
          </div>
        </div>

        {/* Acciones Admin */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <h3 className="text-lg font-bold mb-4">Acciones Administrativas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <AdminActionButton 
              id={business.id} 
              type="verificar" 
              label={business.is_premium ? "✓ Premium Activo" : "Activar Premium"}
              disabled={business.is_premium}
              businessName={business.name || "Negocio"}
            />
            <AdminActionButton id={business.id} type="suspender" label="Suspender Premium" />
            <AdminActionButton id={business.id} type="destacar" label={business.is_featured ? "Quitar Destacado" : "Destacar"} />
            <AdminActionButton 
              id={business.id} 
              type="foto_limite" 
              label={`+ Fotos (${business.max_photos || 5})`}
              currentMaxPhotos={business.max_photos || 5}
              businessName={business.name || "Negocio"}
            />
          </div>

          {/* Pagos pendientes */}
          {pendingPayments && pendingPayments.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <p className="text-sm font-semibold text-yellow-200 mb-2">
                ⚠️ {pendingPayments.length} {pendingPayments.length === 1 ? 'pago pendiente' : 'pagos pendientes'}
              </p>
              {pendingPayments.map((payment: any) => {
                const plan = Array.isArray(payment.premium_plans) ? payment.premium_plans[0] : payment.premium_plans
                return (
                  <div key={payment.id} className="text-xs text-yellow-300">
                    ${payment.amount_usd} - {plan?.name || "N/A"} ({payment.payment_method})
                  </div>
                )
              })}
              <p className="text-xs text-yellow-200 mt-2">
                Usa el botón &ldquo;Activar Premium&rdquo; arriba para aprobar
              </p>
            </div>
          )}

          {/* Botón para gestionar todo el negocio */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <Link
              href={`/app/admin/negocios/${business.id}/gestionar`}
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-center text-sm font-medium transition-colors w-full"
            >
              Gestionar Negocio Completo (Galería, Horarios, Promociones, Eliminar)
            </Link>
          </div>
        </div>
      </div>

      {/* Galería */}
      {galleryUrls.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Galería ({galleryUrls.length} fotos)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryUrls.map((url, idx) => (
              <div key={idx} className="aspect-square rounded-xl overflow-hidden border-2 border-white/20">
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

      {/* Reviews */}
      {reviewStats && reviewStats.total_reviews > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Reseñas</h3>
          <div className="mb-6">
            <ReviewStats stats={reviewStats} />
          </div>
          <ReviewList reviews={reviewsData} loading={false} />
        </div>
      )}

      {/* Links útiles */}
      <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6">
        <h3 className="text-lg font-bold mb-4">Enlaces</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/app/dashboard/negocios/${id}`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium transition-colors"
          >
            Ver como usuario
          </Link>
          <Link
            href={`/negocio/${id}`}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-medium transition-colors"
          >
            Ver página pública
          </Link>
        </div>
      </div>
    </div>
  )
}

