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
import AdminBusinessForm from "../../components/AdminBusinessForm"
import AdminBusinessDangerZone from "../../components/AdminBusinessDangerZone"
import { getLabelForTier, isTierActive } from "@/lib/memberships/tiers"
import { topeDeFotos, banderaVigente } from "@/lib/memberships/perks"
import type { SubscriptionTier } from "@/lib/memberships/tiers"

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

/**
 * La ficha del negocio en el panel de admin: todo lo que hay que saber y todo
 * lo que se puede hacer, en una sola página.
 *
 * Antes eran dos. Esta mostraba los datos y una página aparte, /gestionar,
 * los dejaba editar — pero las dos pintaban los MISMOS campos: nombre,
 * descripción, categoría, dirección, teléfono y WhatsApp salían dos veces, en
 * solo lectura acá y en formulario allá. El admin tenía que ir y volver para
 * comprobar si un cambio había entrado, y cualquier arreglo había que hacerlo
 * en dos sitios.
 *
 * Al juntarlas, esos campos aparecen UNA vez, en el formulario. Lo que queda
 * en solo lectura es lo que no se edita desde acá: el dueño, el plan, las
 * insignias, el rendimiento y las fechas.
 *
 * El orden sigue el trabajo real del admin: primero saber a quién tiene
 * delante y cómo le va la ficha, después las acciones, después editar, y al
 * final —separado— lo que no se puede deshacer.
 */
