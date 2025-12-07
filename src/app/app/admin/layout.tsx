import { requireAdmin } from "@/utils/admin-auth"
import AdminLayoutClient from "./components/AdminLayoutClient"
import { redirect } from "next/navigation"

/**
 * Layout del panel administrativo
 * - Verifica que el usuario sea admin antes de renderizar
 * - Usa Server Component para seguridad
 * - Delega la UI interactiva a AdminLayoutClient
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Verificar que el usuario es admin - redirige si no lo es
  try {
    await requireAdmin()
  } catch (error) {
    // Si hay error o no es admin, redirigir
    redirect("/app/dashboard")
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
