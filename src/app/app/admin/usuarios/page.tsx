import { requireAdmin } from "@/utils/admin-auth"
import Image from "next/image"
import DeleteUserButton from "./components/DeleteUserButton"
import { getUsersFromAuth } from "@/utils/admin-users"

// Forzar renderizado dinámico porque usa cookies para autenticación
export const dynamic = 'force-dynamic'

/**
 * Página de gestión de usuarios (Admin)
 * - Lista todos los usuarios registrados en el sistema usando auth.admin.listUsers()
 * - Source of Truth: auth.users (no profiles)
 */
export default async function AdminUsuariosPage() {
  // Verificar que el usuario es admin
  await requireAdmin()

  // Obtener usuarios usando auth.admin.listUsers() - Source of Truth
  const { users: usuarios, error, debugInfo } = await getUsersFromAuth()

  return (
    <div className="min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Usuarios</h1>
        <p className="text-gray-400 text-sm">
          {usuarios?.length || 0} {usuarios?.length === 1 ? "usuario" : "usuarios"} registrados
        </p>
      </div>

      {error && (
        <div className="mb-6 p-5 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3 mb-4">
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
              <p className="text-red-400 font-semibold mb-1">❌ Error al cargar usuarios</p>
              <p className="text-red-300 text-sm">
                {error.message || 'Error desconocido'}
              </p>
            </div>
          </div>
          
          {/* Debug info expandible */}
          {debugInfo && debugInfo.length > 0 && (
            <details className="mb-4">
              <summary className="cursor-pointer text-xs text-red-200 font-semibold mb-2 hover:text-red-100 transition-colors">
                🔍 Información de diagnóstico
              </summary>
              <div className="mt-3 p-4 bg-red-950/50 rounded-lg border border-red-500/20">
                <div className="space-y-1 font-mono text-xs text-red-200">
                  {debugInfo.map((info, idx) => (
                    <div key={idx}>{info}</div>
                  ))}
                </div>
              </div>
            </details>
          )}

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm font-semibold mb-2">💡 Soluciones posibles:</p>
            <ul className="text-blue-200 text-sm space-y-1.5 list-disc list-inside">
              <li>Verificar que <code className="bg-black/30 px-1.5 py-0.5 rounded">SUPABASE_SERVICE_ROLE_KEY</code> está configurada en producción</li>
              <li>Revisar que la Service Role Key tiene permisos de admin</li>
              <li>Confirmar que la URL de Supabase es correcta</li>
              <li>Verificar los logs del servidor de Next.js para más detalles</li>
              <li>Verificar que la variable de entorno no tenga espacios extras o caracteres especiales</li>
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
                        {usuario.full_name || usuario.email?.split('@')[0] || "Sin nombre"}
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
      ) : !error ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No hay usuarios registrados</p>
          <p className="text-sm">Los usuarios aparecerán aquí cuando se registren en el sistema.</p>
        </div>
      ) : null}
    </div>
  )
}
