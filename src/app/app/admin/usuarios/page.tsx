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

  // Cargar usuarios usando diferentes métodos
  let usuarios: any[] | null = null
  let error: any = null
  let debugInfo: string[] = []

  try {
    // Verificar variables de entorno
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    
    debugInfo.push(`✓ Service Role Key presente: ${hasServiceKey}`)
    debugInfo.push(`✓ Supabase URL presente: ${hasUrl}`)
    
    if (!hasServiceKey || !hasUrl) {
      throw new Error("Variables de entorno no configuradas correctamente en producción")
    }

    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    
    // Crear cliente con service role
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    debugInfo.push('✓ Cliente service role creado')
    
    // MÉTODO 1: Intentar desde auth.admin.listUsers() PRIMERO (más confiable)
    try {
      const { data: authData, error: authError } = await serviceSupabase.auth.admin.listUsers()
      
      if (authError) {
        debugInfo.push(`✗ auth.admin.listUsers() falló: ${authError.message}`)
        throw authError
      }
      
      if (authData?.users) {
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
        debugInfo.push(`✓ ${usuarios.length} usuarios cargados desde auth.admin.listUsers()`)
        console.log("✅ Usuarios cargados desde auth.users:", usuarios.length)
      }
    } catch (authErr: any) {
      debugInfo.push(`✗ Método auth.admin falló, intentando profiles: ${authErr.message}`)
      
      // MÉTODO 2: Fallback a profiles
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
      
      if (serviceError) {
        debugInfo.push(`✗ Profiles query falló: ${serviceError.message}`)
        throw new Error(`Ambos métodos fallaron. Auth: ${authErr.message}, Profiles: ${serviceError.message}`)
      }
      
      if (serviceUsuarios) {
        usuarios = serviceUsuarios
        debugInfo.push(`✓ ${usuarios.length} usuarios cargados desde profiles`)
        console.log("✅ Usuarios cargados desde profiles (service role):", usuarios.length)
      }
    }
  } catch (err: any) {
    error = err
    debugInfo.push(`✗ Error final: ${err.message}`)
    console.error("❌ Error cargando usuarios:", err)
    console.error("Debug info:", debugInfo)
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
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 font-semibold mb-2">❌ Error al cargar usuarios</p>
          <p className="text-red-300 text-sm mb-3">
            {error.message || 'Error desconocido'}
          </p>
          
          {/* Debug info expandible */}
          <details className="text-xs text-red-200 bg-red-950/50 p-3 rounded-lg">
            <summary className="cursor-pointer font-semibold mb-2">🔍 Información de diagnóstico</summary>
            <div className="mt-2 space-y-1 font-mono">
              {debugInfo.map((info, idx) => (
                <div key={idx}>{info}</div>
              ))}
            </div>
          </details>

          <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-xs font-semibold mb-1">💡 Soluciones posibles:</p>
            <ul className="text-blue-200 text-xs space-y-1 list-disc list-inside">
              <li>Verificar que SUPABASE_SERVICE_ROLE_KEY está configurada en producción</li>
              <li>Revisar que la Service Role Key tiene permisos de admin</li>
              <li>Confirmar que la URL de Supabase es correcta</li>
              <li>Verificar los logs del servidor de Next.js</li>
            </ul>
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
