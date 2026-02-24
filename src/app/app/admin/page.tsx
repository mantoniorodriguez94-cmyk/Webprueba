import { requireAdmin } from "@/utils/admin-auth"
import AdminCreateBusinessWithCode from "@/components/admin/AdminCreateBusinessWithCode"
import AdminMetricsCards from "./components/AdminMetricsCards"

// Forzar renderizado dinámico porque usa cookies para autenticación
export const dynamic = "force-dynamic"

/**
 * Dashboard principal del panel administrativo
 * - Métricas en tiempo real vía /api/admin/metrics (useEffect + polling)
 */
export default async function AdminDashboardPage() {
  await requireAdmin()

  return (
    <div className="min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel Administrativo</h1>
        <p className="text-gray-400 text-sm">
          Gestión centralizada del sistema
        </p>
      </div>

      <div className="mb-10">
        <AdminCreateBusinessWithCode />
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4">Métricas en vivo</h2>
        <AdminMetricsCards />
      </div>
    </div>
  )
}
