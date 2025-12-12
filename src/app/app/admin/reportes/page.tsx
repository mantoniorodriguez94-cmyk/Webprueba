import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/utils/admin-auth"
import Link from "next/link"

// Forzar renderizado dinámico porque usa cookies para autenticación
export const dynamic = 'force-dynamic'

/**
 * Página de gestión de reportes (Admin)
 * - Lista reportes de negocios y reseñas
 * - Permite cambiar estado de reportes
 */
export default async function AdminReportesPage() {
  // Verificar que el usuario es admin
  await requireAdmin()
  
  // Crear cliente de Supabase (await necesario en Next.js 15)
  const supabase = await createClient()

  // Cargar reportes de negocios
  const { data: businessReports, error: businessReportsError } = await supabase
    .from("business_reports")
    .select(`
      id,
      business_id,
      reporter_id,
      reason,
      status,
      admin_notes,
      created_at,
      businesses(name)
    `)
    .order("created_at", { ascending: false })

  // Cargar reportes de reseñas
  const { data: reviewReports, error: reviewReportsError } = await supabase
    .from("review_reports")
    .select(`
      id,
      review_id,
      reporter_id,
      reason,
      status,
      admin_notes,
      created_at,
      reviews(business_id, rating, comment)
    `)
    .order("created_at", { ascending: false })

  if (businessReportsError) {
    console.error("Error cargando reportes de negocios:", businessReportsError)
  }
  if (reviewReportsError) {
    console.error("Error cargando reportes de reseñas:", reviewReportsError)
  }

  // Cargar perfiles de usuarios
  const allReporterIds = [
    ...new Set([
      ...(businessReports?.map(r => r.reporter_id) || []),
      ...(reviewReports?.map(r => r.reporter_id) || [])
    ])
  ]
  
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", allReporterIds)

  const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

  const pendingBusinessReports = businessReports?.filter(r => r.status === 'pending') || []
  const pendingReviewReports = reviewReports?.filter(r => r.status === 'pending') || []

  return (
    <div className="min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Reportes</h1>
        <p className="text-gray-400 text-sm">
          {pendingBusinessReports.length + pendingReviewReports.length} pendientes • {businessReports?.length || 0} reportes de negocios • {reviewReports?.length || 0} reportes de reseñas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reportes de Negocios */}
        <div>
          <h2 className="text-xl font-bold mb-4">Reportes de Negocios</h2>
          {businessReports && businessReports.length > 0 ? (
            <div className="space-y-4">
              {businessReports.map((report) => {
                const business = Array.isArray(report.businesses) ? report.businesses[0] : report.businesses
                const reporter = profilesMap.get(report.reporter_id)
                const statusColors = {
                  pending: "border-yellow-500/40 bg-yellow-500/10",
                  reviewed: "border-blue-500/40 bg-blue-500/10",
                  resolved: "border-green-500/40 bg-green-500/10",
                  dismissed: "border-gray-500/40 bg-gray-500/10"
                }
                const statusLabels = {
                  pending: "Pendiente",
                  reviewed: "Revisado",
                  resolved: "Resuelto",
                  dismissed: "Descartado"
                }

                return (
                  <div
                    key={report.id}
                    className={`bg-white/10 backdrop-blur-md p-4 rounded-2xl border-2 ${statusColors[report.status as keyof typeof statusColors] || "border-white/20"}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-1">
                          {business?.name || "Negocio desconocido"}
                        </h3>
                        <p className="text-xs text-gray-400 mb-2">
                          Reportado por: {reporter?.full_name || reporter?.email || report.reporter_id.substring(0, 8)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                        report.status === 'resolved' ? 'bg-green-500/20 text-green-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {statusLabels[report.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{report.reason}</p>
                    {report.admin_notes && (
                      <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-blue-300 font-semibold mb-1">Notas del admin:</p>
                        <p className="text-xs text-blue-200">{report.admin_notes}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(report.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                    <Link
                      href={`/app/admin/reportes/${report.id}?type=business`}
                      className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
                    >
                      Gestionar →
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No hay reportes de negocios</p>
            </div>
          )}
        </div>

        {/* Reportes de Reseñas */}
        <div>
          <h2 className="text-xl font-bold mb-4">Reportes de Reseñas</h2>
          {reviewReports && reviewReports.length > 0 ? (
            <div className="space-y-4">
              {reviewReports.map((report) => {
                const review = Array.isArray(report.reviews) ? report.reviews[0] : report.reviews
                const reporter = profilesMap.get(report.reporter_id)
                const statusColors = {
                  pending: "border-yellow-500/40 bg-yellow-500/10",
                  reviewed: "border-blue-500/40 bg-blue-500/10",
                  resolved: "border-green-500/40 bg-green-500/10",
                  dismissed: "border-gray-500/40 bg-gray-500/10"
                }
                const statusLabels = {
                  pending: "Pendiente",
                  reviewed: "Revisado",
                  resolved: "Resuelto",
                  dismissed: "Descartado"
                }

                return (
                  <div
                    key={report.id}
                    className={`bg-white/10 backdrop-blur-md p-4 rounded-2xl border-2 ${statusColors[report.status as keyof typeof statusColors] || "border-white/20"}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-yellow-400">{"⭐".repeat(review?.rating || 0)}</span>
                          <span className="text-xs text-gray-400">Reseña reportada</span>
                        </div>
                        {review?.comment && (
                          <p className="text-xs text-gray-400 italic mb-2 line-clamp-2">
                            &ldquo;{review.comment.substring(0, 100)}{review.comment.length > 100 ? '...' : ''}&rdquo;
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          Reportado por: {reporter?.full_name || reporter?.email || report.reporter_id.substring(0, 8)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                        report.status === 'resolved' ? 'bg-green-500/20 text-green-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {statusLabels[report.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{report.reason}</p>
                    {report.admin_notes && (
                      <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-blue-300 font-semibold mb-1">Notas del admin:</p>
                        <p className="text-xs text-blue-200">{report.admin_notes}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(report.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                    <Link
                      href={`/app/admin/reportes/${report.id}?type=review`}
                      className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
                    >
                      Gestionar →
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No hay reportes de reseñas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

