import { createClient } from "@/utils/supabase/server"
import { checkAdminAuth } from "@/utils/admin-auth"

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic'

/**
 * Página de diagnóstico para verificar el estado de autenticación admin
 * Esta página ayuda a diagnosticar problemas de acceso al panel admin
 */
export default async function AdminDebugPage() {
  const supabase = await createClient()
  const authResult = await checkAdminAuth()
  
  // Obtener información adicional del usuario desde authResult
  const user = authResult.user ? { id: authResult.user.id, email: authResult.user.email } : null
  
  // Obtener perfil completo
  let profile = null
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    profile = data
  }

  return (
    <div className="min-h-screen p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Diagnóstico de Acceso Admin</h1>
        
        <div className="space-y-6">
          {/* Estado de Autenticación */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4">Estado de Autenticación</h2>
            <div className="space-y-2">
              <p><strong>Usuario autenticado:</strong> {user ? "✅ Sí" : "❌ No"}</p>
              {user && (
                <>
                  <p><strong>ID de usuario:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                </>
              )}
            </div>
          </div>

          {/* Estado de Admin */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4">Estado de Permisos Admin</h2>
            <div className="space-y-2">
              <p><strong>Resultado de checkAdminAuth:</strong></p>
              <pre className="bg-black/30 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(authResult, null, 2)}
              </pre>
              <p className={`text-lg font-bold ${authResult.user?.isAdmin ? 'text-green-400' : 'text-red-400'}`}>
                {authResult.user?.isAdmin ? "✅ Tienes permisos de admin" : "❌ NO tienes permisos de admin"}
              </p>
              {authResult.error && (
                <p className="text-red-400"><strong>Error:</strong> {authResult.error}</p>
              )}
            </div>
          </div>

          {/* Información del Perfil */}
          {profile && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold mb-4">Información del Perfil</h2>
              <div className="space-y-2">
                <p><strong>is_admin (raw):</strong> {String(profile.is_admin)}</p>
                <p><strong>is_admin (tipo):</strong> {typeof profile.is_admin}</p>
                <p><strong>is_admin === true:</strong> {String(profile.is_admin === true)}</p>
                <p><strong>is_admin === false:</strong> {String(profile.is_admin === false)}</p>
                <p><strong>is_admin == true:</strong> {String(profile.is_admin == true)}</p>
                <p><strong>Rol:</strong> {profile.role || "N/A"}</p>
                <p><strong>Nombre completo:</strong> {profile.full_name || "N/A"}</p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-400">Ver perfil completo (JSON)</summary>
                  <pre className="bg-black/30 p-4 rounded-lg overflow-auto text-sm mt-2">
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}

          {/* Instrucciones */}
          <div className="bg-blue-500/20 backdrop-blur-md rounded-2xl p-6 border border-blue-500/40">
            <h2 className="text-xl font-bold mb-4">📋 Instrucciones</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Verifica que el email mostrado sea <strong>mantoniorodriguez94@gmail.com</strong></li>
              <li>Verifica que <strong>is_admin</strong> sea <code className="bg-black/30 px-2 py-1 rounded">true</code> (no &quot;true&quot; como string)</li>
              <li>Si <strong>is_admin</strong> es <code className="bg-black/30 px-2 py-1 rounded">null</code> o <code className="bg-black/30 px-2 py-1 rounded">false</code>, necesitas ejecutar el script SQL para otorgar permisos</li>
              <li>Si todo está correcto pero aún no puedes acceder, revisa los logs del servidor en la consola</li>
            </ol>
          </div>

          {/* Enlaces */}
          <div className="flex gap-4">
            <a 
              href="/app/admin" 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition"
            >
              Intentar acceder al panel admin
            </a>
            <a 
              href="/app/dashboard" 
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-xl font-semibold transition"
            >
              Volver al dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

