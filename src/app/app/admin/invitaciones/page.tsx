import { requireAdmin } from "@/utils/admin-auth"
import { createClient } from "@supabase/supabase-js"
import InvitationsTable from "./components/InvitationsTable"

// Forzar renderizado dinámico porque usa cookies para autenticación
export const dynamic = 'force-dynamic'

export interface InvitationData {
  id: string
  business_id: string
  business_name: string
  code: string
  is_claimed: boolean
  created_at: string
}

/**
 * Página de gestión de invitaciones (Admin)
 * - Lista todos los códigos de reclamación generados
 * - Muestra el negocio asociado y su estado (pendiente/reclamado)
 */
export default async function AdminInvitacionesPage() {
  // Verificar que el usuario es admin
  await requireAdmin()

  let invitations: InvitationData[] = []
  let error: Error | null = null

  try {
    // Verificar variables de entorno
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceKey || !supabaseUrl) {
      throw new Error("Variables de entorno no configuradas correctamente")
    }

    // Crear cliente con service role para bypass RLS
    const serviceSupabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Hacer JOIN entre business_claims y businesses
    const { data, error: queryError } = await serviceSupabase
      .from("business_claims")
      .select(`
        id,
        business_id,
        code,
        is_claimed,
        created_at,
        businesses!inner (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false })

    if (queryError) {
      console.error("Error cargando invitaciones:", queryError)
      throw queryError
    }

    // Mapear los datos al formato esperado
    if (data) {
      invitations = data.map((item: any) => ({
        id: item.id,
        business_id: item.business_id,
        business_name: item.businesses?.name || "Negocio desconocido",
        code: item.code,
        is_claimed: item.is_claimed,
        created_at: item.created_at,
      }))
    }

    console.log(`✅ ${invitations.length} invitaciones cargadas`)
  } catch (err: any) {
    console.error("❌ Error cargando invitaciones:", err)
    error = err as Error
  }

  return (
    <div className="min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Invitaciones</h1>
        <p className="text-gray-400 text-sm">
          {invitations.length} {invitations.length === 1 ? "invitación" : "invitaciones"} registradas
        </p>
      </div>

      {error && (
        <div className="mb-6 p-5 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-red-400 font-semibold mb-1">❌ Error al cargar invitaciones</p>
              <p className="text-red-300 text-sm">
                {error.message || "Error desconocido"}
              </p>
            </div>
          </div>
        </div>
      )}

      {!error && (
        <InvitationsTable invitations={invitations} />
      )}
    </div>
  )
}

