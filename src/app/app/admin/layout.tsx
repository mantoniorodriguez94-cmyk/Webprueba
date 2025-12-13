import { requireAdmin } from "@/utils/admin-auth"
import AdminLayoutClient from "./components/AdminLayoutClient"

// Forzar renderizado dinámico porque usa cookies para autenticación
export const dynamic = 'force-dynamic'

/**
 * Layout del panel administrativo
 * - Verifica que el usuario sea admin antes de renderizar
 * - Usa Server Component para seguridad
 * - Delega la UI interactiva a AdminLayoutClient
 * 
 * ⚠️ IMPORTANTE: requireAdmin() ya maneja el redirect internamente.
 * No necesitamos try-catch porque Next.js maneja automáticamente
 * la excepción de redirect().
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Verificar que el usuario es admin - requireAdmin() redirige si no lo es
  // ⚠️ await es CRUCIAL aquí - Next.js 15 requiere await para createClient()
  await requireAdmin()

  // Si llegamos aquí, el usuario es admin
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
