"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Loader2, Shield } from "lucide-react"
import { toast } from "sonner"
import ConfirmationModal from "@/components/ui/ConfirmationModal"
import { banderaVigente } from "@/lib/memberships/perks"
import AdminUserManagementModal from "./AdminUserManagementModal"
import SuspendUserButton from "@/app/app/admin/usuarios/components/SuspendUserButton"
import HideBusinessButton from "./HideBusinessButton"

export type AdminBusinessRow = {
  id: string
  name: string | null
  logo_url: string | null
  is_premium: boolean
  premium_until: string | null
  created_at?: string
  is_verified?: boolean
  owner_id?: string | null
  is_featured?: boolean
  featured_until?: string | null
  has_gold_border?: boolean
  search_priority_boost?: boolean
  badges?: string[]
  hidden_at?: string | null
  // Del perfil del dueño. La búsqueda del panel es por persona más que por
  // negocio: alguien escribe a soporte y hay que dar con su ficha.
  owner_email?: string | null
  owner_name?: string | null
  owner_tier?: number
  owner_tier_end?: string | null
}

/* El color de cada acción dice su CONSECUENCIA, no su categoría.
 *
 * Eran once pastillas en seis tonos —violeta, magenta, verde, azul, naranja,
 * rojo— repartidos sin criterio: "Verificado" en verde y "Gestionar badges"
 * también, pero "Spotlight" en magenta y "Destacar negocio" en azul, siendo
 * las dos lo mismo (dar visibilidad). El color no informaba de nada y el
 * bloque parecía un semáforo averiado.
 *
 * Tres niveles y ya:
 *   neutro   — reversible y cotidiano. La mayoría.
 *   atención — destruye contenido o restringe, pero se puede deshacer.
 *   peligro  — irreversible.
 *
 * El ámbar es el que tailwind.config declara "señal de atención", y el rojo
 * el de siempre. Nada de naranja: no está en la paleta.
 */
const BOTON_BASE =
  "w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
const BOTON_NEUTRO = `${BOTON_BASE} bg-black/[0.04] hover:bg-black/[0.08] text-ink border border-black/8`
const BOTON_ATENCION = `${BOTON_BASE} bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200`
const BOTON_PELIGRO = `${BOTON_BASE} bg-red-50 hover:bg-red-100 text-red-700 border border-red-200`

const TIER_LABELS: Record<number, string> = {
  0: "Básico",
  1: "Conecta",
  2: "Destaca",
  3: "Patrocina",
}

