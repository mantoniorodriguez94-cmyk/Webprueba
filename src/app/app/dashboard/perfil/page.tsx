"use client"
import React, { useState, useEffect } from "react"
import AuthGate from "@/components/auth/AuthGate"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import useMembershipAccess from "@/hooks/useMembershipAccess"
import { getBadgeTypeForTier, type MembershipTier } from "@/lib/memberships/tiers"
import MembershipBadge from "@/components/memberships/MembershipBadge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ClaimBusinessForm from "@/components/business/ClaimBusinessForm"
import { toast } from "sonner"
import { alertModal } from "@/lib/alertModal"
import { Star } from "lucide-react"

export default function PerfilPage() {
  const { user, loading: userLoading } = useUser()
  const { effectiveTier, loading: membershipLoading } = useMembershipAccess()
  const [isAdmin, setIsAdmin] = useState(false)

  // ============================================================
  // 🔥 DETECTAR SI EL USUARIO ES ADMIN
  // ============================================================
  // ⚠️ IMPORTANTE: Usamos API route para evitar problemas de RLS
  // que pueden impedir leer is_admin desde el cliente
  useEffect(() => {
    const loadAdminFlag = async () => {
      if (!user) {
        setIsAdmin(false)
        return
      }

      try {
        // Usar API route del servidor para leer is_admin
        // ⚠️ IMPORTANTE: Usar ruta relativa (no URL absoluta) para que funcione en local y producción
        const response = await fetch('/api/user/is-admin', {
          cache: 'no-store' // Evitar cache
        })
        const data = await response.json()

        if (data.isAdmin === true) {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
          if (data.error) {
            console.warn('⚠️ Error verificando admin:', data.error)
          }
        }
      } catch (error) {
        console.error('❌ Error verificando admin:', error)
        setIsAdmin(false)
      }
    }

    loadAdminFlag()
  }, [user])

  const router = useRouter()
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [converting, setConverting] = useState(false)
  const [negocios, setNegocios] = useState<{id: string, name?: string, is_premium?: boolean, premium_until?: string}[]>([])

  const userRole = user?.user_metadata?.role ?? "person"
  const isCompany = userRole === "company"

  // Verificar si el usuario tiene al menos un negocio premium activo
  const isPremium = negocios.some(negocio =>
    negocio.is_premium === true &&
    negocio.premium_until &&
    new Date(negocio.premium_until) > new Date()
  )

  // Calcular días restantes de premium
  const getDaysRemaining = (premiumUntil?: string): number | null => {
    if (!premiumUntil) return null
    const now = new Date()
    const end = new Date(premiumUntil)
    const diff = end.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const fullName = user?.user_metadata?.full_name || "Usuario"
  const email = user?.email || ""
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [invitedCount, setInvitedCount] = useState(0)
  const [qualifiedInvitedCount, setQualifiedInvitedCount] = useState(0)
  const currentBadgeType = getBadgeTypeForTier(effectiveTier as MembershipTier)

  // ============================================================
  // Mensajes no leídos
  // ============================================================
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!user) return

      try {
        if (isCompany) {
          const { data: businesses } = await supabase
            .from("businesses")
            .select("id, name, is_premium, premium_until")
            .eq("owner_id", user.id)

          if (!businesses || businesses.length === 0) {
            setNegocios([])
            setUnreadMessagesCount(0)
            return
          }

          setNegocios(businesses)

          // NOTA: aquí se cargaba la suscripción del producto "Negocio Premium"
          // (business_subscriptions + premium_plans). Ese producto fue eliminado;
          // el estado de membresía vive en /app/dashboard/membresia.
          const businessIds = businesses.map(b => b.id)

          const { data: conversations } = await supabase
            .from("conversations")
            .select("id")
            .in("business_id", businessIds)

          if (!conversations || conversations.length === 0) {
            setUnreadMessagesCount(0)
            return
          }

          const conversationIds = conversations.map(c => c.id)

          const { data: unreadMessages } = await supabase
            .from("messages")
            .select("id")
            .in("conversation_id", conversationIds)
            .eq("is_read", false)
            .neq("sender_id", user.id)

          setUnreadMessagesCount(unreadMessages?.length || 0)

        } else {
          const { data: conversations } = await supabase
            .from("conversations")
            .select("id")
            .eq("user_id", user.id)

          if (!conversations || conversations.length === 0) {
            setUnreadMessagesCount(0)
            return
          }

          const ids = conversations.map(c => c.id)

          const { data: unreadMessages } = await supabase
            .from("messages")
            .select("id")
            .in("conversation_id", ids)
            .eq("is_read", false)
            .neq("sender_id", user.id)

          setUnreadMessagesCount(unreadMessages?.length || 0)
        }
      } catch (err) {
        console.error("Error fetching unread messages:", err)
      }
    }

    fetchUnreadMessages()
    const interval = setInterval(fetchUnreadMessages, 30000)
    return () => clearInterval(interval)
  }, [user, isCompany])

  // ============================================================
  // Contador de referidos (registrados vs calificados)
  // ============================================================
  useEffect(() => {
    const loadInvitedCounts = async () => {
      if (!user) {
        setInvitedCount(0)
        setQualifiedInvitedCount(0)
        return
      }
      try {
        // Total registros con tu link
        const { count: totalCount, error: totalError } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("referred_by", user.id)

        if (totalError) {
          console.warn("Error cargando referidos totales:", totalError)
        } else {
          setInvitedCount(totalCount ?? 0)
        }

        // Referidos calificados: tienen algún plan de suscripción (tier >= 1)
        const { count: qualifiedCount, error: qualifiedError } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("referred_by", user.id)
          .gt("subscription_tier", 0)

        if (qualifiedError) {
          console.warn("Error cargando referidos calificados:", qualifiedError)
        } else {
          setQualifiedInvitedCount(qualifiedCount ?? 0)
        }
      } catch (err) {
        console.error("Error inesperado cargando referidos:", err)
      }
    }

    loadInvitedCounts()
  }, [user])

  // ============================================================
  // Logout
  // ============================================================
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  // ============================================================
  // Convertir a cuenta negocio
  // ============================================================
  const handleConvertToCompany = async () => {
    if (!user) return

    try {
      setConverting(true)

      const { error } = await supabase.auth.updateUser({
        data: {
          role: "company",
          allowed_businesses: 1
        }
      })

      if (error) throw error

      alertModal.success("Cuenta convertida a tipo Negocio", {
        description: "Tu cuenta ahora es de tipo Negocio. Recarga la página para ver los cambios.",
        confirmLabel: "Recargar página",
        onClose: () => window.location.reload()
      })
    } catch (error: any) {
      console.error("Error:", error)
      alertModal.error("Error al convertir cuenta", {
        description: error.message || String(error)
      })
    } finally {
      setConverting(false)
      setShowConvertModal(false)
    }
  }

  // ============================================================
  // Loaders y validaciones base
  // ============================================================
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-ink-2">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthGate accion="ver tu perfil" />
  }

  // ============================================================
  // CONTENIDO PRINCIPAL
  // ============================================================
  return (
    <div className="min-h-screen lg:pb-8">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/8">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Mi Perfil
            </h1>

            <Link href="/app/dashboard">
              <button className="p-2 rounded-full text-ink-2 hover:text-ink hover:bg-black/5 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* INFORMACIÓN DE USUARIO */}
      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">

        {/* Identidad — compacta a propósito.
            Antes era un bloque violeta de 8 de padding con avatar de 80px que
            ocupaba casi un tercio de la pantalla para mostrar tres datos. Además
            contradecía la regla de la paleta: el color saturado es el acento, no
            un campo grande. Ahora el violeta vive solo en el avatar. */}
        <div className="surface rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-[#E24FD6] via-[#7C5CF0] to-[#5B9BF0] flex items-center justify-center text-lg font-bold text-white">
              {fullName[0]?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold text-ink leading-tight truncate">
                {fullName}
              </h2>
              <p className="text-xs text-ink-2 truncate">{email}</p>
            </div>

            {membershipLoading ? (
              <span className="inline-flex h-6 w-14 animate-pulse rounded-full bg-black/5 flex-shrink-0" />
            ) : (
              <MembershipBadge type={currentBadgeType} className="flex-shrink-0" />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-ink-2">
              {isCompany ? "Cuenta de negocio" : "Cuenta personal"}
            </span>
            {isAdmin && (
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 border border-red-100">
                Administrador
              </span>
            )}
          </div>
        </div>

        {/* ============================================
            SECCIÓN RECLAMAR NEGOCIO (SOLO ADMIN)
        ============================================ */}
        {isAdmin && <ClaimBusinessForm />}

        {/* ============================================
            TU CUENTA
            Ya no hay enlaces a Membresía, Mi negocio ni Mensajes: los tres
            viven en la barra inferior, y repetirlos acá convertía el perfil
            en un segundo menú de navegación en vez de un lugar donde
            controlás tu cuenta.
        ============================================ */}
        {!isCompany && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-ink px-2">Tu cuenta</h3>

            <button
              onClick={() => setShowConvertModal(true)}
              className="w-full surface rounded-3xl p-5 hover:border-black/15 transition-all flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 9.5h17v10a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-10ZM3 9.5 5 4h14l2 5.5M9.5 21v-5h5v5" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-ink">Convertir en cuenta de negocio</h4>
                <p className="text-sm text-ink-2">Publica tu negocio y recibe clientes</p>
              </div>
              <svg className="w-5 h-5 text-ink-2 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* ============================================
            INVITACIONES
            Sube desde el fondo de la pantalla: es lo único de esta página
            que no vive en ningún otro lado, y encima es el motor de
            crecimiento del producto. Estaba enterrado bajo tres enlaces que
            solo repetían la barra inferior.
        ============================================ */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-ink px-2">Invitaciones</h3>

            <div className="surface rounded-3xl overflow-hidden">
              {/* Encabezado: la recompensa primero, que es lo que motiva */}
              <div className="p-5 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 flex-shrink-0 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-ink leading-tight">Invita a tus amigos</h4>
                    <p className="text-sm text-ink-2 mt-0.5">
                      Por cada 3 negocios que se sumen, ganas{" "}
                      <span className="font-semibold text-amber-600">un mes de Patrocina gratis</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Progreso: el dato que la persona vuelve a mirar */}
              <div className="px-5 pb-4">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-medium text-ink-2">Invitados válidos</span>
                  <span className="font-mono text-sm font-bold text-ink tabular-nums">
                    {qualifiedInvitedCount}<span className="text-ink-2 font-normal"> / 3</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (qualifiedInvitedCount / 3) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] leading-snug text-ink-2">
                  Se registraron {invitedCount}. Un invitado cuenta como válido cuando activa
                  cualquier plan (Conecta, Destaca o Patrocina).
                </p>
              </div>

              {/* Acciones: el enlace y las dos formas de compartirlo */}
              <div className="border-t border-black/5 bg-black/[0.02] p-4 space-y-2">
                <div className="truncate rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-xs text-ink-2">
                  {`appencuentra.com/register?ref=${user?.id || ""}`}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const link = `https://appencuentra.com/register?ref=${user?.id || ""}`
                      try {
                        await navigator.clipboard.writeText(link)
                        toast.success("Enlace de invitación copiado")
                      } catch (err) {
                        console.error("Error copiando:", err)
                        toast.error("No se pudo copiar el enlace. Intentá de nuevo.")
                      }
                    }}
                    className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-black/[0.03] transition-colors"
                  >
                    Copiar enlace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const link = `https://appencuentra.com/register?ref=${user?.id || ""}`
                      const message = `¡Hola! Únete a App Encuentra y haz crecer tu negocio. Si te registras con mi link y activas un plan, ¡ambos ganamos beneficios! ${link}`
                      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer")
                    }}
                    className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                  >
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>
        </div>


        {/* ============================================
            SECCIÓN CONFIGURACIÓN (BOTÓN ADMIN AQUÍ)
        ============================================ */}
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-bold text-ink px-2">Configuración</h3>

          {/* 🔥 BOTÓN PANEL ADMIN — SOLO PARA ADMINISTRADORES */}
          {isAdmin && (
            <Link href="/app/admin">
              <div className="
                bg-red-50
                rounded-3xl border border-red-200
                p-5 cursor-pointer
                hover:border-red-300 hover:shadow-md
                transition-all flex items-center gap-4
              ">
                
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" />
                  </svg>
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold text-ink">Panel de Control Admin</h4>
                  <p className="text-sm text-ink-2">Administración interna del sistema</p>
                </div>

                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )}

          {/* Antes había acá una tarjeta "Preferencias" que en realidad
              llevaba a la gestión de negocios: decía una cosa y hacía otra.
              La reemplazan los legales, que no tenían lugar en ninguna
              pantalla de la app. */}
          <div className="surface rounded-3xl divide-y divide-black/5 overflow-hidden">
            <Link
              href="/soporte"
              className="flex items-center gap-3 px-5 py-4 hover:bg-black/[0.02] transition-colors"
            >
              <span className="flex-1 text-sm font-medium text-ink">Soporte y contacto</span>
              <svg className="w-4 h-4 text-ink-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/terminos"
              className="flex items-center gap-3 px-5 py-4 hover:bg-black/[0.02] transition-colors"
            >
              <span className="flex-1 text-sm font-medium text-ink">Términos y condiciones</span>
              <svg className="w-4 h-4 text-ink-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/privacidad"
              className="flex items-center gap-3 px-5 py-4 hover:bg-black/[0.02] transition-colors"
            >
              <span className="flex-1 text-sm font-medium text-ink">Política de privacidad</span>
              <svg className="w-4 h-4 text-ink-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* CERRAR SESIÓN */}
        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-600 font-bold py-4 rounded-3xl transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>

      </div>

      {/* MODAL CONVERTIR A NEGOCIO */}
      {showConvertModal && (
        <>
          <div
            className="fixed inset-0 bg-ink/40 z-50"
            onClick={() => setShowConvertModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="surface-elevated rounded-3xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-ink mb-4">Convertir a Cuenta Negocio</h3>

              <p className="text-ink-2 text-sm mb-6">
                Convertirás tu cuenta personal en una cuenta de negocio. Podrás crear y gestionar negocios propios.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleConvertToCompany}
                  disabled={converting}
                  className="w-full bg-blue-500 hover:bg-blue-600 py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                >
                  {converting ? "Convirtiendo..." : "Convertir ahora"}
                </button>

                <button
                  onClick={() => setShowConvertModal(false)}
                  disabled={converting}
                  className="w-full bg-black/5 hover:bg-black/10 py-3 rounded-xl text-ink font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* FOOTER NAV */}
    </div>
  )
}
