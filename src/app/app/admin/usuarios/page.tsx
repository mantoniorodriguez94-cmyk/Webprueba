import { requireAdmin } from "@/utils/admin-auth"
import Image from "next/image"
import DeleteUserButton from "./components/DeleteUserButton"
import SuspendUserButton from "./components/SuspendUserButton"
import ManageLimitsButton from "../components/ManageLimitsButton"
import { createAdminClient } from "@/lib/supabase/admin"

// Force fresh server render on every request — no data-layer caching at all
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface UserData {
  id: string
  email: string | undefined
  full_name: string | null
  role: string
  is_admin: boolean
  created_at: string
  avatar_url: string | null
  suspended_at: string | null
}

/* Las piezas de cada usuario, una sola vez.
 *
 * La lista se pinta de dos formas —tarjetas en móvil, tabla en escritorio—
 * porque seis columnas no caben en un teléfono: la tabla llevaba
 * overflow-x-auto y eso "funcionaba" en el sentido de que no rompía el
 * layout, pero obligaba a leer los datos a trozos arrastrando de lado, y los
 * correos largos salían cortados a media palabra.
 *
 * Definirlas acá es lo que evita que las dos formas se separen: si mañana se
 * añade un estado o una acción, aparece en las dos o en ninguna.
 */

function Avatar({ usuario }: { usuario: UserData }) {
  if (usuario.avatar_url) {
    return (
      <Image
        src={usuario.avatar_url}
        width={40}
        height={40}
        alt={usuario.full_name || "Usuario"}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        unoptimized
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
      {(usuario.full_name?.[0] || usuario.email?.[0] || "U").toUpperCase()}
    </div>
  )
}

function nombreDe(usuario: UserData) {
  return usuario.full_name || usuario.email?.split("@")[0] || "Sin nombre"
}

function fechaDe(usuario: UserData) {
  if (!usuario.created_at) return "N/A"
  return new Date(usuario.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const PILDORA = "text-xs px-2 py-1 rounded-full border"

function Rol({ usuario }: { usuario: UserData }) {
  return (
    <span className={`${PILDORA} bg-blue-50 text-blue-700 border-blue-200`}>
      {usuario.role || "person"}
    </span>
  )
}

function Estado({ usuario }: { usuario: UserData }) {
  return (
    <>
      {usuario.is_admin ? (
        <span className={`${PILDORA} bg-amber-50 text-amber-700 border-amber-200`}>Admin</span>
      ) : (
        <span className={`${PILDORA} bg-black/5 text-ink-2 border-black/10`}>Usuario</span>
      )}
      {usuario.suspended_at && (
        <span className={`${PILDORA} bg-red-50 text-red-700 border-red-200`}>Suspendido</span>
      )}
    </>
  )
}

function Acciones({ usuario }: { usuario: UserData }) {
  const nombre = usuario.full_name || usuario.email || "Usuario"
  return (
    <>
      <ManageLimitsButton profileId={usuario.id} profileName={nombre} />
      <SuspendUserButton
        profileId={usuario.id}
        profileName={nombre}
        suspendido={Boolean(usuario.suspended_at)}
      />
      <DeleteUserButton
        userId={usuario.id}
        userName={nombre}
        userEmail={usuario.email || ""}
      />
    </>
  )
}

/**
 * Página de gestión de usuarios (Admin)
 * - Lista todos los usuarios registrados en el sistema
 * - Usa cliente admin con Service Role Key para bypass RLS
 */
export default async function AdminUsuariosPage() {
  // Verificar que el usuario es admin
  await requireAdmin()

  let usuarios: UserData[] = []
  let error: Error | null = null

  try {
    // Fresh admin client per render (avoids singleton stale-data issues)
    const adminSupabase = createAdminClient()

    // Método 1: Intentar auth.admin.listUsers() primero (más confiable)
    try {
      const { data: authData, error: authError } = await adminSupabase.auth.admin.listUsers()

      if (!authError && authData?.users) {
        usuarios = authData.users.map((user): UserData => ({
          id: user.id,
          email: user.email,
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            null,
          role: user.user_metadata?.role || 'person',
          is_admin: user.user_metadata?.is_admin === true,
          created_at: user.created_at,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          suspended_at: null,
        }))
      } else {
        throw authError || new Error('No se obtuvieron usuarios')
      }
    } catch (authErr: any) {
      // Método 2: Fallback a profiles usando admin client (bypass RLS)
      console.warn('⚠️ auth.admin.listUsers() falló, usando fallback a profiles:', authErr.message)
      
      const { data: profilesData, error: profilesError } = await adminSupabase
        .from('profiles')
        .select('id, email, full_name, role, is_admin, created_at, avatar_url, suspended_at')
        .order('created_at', { ascending: false })

      if (profilesError) {
        throw profilesError
      }

      if (profilesData) {
        usuarios = profilesData.map((profile: any): UserData => ({
          id: profile.id,
          email: profile.email || undefined,
          full_name: profile.full_name || null,
          role: profile.role || 'person',
          is_admin: profile.is_admin === true,
          created_at: profile.created_at || new Date().toISOString(),
          avatar_url: profile.avatar_url || null,
          suspended_at: profile.suspended_at ?? null,
        }))
      }
    }

    // profiles es la fuente de verdad del rol y de la suspensión.
    // auth.admin.listUsers() sólo devuelve user_metadata, y el metadata dejó
    // de conceder permisos al cerrar la escalada de privilegios: leerlo acá
    // haría que un administrador real apareciera como usuario normal, y que
    // alguien que se puso is_admin en su propio metadata apareciera como
    // administrador sin serlo.
    if (usuarios.length > 0) {
      const { data: perfiles } = await adminSupabase
        .from('profiles')
        .select('id, is_admin, suspended_at')
        .in('id', usuarios.map((u) => u.id))

      const porId = new Map((perfiles ?? []).map((p: any) => [p.id, p]))
      usuarios = usuarios.map((u) => {
        const p: any = porId.get(u.id)
        return p
          ? { ...u, is_admin: p.is_admin === true, suspended_at: p.suspended_at ?? null }
          : u
      })
    }
  } catch (err: any) {
    console.error('❌ Error cargando usuarios:', err)
    error = err as Error
  }

  return (
    <div className="min-h-screen text-ink">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Usuarios</h1>
        <p className="text-ink-2 text-sm">
          {usuarios?.length || 0} {usuarios?.length === 1 ? "usuario" : "usuarios"} registrados
        </p>
      </div>

      {error && (
        <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
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
              <p className="text-red-700 font-semibold mb-1">❌ Error al cargar usuarios</p>
              <p className="text-red-700 text-sm">
                {error.message || 'Error desconocido'}
              </p>
              <p className="text-red-600/80 text-xs mt-2">
                Si el problema persiste, verifica que las variables de entorno estén configuradas correctamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {usuarios && usuarios.length > 0 ? (
        <>
          {/* Móvil: una tarjeta por persona. El correo con break-all, que es
              el dato que se cortaba a media palabra en la tabla. */}
          <div className="flex flex-col gap-3 md:hidden">
            {usuarios.map((usuario) => (
              <div
                key={usuario.id}
                className="rounded-2xl border border-black/8 bg-white p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar usuario={usuario} />
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{nombreDe(usuario)}</p>
                    <p className="text-xs text-ink-2 break-all">{usuario.email || "N/A"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Rol usuario={usuario} />
                  <Estado usuario={usuario} />
                </div>

                <p className="text-xs text-ink-2">Registro: {fechaDe(usuario)}</p>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-black/5">
                  <Acciones usuario={usuario} />
                </div>
              </div>
            ))}
          </div>

          {/* Escritorio: la tabla, que acá sí es la forma correcta — catorce
              filas se comparan de un vistazo columna a columna. */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-ink-2">Usuario</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-ink-2">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-ink-2">Rol</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-ink-2">Estado</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-ink-2">Registro</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-ink-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="border-b border-black/5 hover:bg-black/[0.02] transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar usuario={usuario} />
                        <span className="font-medium">{nombreDe(usuario)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-ink-2">{usuario.email || "N/A"}</td>
                    <td className="py-4 px-4"><Rol usuario={usuario} /></td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Estado usuario={usuario} />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-ink-2">{fechaDe(usuario)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Acciones usuario={usuario} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : !error ? (
        <div className="text-center py-12 text-ink-2">
          <p className="text-lg mb-2">No hay usuarios registrados</p>
          <p className="text-sm">Los usuarios aparecerán aquí cuando se registren en el sistema.</p>
        </div>
      ) : null}
    </div>
  )
}