function getDaysUntilExpiry(premiumUntil: string | null): number | null {
  if (!premiumUntil) return null
  const expiry = new Date(premiumUntil)
  const now = new Date()
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

export default function AdminQuickActions({ business, onActionSuccess }: { business: AdminBusinessRow; onActionSuccess?: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showFeaturedModal, setShowFeaturedModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showResetPhotosModal, setShowResetPhotosModal] = useState(false)
  const [resetPhotosConfirmStep, setResetPhotosConfirmStep] = useState(1)
  const [resetLogoChoice, setResetLogoChoice] = useState(false)
  const [showLimitsModal, setShowLimitsModal] = useState(false)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [sendingAlert, setSendingAlert] = useState(false)
  const [showBadgesModal, setShowBadgesModal] = useState(false)
  const [badgesLoading, setBadgesLoading] = useState(false)
  const [selectedBadges, setSelectedBadges] = useState<string[]>([])
  const [isActionUnlocked, setIsActionUnlocked] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pin, setPin] = useState("")
  const [pinLoading, setPinLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  // Controlled value for tier select — resetting to "" allows re-selecting the same tier
  const [selectedTier, setSelectedTier] = useState("")
  const [softDeleted, setSoftDeleted] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refresh = () => {
    onActionSuccess?.()
    router.refresh()
  }

  const ACTION_LABELS: Record<string, string> = {
    verification: "Verificación",
    tier: "Tier",
    spotlight: "Spotlight",
    delete: "Eliminación",
    reset: "Reset de fotos",
    searchBoost: "Destacar negocio",
  }

  const call = async (action: string, body: Record<string, unknown>, endpoint: string, actionLabel?: string) => {
    setLoading(action)
    setError(null)
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const errorMsg = (data && (data.error as string)) || `Error (${res.status}) al ejecutar la acción`
        console.error("[AdminQuickActions] Error en acción", action, "→", endpoint, {
          status: res.status,
          body: data,
        })
        // If the server says the master PIN is missing/expired, clear the unlock flag
        // and re-show the PIN modal so the admin can re-authenticate without confusion.
        if (res.status === 403 && errorMsg.toLowerCase().includes("pin maestro")) {
          setIsActionUnlocked(false)
          setError(null)
          toast.error("Sesión de PIN expirada", {
            description: "Vuelve a ingresar el PIN maestro para autorizar esta acción.",
          })
          // Re-queue the action so the PIN modal immediately re-triggers it on success
          setPendingAction(() => () => call(action, body, endpoint, actionLabel))
          setShowPinModal(true)
          return
        }
        throw new Error(errorMsg)
      }
      if (action !== "delete") {
        const label = actionLabel ?? ACTION_LABELS[action] ?? "Acción"
        toast.success(`¡Acción exitosa!: ${label}`)
      }
      refresh()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido al ejecutar acción de administrador"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(null)
    }
  }

  const ensureUnlocked = (action: () => void) => {
    if (isActionUnlocked) {
      action()
      return
    }
    setPendingAction(() => action)
    setShowPinModal(true)
  }

  const toggleVerification = () => call("verification", { businessId: business.id }, "/api/admin/business/toggle-verification")
  const toggleSpotlight = () => call("spotlight", { businessId: business.id }, "/api/admin/business/toggle-spotlight")
  const tierOverride = (tier: number) => call("tier", { businessId: business.id, tier }, "/api/admin/business/tier-override")
  const deleteBusiness = () => call("delete", { businessId: business.id }, "/api/admin/business/delete", "Eliminación")
  const resetPhotos = (resetLogo: boolean) => call("reset", { businessId: business.id, resetLogo }, "/api/admin/business/reset-photos", "Reset de fotos")

  const toggleSearchPriority = () =>
    call(
      "searchPriority",
      { businessId: business.id },
      "/api/admin/business/toggle-search-priority",
      "Destacar negocio"
    )

  const inSpotlight = business.is_featured && business.featured_until && new Date(business.featured_until) > new Date()
  const hasSearchPriority =
    (business as any).search_priority === true || business.search_priority_boost === true
  const daysLeft = getDaysUntilExpiry(business.premium_until)
  const businessName = business.name || "Negocio"

  const sendAlert = async () => {
    const profileId = business.owner_id
    if (!profileId) return
    setSendingAlert(true)
    try {
      const res = await fetch("/api/admin/profile-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, message: alertMessage.trim() }),
      })
      const data = await res.json()
      if (res.status === 200 && data.success) {
        toast.success("¡Acción exitosa!: Enviar Alerta")
        setShowAlertModal(false)
        setAlertMessage("")
        refresh()
      } else {
        toast.error(data.error || "Error: No se pudo completar la acción. Inténtalo de nuevo.")
      }
    } catch (_e: unknown) {
      toast.error("Error: No se pudo completar la acción. Inténtalo de nuevo.")
    } finally {
      setSendingAlert(false)
    }
  }

  /**
   * Una acción: qué hace, escrito encima, y el control debajo.
   *
   * Antes la explicación vivía detrás de un icono (i) que había que pulsar,
   * uno por uno, para saber qué era cada botón. En un panel con once acciones
   * —varias destructivas— esconder justo lo que distingue "Ocultar" de
   * "Eliminar" detrás de un clic extra es al revés de como debería ser.
   *
   * Y de paso se recupera el espacio: el botón iba en un w-[140px] fijo
   * dentro de una fila del ancho completo, así que cada acción dejaba media
   * pantalla vacía a su derecha. Ahora son tarjetas en rejilla.
   *
   * El mt-auto alinea todos los botones abajo aunque las descripciones midan
   * distinto: el borde inferior de una rejilla queda recto y no dentado.
   */
  const Accion = ({
    descripcion,
    children,
  }: { descripcion: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-2 rounded-xl border border-black/8 bg-white p-3">
      <p className="text-[11px] leading-snug text-ink-2">{descripcion}</p>
      <div className="mt-auto">{children}</div>
    </div>
  )

  const Grupo = ({
    titulo,
    children,
  }: { titulo: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-2/70">
        {titulo}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
        {children}
      </div>
    </div>
  )

  const scheduleDeleteWithUndo = () => {
    // Marcar como eliminado a nivel de UI (optimista)
    setSoftDeleted(true)
    setDeletePending(true)

    const UNDO_DURATION = 7000

    // Programar eliminación real después de la ventana de deshacer
    const timeoutId = setTimeout(async () => {
      deleteTimeoutRef.current = null
      try {
        await deleteBusiness()
        toast.success("Eliminación confirmada")
      } catch (e) {
        console.error("[AdminQuickActions] Error al ejecutar eliminación final:", e)
        setSoftDeleted(false)
        toast.error(
          e instanceof Error ? e.message : "Error al completar la eliminación. El negocio sigue activo."
        )
      } finally {
        setDeletePending(false)
      }
    }, UNDO_DURATION)

    deleteTimeoutRef.current = timeoutId

    toast("Negocio eliminado", {
      description: `Tienes ${UNDO_DURATION / 1000} segundos para deshacer esta acción antes de que sea permanente.`,
      duration: UNDO_DURATION,
      action: {
        label: "Deshacer",
        onClick: () => {
          if (deleteTimeoutRef.current) {
            clearTimeout(deleteTimeoutRef.current)
            deleteTimeoutRef.current = null
          }
          setSoftDeleted(false)
          setDeletePending(false)
          toast.success("Eliminación cancelada. El negocio se ha mantenido intacto.")
        },
      },
    })
  }

  if (softDeleted) {
    // Mantener el componente montado para permitir "Deshacer" pero ocultar la tarjeta
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
        Negocio marcado para eliminación. Puedes deshacer desde la notificación durante unos segundos.
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-blue-50 flex-shrink-0">
          {business.logo_url ? (
            <Image src={business.logo_url} width={64} height={64} unoptimized alt={businessName} className="object-cover w-full h-full" />
          ) : (
            <div className="flex items-center justify-center text-blue-600 text-3xl font-bold w-full h-full">{businessName[0]?.toUpperCase() || "N"}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold truncate text-ink">{businessName}</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {banderaVigente(business.is_premium, business.premium_until) && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Premium</span>
            )}
            {business.is_verified && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Verificado</span>
            )}
            {business.hidden_at && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                Oculto del directorio
              </span>
            )}
            {inSpotlight && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Spotlight</span>
            )}
          </div>
          {business.premium_until && daysLeft !== null && (
            <p className={`text-xs mt-1 ${daysLeft <= 7 ? "text-red-600" : daysLeft <= 30 ? "text-amber-600" : "text-green-600"}`}>
              {daysLeft <= 0 ? "Expirado" : `${daysLeft} días`}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* Un solo botón: "Ficha completa" y "Editar datos" eran dos páginas
            que pintaban los mismos campos, y había que ir y volver para ver
            si un cambio había entrado. Ahora es una. */}
        <Link
          href={`/app/admin/negocios/${business.id}`}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-center text-sm font-medium transition-colors"
        >
          Ficha completa
        </Link>

        <div className="rounded-2xl border border-black/8 bg-black/[0.015] p-4 mt-1">
          <p className="text-xs font-semibold text-ink-2 uppercase tracking-wide mb-3">Acciones rápidas</p>

          {/* Agrupadas por lo que hacen. Antes eran once filas seguidas sin
              orden aparente, con "Eliminar" a la misma altura visual que
              "Ver promos". Separarlas deja el bloque irreversible al final y
              solo. */}
          <div className="flex flex-col gap-5">

            <Grupo titulo="Plan y visibilidad">
              <Accion descripcion="Cambia el nivel de acceso. Úsalo para activaciones manuales tras pagos externos.">
                <select
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-white border border-black/15 text-ink focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedTier}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === "") return
                    const tier = Number(v)
                    // Reset immediately so re-selecting the same tier fires onChange again
                    setSelectedTier("")
                    ensureUnlocked(() => tierOverride(tier))
                  }}
                  disabled={!!loading}
                  aria-label="Cambiar plan del negocio"
                >
                  <option value="">Cambiar Tier…</option>
                  {([0, 1, 2, 3] as const).map((t) => (
                    <option key={t} value={t}>{TIER_LABELS[t]}</option>
                  ))}
                </select>
              </Accion>

              <Accion descripcion="Prioriza este negocio en los algoritmos de búsqueda.">
                <button
                  type="button"
                  onClick={() => ensureUnlocked(toggleSearchPriority)}
                  disabled={!!loading}
                  className={BOTON_NEUTRO}
                >
                  {loading === "searchPriority" ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : null}
                  {loading === "searchPriority" ? "..." : hasSearchPriority ? "Quitar prioridad" : "Destacar negocio"}
                </button>
              </Accion>

              <Accion descripcion="Fuerza la aparición del negocio en el carrusel principal de la pantalla de inicio.">
                <button
                  type="button"
                  onClick={toggleSpotlight}
                  disabled={!!loading}
                  className={BOTON_NEUTRO}
                >
                  {loading === "spotlight" ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : null}
                  {loading === "spotlight" ? "..." : inSpotlight ? "Quitar Spotlight" : "Spotlight"}
                </button>
              </Accion>

              <Accion descripcion="Valida la autenticidad del negocio. Otorga el sello azul de confianza.">
                <button
                  type="button"
                  onClick={toggleVerification}
                  disabled={!!loading}
                  className={BOTON_NEUTRO}
                >
                  {loading === "verification" ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : null}
                  {loading === "verification" ? "..." : business.is_verified ? "Quitar ✓" : "Verificado"}
                </button>
              </Accion>

              <Accion descripcion="Gestiona sellos de confianza y etiquetas especiales de la comunidad.">
                <button
                  type="button"
                  onClick={() => {
                    // reset selection on open
                    setSelectedBadges([])
                    setShowBadgesModal(true)
                  }}
                  disabled={!!loading}
                  className={BOTON_NEUTRO}
                >
                  Gestionar badges
                </button>
              </Accion>
            </Grupo>

            <Grupo titulo="Contenido del negocio">
              <Accion descripcion="Administra, corrige o elimina las ofertas publicadas por este local.">
                <Link
                  href={`/app/dashboard/negocios/${business.id}/promociones`}
                  className={BOTON_NEUTRO}
                >
                  Ver promos
                </Link>
              </Accion>

              <Accion descripcion="Elimina TODO el contenido visual del negocio por infracciones de calidad.">
                <button
                  type="button"
                  onClick={() => setShowResetPhotosModal(true)}
                  disabled={!!loading}
                  className={BOTON_PELIGRO}
                >
                  Reset fotos
                </button>
              </Accion>
            </Grupo>

            {/* Las dos acciones de este grupo tocan la CUENTA, no el negocio,
                así que sólo existen si la ficha tiene dueño. */}
            {business.owner_id && (
              <Grupo titulo="La cuenta del dueño">
                <Accion descripcion="Panel modular: plan de membresía, alertas, fotos y eliminación de cuenta.">
                  <button
                    type="button"
                    onClick={() => setShowLimitsModal(true)}
                    disabled={!!loading}
                    className={BOTON_NEUTRO}
                  >
                    Gestionar Usuario
                  </button>
                </Accion>

                <Accion descripcion="Suspende la CUENTA del dueño, no el negocio. Para reseñas abusivas o spam: la cuenta sigue existiendo y se reactiva desde Personas → Usuarios, donde además se ve su estado actual.">
                  <SuspendUserButton
                    profileId={business.owner_id}
                    profileName={businessName}
                    suspendido={false}
                    aLoAncho
                  />
                </Accion>
              </Grupo>
            )}

            <Grupo titulo="Retirar del directorio">
              <Accion descripcion="Lo saca del directorio sin borrar nada: reseñas, chat, fotos e historial quedan intactos y se puede revertir. El dueño sigue viendo su ficha con el motivo, para poder corregir. Para estafas, negocios cerrados o contenido que viola las reglas — antes de llegar a Eliminar.">
                <HideBusinessButton
                  businessId={business.id}
                  businessName={businessName}
                  oculto={Boolean(business.hidden_at)}
                />
              </Accion>

              <Accion descripcion="Borra permanentemente el registro. Acción irreversible.">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={!!loading}
                  className={BOTON_PELIGRO}
                >
                  Eliminar
                </button>
              </Accion>
            </Grupo>

          </div>
          {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
        </div>
      </div>

      <ConfirmationModal
        open={showDeleteModal}
        title="¿Eliminar este negocio permanentemente?"
        description={`Esta acción no se puede deshacer una vez pase el tiempo de recuperación. Se borrarán todas las fotos, estadísticas, promociones y la configuración de "${businessName}". El dueño perderá el acceso inmediatamente.`}
        confirmLabel="Sí, eliminar definitivamente"
        cancelLabel="No, mantener negocio"
        loading={deletePending || loading === "delete"}
        onClose={() => {
          if (deletePending || loading === "delete") return
          setShowDeleteModal(false)
        }}
        onConfirm={() => {
          if (deletePending || loading === "delete") return
          setShowDeleteModal(false)
          scheduleDeleteWithUndo()
        }}
      />

      {business.owner_id && showLimitsModal && (
        <AdminUserManagementModal
          isOpen={showLimitsModal}
          onClose={() => setShowLimitsModal(false)}
          onSuccess={refresh}
          profileId={business.owner_id}
          profileName="Propietario"
          businessId={business.id}
          businessName={businessName}
          onEnsureUnlocked={ensureUnlocked}
        />
      )}

      {showAlertModal && business.owner_id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white border border-blue-200 shadow-xl rounded-2xl p-6 max-w-md w-full">
            <h4 className="text-lg font-bold text-ink mb-1">Enviar Alerta al usuario</h4>
            <p className="text-xs text-ink-2 mb-3">El mensaje se mostrará en un pop-up al iniciar sesión.</p>
            <textarea
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              placeholder="Escribe el mensaje (infracciones, mantenimiento, promociones…)"
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white border border-black/15 text-ink placeholder-ink-2/50 text-sm resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => { setShowAlertModal(false); setAlertMessage("") }}
                className="flex-1 py-2.5 rounded-xl bg-black/5 text-ink text-sm font-medium hover:bg-black/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={sendAlert}
                disabled={sendingAlert || !alertMessage.trim()}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {sendingAlert ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetPhotosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => { setShowResetPhotosModal(false); setResetPhotosConfirmStep(1) }}>
          <div className="bg-white border border-black/10 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-bold text-ink mb-2">
              {resetPhotosConfirmStep === 1 ? "Restablecer fotos" : "Última confirmación"}
            </h4>
            {resetPhotosConfirmStep === 1 ? (
              <>
                <p className="text-sm text-ink-2 mb-4">¿Vaciar galería y opcionalmente logo de &quot;{businessName}&quot;?</p>
                <div className="flex flex-col gap-2 mb-4">
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input type="checkbox" id="resetLogo" defaultChecked={false} />
                    Incluir logo
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowResetPhotosModal(false); setResetPhotosConfirmStep(1) }}
                    className="flex-1 py-2 rounded-xl bg-black/5 text-ink text-sm font-medium hover:bg-black/10"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetLogoChoice((document.getElementById("resetLogo") as HTMLInputElement)?.checked ?? false)
                      setResetPhotosConfirmStep(2)
                    }}
                    className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600"
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-2 mb-4">¿Estás seguro? Se eliminará todo el contenido visual del negocio.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowResetPhotosModal(false); setResetPhotosConfirmStep(1) }}
                    className="flex-1 py-2 rounded-xl bg-black/5 text-ink text-sm font-medium hover:bg-black/10"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetPhotosModal(false)
                      setResetPhotosConfirmStep(1)
                      resetPhotos(resetLogoChoice)
                    }}
                    disabled={!!loading}
                    className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading === "reset" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Sí, restablecer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => { if (!pinLoading) { setShowPinModal(false); setPin(""); setPendingAction(null) } }}>
          <div
            className="bg-white border border-black/10 rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-ink">Acción Crítica</h4>
                <p className="text-xs text-ink-2">
                  Ingrese su PIN Maestro para autorizar este cambio.
                </p>
              </div>
            </div>
            <div className="mt-3 mb-4">
              <label className="block text-xs font-medium text-ink-2 mb-1">
                PIN Maestro (6 dígitos)
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pinLoading}
                onClick={() => { if (!pinLoading) { setShowPinModal(false); setPin(""); setPendingAction(null) } }}
                className="flex-1 py-2 rounded-xl bg-black/5 text-ink text-sm font-medium hover:bg-black/10 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pinLoading || pin.length !== 6}
                onClick={async () => {
                  if (pin.length !== 6) return
                  setPinLoading(true)
                  try {
                    const res = await fetch("/api/admin/security/pin", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ pin }),
                    })
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok || !data.success) {
                      toast.error("Acceso denegado", {
                        description: data.error || "PIN maestro inválido.",
                      })
                      return
                    }
                    toast.success("Autorización exitosa", {
                      description: "PIN maestro verificado por 5 minutos.",
                    })
                    setIsActionUnlocked(true)
                    setShowPinModal(false)
                    setPin("")
                    // Auto-bloquear después de 5 minutos
                    setTimeout(() => {
                      setIsActionUnlocked(false)
                    }, 5 * 60 * 1000)
                    if (pendingAction) {
                      const action = pendingAction
                      setPendingAction(null)
                      action()
                    }
                  } catch {
                    toast.error("Acceso denegado", {
                      description: "No se pudo verificar el PIN. Intenta nuevamente.",
                    })
                  } finally {
                    setPinLoading(false)
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {pinLoading ? "Verificando..." : "Autorizar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showBadgesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowBadgesModal(false)}>
          <div
            className="bg-white border border-green-200 rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-bold text-ink mb-2">Gestor de Badges</h4>
            <p className="text-xs text-ink-2 mb-4">
              Selecciona las etiquetas especiales que quieres aplicar a este negocio.
            </p>
            <div className="space-y-2 mb-4">
              {["Verificado", "Pet Friendly", "Oferta", "Nuevo"].map((label) => {
                const checked = selectedBadges.includes(label)
                return (
                  <label key={label} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedBadges((prev) =>
                          checked ? prev.filter((b) => b !== label) : [...prev, label]
                        )
                      }}
                    />
                    {label}
                  </label>
                )
              })}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowBadgesModal(false)}
                className="flex-1 py-2 rounded-xl bg-black/5 text-ink text-sm font-medium hover:bg-black/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={badgesLoading}
                onClick={async () => {
                  const execute = async () => {
                    try {
                      setBadgesLoading(true)
                      const res = await fetch("/api/admin/business/badges", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ businessId: business.id, badges: selectedBadges }),
                      })
                      const data = await res.json()
                      if (!res.ok || !data.success) {
                        toast.error(
                          data.error ||
                            "Error: No se pudo actualizar los badges. Revisa que la columna badges exista en businesses."
                        )
                      } else {
                        toast.success("¡Acción exitosa!: Badges")
                        setShowBadgesModal(false)
                        refresh()
                      }
                    } catch {
                      toast.error("Error: No se pudo completar la acción. Inténtalo de nuevo.")
                    } finally {
                      setBadgesLoading(false)
                    }
                  }
                  ensureUnlocked(execute)
                }}
                className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {badgesLoading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
