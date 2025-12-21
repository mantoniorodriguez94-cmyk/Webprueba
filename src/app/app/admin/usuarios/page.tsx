import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/utils/admin-auth"
import Image from "next/image"
import DeleteUserButton from "./components/DeleteUserButton"

// Forzar renderizado dinámico porque usa cookies para autenticación
export const dynamic = 'force-dynamic'

/**
 * Página de gestión de usuarios (Admin)
 * - Lista todos los usuarios registrados en el sistema
 * - Muestra información relevante de cada usuario
 */
export default async function AdminUsuariosPage() {
  // Verificar que el usuario es admin
  await requireAdmin()
  
  const supabase = await createClient()

  // Cargar usuarios usando múltiples estrategias de fallback
  let usuarios: any[] | null = null
  let error: any = null
  let debugInfo: { method?: string; hasServiceKey?: boolean; errorDetails?: string } = {}

  try {
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    
    debugInfo.hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    // ESTRATEGIA 1: Usar service role key si está disponible
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        // Crear cliente con service role - este cliente IGNORA completamente RLS
        const serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
        
        // Intentar cargar desde profiles con service role
        const { data: serviceUsuarios, error: serviceError } = await serviceSupabase
          .from("profiles")
          .select(`
            id,
            full_name,
            email,
            role,
            is_admin,
            created_at,
            avatar_url
          `)
          .order("created_at", { ascending: false })
        
        if (!serviceError && serviceUsuarios) {
          usuarios = serviceUsuarios
          debugInfo.method = "service_role_profiles"
          console.log("✅ Usuarios cargados desde profiles (service role):", usuarios.length)
        } else if (serviceError) {
          console.warn("⚠️ Error con service role profiles:", serviceError.message)
          debugInfo.errorDetails = serviceError.message
          
          // Fallback 1B: usar auth.admin.listUsers() con service role
          const { data: authData, error: authError } = await serviceSupabase.auth.admin.listUsers()
          
          if (!authError && authData?.users) {
            // Convertir usuarios de auth.users a formato profiles
            usuarios = authData.users.map((user) => ({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              role: user.user_metadata?.role || "person",
              is_admin: user.user_metadata?.is_admin === true || false,
              created_at: user.created_at,
              avatar_url: user.user_metadata?.avatar_url || null
            }))
            debugInfo.method = "service_role_auth_users"
            console.log("✅ Usuarios cargados desde auth.users (service role):", usuarios.length)
          } else if (authError) {
            console.warn("⚠️ Error con auth.admin.listUsers:", authError.message)
            debugInfo.errorDetails = `Profiles: ${serviceError.message}, Auth: ${authError.message}`
          }
        }
      } catch (serviceErr: any) {
        console.warn("⚠️ Excepción con service role:", serviceErr.message)
        debugInfo.errorDetails = serviceErr.message
      }
    }

    // ESTRATEGIA 2: Si service role no funcionó, intentar con cliente normal (admin con RLS)
    if (!usuarios) {
      console.log("🔄 Intentando fallback con cliente normal (RLS)...")
      
      const { data: rlsUsuarios, error: rlsError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          role,
          is_admin,
          created_at,
          avatar_url
        `)
        .order("created_at", { ascending: false })
      
      if (!rlsError && rlsUsuarios) {
        usuarios = rlsUsuarios
        debugInfo.method = "client_rls"
        console.log("✅ Usuarios cargados con cliente normal (RLS):", usuarios.length)
      } else if (rlsError) {
        console.error("❌ Error con cliente normal:", rlsError.message)
        debugInfo.errorDetails = (debugInfo.errorDetails || "") + ` | RLS: ${rlsError.message}`
        throw new Error(`No se pudieron cargar usuarios: ${rlsError.message}`)
      }
    }

    // Si aún no hay usuarios y no hubo error, significa que simplemente no hay usuarios
    if (!usuarios) {
      usuarios = []
    }

  } catch (err: any) {
    console.error("❌ Error cargando usuarios:", err.message)
    error = err
  }

  return (
    <div className="min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Usuarios</h1>
        <p className="text-gray-400 text-sm">
          {usuarios?.length || 0} {usuarios?.length === 1 ? "usuario" : "usuarios"} registrados
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <p className="text-yellow-400 font-semibold mb-2">⚠️ Advertencia</p>
          <p className="text-yellow-300 text-sm mb-2">
            Hubo un problema al cargar los usuarios. Verifica los logs del servidor.
          </p>
          {error.message && (
            <p className="text-yellow-200 text-xs mb-1">
              Error: {error.message}
            </p>
          )}
          {error.code && (
            <p className="text-yellow-200 text-xs">
              Código: {error.code}
            </p>
          )}
          <div className="mt-3 p-2 bg-black/20 rounded text-xs text-gray-400">
            <p>Debug: Service Key configurada: {debugInfo.hasServiceKey ? "Sí" : "No"}</p>
            {debugInfo.method && <p>Método usado: {debugInfo.method}</p>}
            {debugInfo.errorDetails && <p>Detalles: {debugInfo.errorDetails}</p>}
          </div>
        </div>
      )}

      {usuarios && usuarios.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Usuario</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Rol</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Estado</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Registro</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr 
                  key={usuario.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {usuario.avatar_url ? (
                        <Image 
                          src={usuario.avatar_url} 
                          width={40}
                          height={40}
                          alt={usuario.full_name || "Usuario"} 
                          className="w-10 h-10 rounded-full object-cover"
                          unoptimized
                        />  
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold">
                          {(usuario.full_name?.[0] || usuario.email?.[0] || "U").toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium">
                        {usuario.full_name || "Sin nombre"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-300">
                    {usuario.email || "N/A"}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      {usuario.role || "person"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {usuario.is_admin ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                        Admin
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/40">
                        Usuario
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-400">
                    {usuario.created_at 
                      ? new Date(usuario.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })
                      : "N/A"}
                  </td>
                  <td className="py-4 px-4">
                    <DeleteUserButton 
                      userId={usuario.id}
                      userName={usuario.full_name || usuario.email || "Usuario"}
                      userEmail={usuario.email || ""}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No hay usuarios registrados</p>
          <p className="text-sm">Los usuarios aparecerán aquí cuando se registren en el sistema.</p>
        </div>
      )}
    </div>
  )
}