export default async function AdminBusinessDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const adminActual = await requireAdmin()
  const { id } = await params
  const supabase = await createClient()

  /* El perfil del dueño va en una consulta aparte y no con
     `profiles:owner_id(...)` embebido. PostgREST rechaza ese embebido —"Could
     not find a relationship between 'businesses' and 'owner_id'"— porque
     owner_id referencia auth.users, no public.profiles, y sin clave foránea
     entre ambas no hay relación que seguir.

     Esta página llevaba tiempo pidiéndolo así, de modo que la consulta fallaba
     entera y el `notFound()` de abajo la convertía en un 404. Estaba rota, y
     por eso no había en toda la app un enlace que apuntara a ella. */
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single()

  if (businessError || !business) {
    notFound()
  }

  const { data: owner } = business.owner_id
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, role, subscription_tier, subscription_end_date, created_at, suspended_at")
        .eq("id", business.owner_id)
        .maybeSingle()
    : { data: null }

  // El tier guardado puede estar vencido: se pasa por la misma comprobación
  // que usa el resto de la app para no mostrar un plan que ya no rige.
  const tierVigenteDueno = isTierActive(owner?.subscription_tier, owner?.subscription_end_date)
    ? Number(owner?.subscription_tier) || 0
    : 0

  const topeRealDeFotos = topeDeFotos(business as any, tierVigenteDueno)

  /* El argumento de venta, listo para decirlo en voz alta.
     Cuando se va a ofrecer una ficha sembrada a su dueño, lo que convence no
     es explicarle qué es la app sino enseñarle lo que ya le está pasando:
     "tu negocio lleva 340 visitas y 12 personas pulsaron tu teléfono". Ese
     número vivía sólo en el panel del dueño, al que todavía no tiene acceso. */
  const { data: resumenVisitas } = await supabase
    .from("business_analytics_summary")
    .select("total_views, unique_viewers, views_last_30_days")
    .eq("business_id", id)
    .maybeSingle()

  const { data: interacciones } = await supabase
    .from("business_interactions_summary")
    .select("interaction_type, interaction_count")
    .eq("business_id", id)

  const clics = (tipo: string) =>
    (interacciones ?? []).find((i: any) => i.interaction_type === tipo)?.interaction_count ?? 0

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
  const getGalleryUrls = (): string[] =>
    // gallery_urls es text[] en la base. Antes esto tenía además una rama
    // JSON.parse porque la columna era TEXT con un array serializado.
    business?.gallery_urls ?? []

  const galleryUrls = getGalleryUrls()

  // Cargar pagos manuales pendientes
  const { data: pendingPayments } = await supabase
    .from("manual_payment_submissions")
    .select(`
      id,
      amount_usd,
      payment_method,
      created_at,
      target_tier,
      months
    `)
    .eq("business_id", id)
    .eq("status", "pending")

  return (
    <div className="min-h-screen text-ink">
      {/* Header con botón volver */}
      <div className="mb-6">
        <Link
          href="/app/admin/negocios"
          className="inline-flex items-center gap-2 text-ink-2 hover:text-ink transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a negocios
        </Link>
        <h1 className="text-3xl font-bold mb-1">{business.name}</h1>
        <p className="text-ink-2 text-sm font-mono">ID: {id}</p>
      </div>

      {/* Código de Reclamación - SECCIÓN VISIBLE */}
      <div className="mb-6">
        <BusinessClaimCodeSection 
          businessId={business.id} 
          businessName={business.name || "Negocio"}
        />
      </div>

      {/* Información Principal */}
      <div className="surface rounded-3xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6 mb-6">
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

          {/* Info básica */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                {/* El nombre y la categoría ya no se repiten acá: el nombre es
                    el título de la página y la categoría se edita abajo, en
                    "Datos del negocio". Lo que queda es lo que NO se edita
                    desde esta ficha. */}
                {/* Antes acá iba `full_name || email`, así que en cuanto el
                    dueño tenía nombre el correo no se veía nunca — justo el
                    dato que hace falta para escribirle o para cruzarlo con un
                    ticket de soporte. El id también: los correos de soporte
                    llegan identificando al usuario por UUID. */}
                {owner && (
                  <div className="text-ink-2 text-sm space-y-0.5">
                    <p>
                      Propietario:{" "}
                      <span className="text-ink font-medium">
                        {owner.full_name || "Sin nombre"}
                      </span>
                      {owner.role ? ` · ${owner.role}` : ""}
                    </p>
                    {owner.email && (
                      <p>
                        Correo:{" "}
                        <a href={`mailto:${owner.email}`} className="text-blue-600 hover:underline">
                          {owner.email}
                        </a>
                      </p>
                    )}
                    <p>
                      Plan: {getLabelForTier(tierVigenteDueno as SubscriptionTier)}
                      {owner.subscription_tier > 0 && tierVigenteDueno === 0
                        ? " (vencido)"
                        : ""}
                      {owner.subscription_end_date
                        ? ` · hasta ${new Date(owner.subscription_end_date).toLocaleDateString("es-ES")}`
                        : owner.subscription_tier > 0
                        ? " · sin vencimiento"
                        : ""}
                    </p>
                    {owner.created_at && (
                      <p>Registrado: {new Date(owner.created_at).toLocaleDateString("es-ES")}</p>
                    )}
                    {owner.suspended_at && (
                      <p className="text-red-600 font-medium">
                        Cuenta suspendida el {new Date(owner.suspended_at).toLocaleDateString("es-ES")}
                      </p>
                    )}
                    <p className="font-mono text-[11px] text-ink-2/70 break-all">
                      ID: {owner.id}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {banderaVigente(business.is_premium, business.premium_until) && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Premium
                  </span>
                )}
                {banderaVigente(business.is_featured, business.featured_until) && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    Destacado
                  </span>
                )}
                {business.is_verified && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                    Verificado
                  </span>
                )}
              </div>
            </div>

            {/* La descripción y el contacto se editan abajo. Estaban acá
                además en solo lectura, que era la mitad de la duplicación
                entre esta ficha y la antigua página /gestionar. */}

            {/* Estado Premium */}
            {business.is_premium && business.premium_until && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm text-amber-700">
                  Premium hasta: {new Date(business.premium_until).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </p>
              </div>
            )}

            {/* Argumento de venta para ofrecer la ficha a su dueño. Sale
                arriba y con los números grandes porque es lo primero que hay
                que decir en esa conversación, no un detalle a buscar. */}
            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-2">
                {business.owner_id ? "Rendimiento" : "Para ofrecer esta ficha"}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-2xl font-extrabold text-ink">
                    {(resumenVisitas?.total_views ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-ink-2">visitas</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-ink">
                    {(resumenVisitas?.views_last_30_days ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-ink-2">últimos 30 días</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-ink">{clics("phone")}</p>
                  <p className="text-[11px] text-ink-2">clics al teléfono</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-ink">{clics("whatsapp")}</p>
                  <p className="text-[11px] text-ink-2">clics a WhatsApp</p>
                </div>
              </div>
              {!business.owner_id && (
                <p className="mt-3 text-[11px] text-ink-2">
                  Ficha sin reclamar. No admite reseñas hasta que su dueño la reclame.
                </p>
              )}
            </div>

            {/* El tope real, calculado como lo calcula la app: el del plan más
                las fotos extra concedidas si siguen vigentes. Acá se mostraba
                `max_photos`, una columna que ya nadie lee: decía 5 en todas
                las filas y daba igual lo que pusieras. */}
            <div className="mt-4 text-xs text-ink-2">
              <p>
                Fotos: {galleryUrls.length} de {topeRealDeFotos}
                {(business as any).perk_fotos_extra_hasta
                  ? ` · incluye ${(business as any).perk_fotos_extra ?? 0} extra concedidas`
                  : ""}
              </p>
            </div>

            {/* Fechas */}
            <div className="mt-4 text-xs text-ink-2 space-y-1">
              <p>Creado: {business.created_at ? new Date(business.created_at).toLocaleString("es-ES") : "N/A"}</p>
              {business.verified_at && (
                <p>Verificado: {new Date(business.verified_at).toLocaleString("es-ES")}</p>
              )}
            </div>
          </div>
        </div>

        {/* Acciones Admin */}
        <div className="mt-6 pt-6 border-t border-black/10">
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
          </div>

          {/* Pagos pendientes */}
          {pendingPayments && pendingPayments.length > 0 && (
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm font-semibold text-amber-700 mb-2">
                ⚠️ {pendingPayments.length} {pendingPayments.length === 1 ? 'pago pendiente' : 'pagos pendientes'}
              </p>
              {pendingPayments.map((payment: any) => {
                const tierNum = Number(payment.target_tier ?? 0)
                const tierLabel = tierNum > 0 ? getLabelForTier(tierNum as SubscriptionTier) : "N/A"
                const months = Number(payment.months ?? 0)
                return (
                  <div key={payment.id} className="text-xs text-amber-700">
                    ${payment.amount_usd} - Membresía {tierLabel}
                    {months > 0 ? ` · ${months} ${months === 1 ? "mes" : "meses"}` : ""} ({payment.payment_method})
                  </div>
                )
              })}
              <p className="text-xs text-amber-700/80 mt-2">
                Revísalos en el panel de Pagos Manuales para aprobarlos
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Datos del negocio — lo que antes vivía en /gestionar */}
      <div className="surface rounded-3xl shadow-sm p-6 mb-6">
        <h3 className="text-xl font-bold mb-1">Datos del negocio</h3>
        <p className="text-ink-2 text-sm mb-4">
          Se editan como si fueras el dueño. Los cambios se ven en el resto de
          la ficha al guardar.
        </p>
        <AdminBusinessForm business={business as any} />
      </div>

      {/* Secciones que tienen su propia pantalla en el panel del dueño. El
          admin las abre ahí mismo: duplicar acá el editor de galería, el de
          horarios y el de promociones sería repetir tres pantallas enteras
          para no cambiar nada de lo que hacen. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link
          href={`/app/dashboard/negocios/${id}/galeria`}
          className="surface rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-bold">Galería</h3>
          </div>
          <p className="text-sm text-ink-2">
            {galleryUrls.length} de {topeRealDeFotos} fotos
          </p>
        </Link>

        <Link
          href={`/app/dashboard/negocios/${id}/horarios`}
          className="surface rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold">Horarios</h3>
          </div>
          <p className="text-sm text-ink-2">Horario de atención</p>
        </Link>

        <Link
          href={`/app/dashboard/negocios/${id}/promociones`}
          className="surface rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold">Promociones</h3>
          </div>
          <p className="text-sm text-ink-2">Promociones activas</p>
        </Link>
      </div>

      {/* Galería */}
      {galleryUrls.length > 0 && (
        <div className="surface rounded-3xl shadow-sm p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Galería ({galleryUrls.length} fotos)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryUrls.map((url, idx) => (
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

      {/* Reviews */}
      {reviewStats && reviewStats.total_reviews > 0 && (
        <div className="surface rounded-3xl shadow-sm p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Reseñas</h3>
          <div className="mb-6">
            <ReviewStats stats={reviewStats} />
          </div>
          <ReviewList reviews={reviewsData} loading={false} currentUserId={adminActual?.id ?? null} />
        </div>
      )}

      {/* Links útiles */}
      <div className="surface rounded-3xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">Enlaces</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/app/dashboard/negocios/${id}`}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Ver como usuario
          </Link>
          <Link
            href={`/negocio/${id}`}
            className="px-4 py-2 bg-black/5 hover:bg-black/10 text-ink border border-black/8 rounded-xl text-sm font-medium transition-colors"
          >
            Ver página pública
          </Link>
        </div>
      </div>

      {/* Lo último y aparte: es la única acción de la ficha sin vuelta atrás. */}
      <AdminBusinessDangerZone
        businessId={business.id}
        businessName={business.name || "este negocio"}
      />
    </div>
  )
}

