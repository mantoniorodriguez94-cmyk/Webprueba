import { createClient } from "@/utils/supabase/server"
import { requireAdmin } from "@/utils/admin-auth"
import Image from "next/image";

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

  const { data: usuarios, error } = await supabase
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

  if (error) {
    console.error("Error cargando usuarios:", JSON.stringify(error, null, 2))
  }

  return (
    <div className="min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Usuarios</h1>
        <p className="text-gray-400 text-sm">
          {usuarios?.length || 0} {usuarios?.length === 1 ? "usuario" : "usuarios"} registrados
        </p>
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/40 rounded-xl">
            <p className="text-red-300 font-semibold mb-2">Error al cargar usuarios</p>
            <p className="text-red-200 text-sm">{error.message}</p>
            <p className="text-red-200 text-xs mt-2">
              💡 Ejecuta el script: scripts/fix-profiles-admin-rls.sql en Supabase SQL Editor
            </p>
          </div>
        )}
      </div>

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
