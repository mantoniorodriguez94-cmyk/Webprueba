"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Info, Loader2, Shield } from "lucide-react"
import { toast } from "sonner"
import VerifyPremiumModal from "./VerifyPremiumModal"
import UpdatePhotosLimitModal from "./UpdatePhotosLimitModal"
import ManageLimitsModal from "./ManageLimitsModal"

export type AdminBusinessRow = {
  id: string
  name: string | null
  logo_url: string | null
  is_premium: boolean
  premium_until: string | null
  created_at?: string
  is_verified?: boolean
  max_photos?: number
  owner_id?: string | null
  is_featured?: boolean
  featured_until?: string | null
  has_gold_border?: boolean
  search_priority_boost?: boolean
  chat_enabled?: boolean
  badges?: string[]
}

const TIER_LABELS: Record<number, string> = {
  0: "Básico",
  1: "Conecta",
  2: "Destaca",
  3: "Fundador",
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
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [showPhotosModal, setShowPhotosModal] = useState(false)
  const [showFeaturedModal, setShowFeaturedModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(1)
  const [showResetPhotosModal, setShowResetPhotosModal] = useState(false)
  const [resetPhotosConfirmStep, setResetPhotosConfirmStep] = useState(1)
  const [resetLogoChoice, setResetLogoChoice] = useState(false)
  const [showLimitsModal, setShowLimitsModal] = useState(false)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [sendingAlert, setSendingAlert] = useState(false)
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null)
  const [chatEnabled, setChatEnabled] = useState(business.chat_enabled === true)
  const [showBadgesModal, setShowBadgesModal] = useState(false)
  const [badgesLoading, setBadgesLoading] = useState(false)
  const [selectedBadges, setSelectedBadges] = useState<string[]>([])
  const [isActionUnlocked, setIsActionUnlocked] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pin, setPin] = useState("")
  const [pinLoading, setPinLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  useEffect(() => {
    if (openTooltipId === null) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      const trigger = target.closest?.("[data-tooltip-trigger]")
      const popover = target.closest?.("[data-tooltip-popover]")
      if (trigger || popover) return
      setOpenTooltipId(null)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openTooltipId])

  const refresh = () => {
    onActionSuccess?.()
    router.refresh()
  }

  const ACTION_LABELS: Record<string, string> = {
    verification: "Verificación",
    tier: "Tier",
    spotlight: "Spotlight",
    suspender: "Suspensión",
    delete: "Eliminación",
    reset: "Reset de fotos",
    golden: "Borde dorado",
    searchBoost: "Destacar negocio",
    chat: "Sistema de chat",
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
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error")
      const label = actionLabel ?? ACTION_LABELS[action] ?? "Acción"
      toast.success(`¡Acción exitosa!: ${label}`)
      refresh()
    } catch (_e: unknown) {
      setError("No se pudo completar la acción.")
      toast.error("Error: No se pudo completar la acción. Inténtalo de nuevo.")
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
  const suspendPremium = () => call("suspender", { businessId: business.id }, "/api/admin/business/suspender")
  const deleteBusiness = () => call("delete", { businessId: business.id }, "/api/admin/business/delete", "Eliminación")
  const resetPhotos = (resetLogo: boolean) => call("reset", { businessId: business.id, resetLogo }, "/api/admin/business/reset-photos", "Reset de fotos")

  const toggleGoldenBorder = () =>
    call("golden", { businessId: business.id }, "/api/admin/business/toggle-golden-border", "Borde dorado")

  const toggleSearchPriority = () =>
    call(
      "searchPriority",
      { businessId: business.id },
      "/api/admin/business/toggle-search-priority",
      "Destacar negocio"
    )

  const toggleChat = () => {
    const next = !chatEnabled
    setChatEnabled(next)
    return call("chat", { businessId: business.id, enabled: next }, "/api/admin/business/toggle-chat", "Sistema de chat")
  }

  const inSpotlight = business.is_featured && business.featured_until && new Date(business.featured_until) > new Date()
  const hasGoldenBorder = business.has_gold_border === true
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

  const ActionRow = ({
    id,
    button,
    description,
  }: { id: string; button: React.ReactNode; description: string }) => {
    const isOpen = openTooltipId === id
    const safeDescription = description ?? ""
    return (
      <div className="flex items-center gap-2 py-3 first:pt-0 border-b border-white/10 last:border-b-0">
        <div className="flex-shrink-0 w-[140px] sm:w-[160px]">{button}</div>
        <div className="relative flex-shrink-0 pt-0.5">
          <button
            type="button"
            data-tooltip-trigger
            aria-label="Ver descripción"
            onClick={() => setOpenTooltipId(isOpen ? null : id)}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <Info className="w-4 h-4" aria-hidden />
          </button>
          {isOpen && (
            <div
              key={`tooltip-${id}`}
              data-tooltip-popover
              className="animate-fade-in absolute left-0 top-full mt-1 z-50 min-w-[200px] max-w-[280px] rounded-lg bg-gray-900 border border-white/20 p-3 shadow-xl text-xs text-white leading-relaxed"
              role="tooltip"
            >
              {safeDescription}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0">
          {business.logo_url ? (
            <Image src={business.logo_url} width={64} height={64} unoptimized alt={businessName} className="object-cover w-full h-full" />
          ) : (
            <div className="flex items-center justify-center text-blue-400 text-3xl font-bold w-full h-full">{businessName[0]?.toUpperCase() || "N"}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold truncate">{businessName}</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {business.is_premium && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">Premium</span>
            )}
            {business.is_verified && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/40">Verificado</span>
            )}
            {inSpotlight && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">Spotlight</span>
            )}
          </div>
          {business.premium_until && daysLeft !== null && (
            <p className={`text-xs mt-1 ${daysLeft <= 7 ? "text-red-400" : daysLeft <= 30 ? "text-yellow-400" : "text-green-400"}`}>
              {daysLeft <= 0 ? "Expirado" : `${daysLeft} días`}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href={`/app/admin/negocios/${business.id}/gestionar`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-center text-sm font-medium transition-colors"
        >
          Gestionar
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mt-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Acciones rápidas</p>
          <p className="text-[11px] text-gray-500 mb-3">Haz clic en el icono (i) para ver la guía de cada acción.</p>
          <div className="space-y-0">
            <ActionRow
              id="verificar"
              button={
                <button
                  type="button"
                  onClick={toggleVerification}
                  disabled={!!loading}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading === "verification" ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : null}
                  {loading === "verification" ? "..." : business.is_verified ? "Quitar ✓" : "Verificado"}
                </button>
              }
              description="Valida la autenticidad del negocio. Otorga el sello azul de confianza."
            />
            <ActionRow
              id="tier"
              button={
                <select
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue=""
                  onChange={(e) => {
                    const v = e.target.value
                    if (v !== "") {
                      const tier = Number(v)
                      ensureUnlocked(() => tierOverride(tier))
                    }
                  }}
                  disabled={!!loading}
                >
                  <option value="">Tier</option>
                  {([0, 1, 2, 3] as const).map((t) => (
                    <option key={t} value={t}>{TIER_LABELS[t]}</option>
                  ))}
                </select>
              }
              description="Cambia el nivel de acceso. Úsalo para activaciones manuales tras pagos externos."
            />
            <ActionRow
              id="golden-border"
              button={
                <button
                  type="button"
                  onClick={() => ensureUnlocked(toggleGoldenBorder)}
                  disabled={!!loading}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-yellow-500/15 text-yellow-200 border border-yellow-500/40 hover:bg-yellow-500/25 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading === "golden" ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : null}
                  {loading === "golden" ? "..." : hasGoldenBorder ? "Quitar Borde Dorado" : "Borde Dorado"}
                </button>
              }
              description="Activa el aura visual de Plan Fundador independientemente del pago."
            />
            <ActionRow
              id="spotlight"
              button={
                <button
                  type="button"
                  onClick={toggleSpotlight}
                  disabled={!!loading}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading === "spotlight" ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : null}
                  {loading === "spotlight" ? "..." : inSpotlight ? "Quitar Spotlight" : "Spotlight"}
                </button>
              }
              description="Fuerza la aparición del negocio en el carrusel principal de la pantalla de inicio."
            />
            <ActionRow
              id="premium"
              button={
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(true)}
                  disabled={!!loading || business.is_premium}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 disabled:opacity-50"
                >
                  {business.is_premium ? "✓ Premium" : "Activar Premium"}
                </button>
              }
              description="Habilita funciones de pago. Úsalo para activaciones manuales tras pago externo."
            />
            <ActionRow
              id="suspender"
              button={
                <button
                  type="button"
                  onClick={suspendPremium}
                  disabled={!!loading || !business.is_premium}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/40 hover:bg-gray-500/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading === "suspender" ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : null}
                  {loading === "suspender" ? "..." : "Suspender"}
                </button>
              }
              description="Oculta el negocio de la vista pública sin borrar datos. Medida preventiva."
            />
            <ActionRow
              id="fotos"
              button={
                <button
                  type="button"
                  onClick={() => setShowPhotosModal(true)}
                  disabled={!!loading}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-500/20 text-slate-300 border border-slate-500/40 hover:bg-slate-500/30 disabled:opacity-50"
                >
                  Fotos ({business.max_photos ?? 5})
                </button>
              }
              description="Incrementa el límite de carga de imágenes en 10 unidades como bono especial."
            />
            <ActionRow
              id="destacar"
              button={
                <button
                  type="button"
                  onClick={() => ensureUnlocked(toggleSearchPriority)}
                  disabled={!!loading}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading === "searchPriority" ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : null}
                  {loading === "searchPriority" ? "..." : hasSearchPriority ? "Quitar prioridad" : "Destacar negocio"}
                </button>
              }
              description="Prioriza este negocio en los algoritmos de búsqueda."
            />
            <ActionRow
              id="chat"
              button={
                <button
                  type="button"
                  onClick={() => ensureUnlocked(toggleChat)}
                  disabled={!!loading}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-teal-500/20 text-teal-200 border border-teal-500/40 hover:bg-teal-500/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading === "chat" ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : null}
                  {loading === "chat" ? "..." : chatEnabled ? "Chat activo" : "Habilitar chat"}
                </button>
              }
              description="Controla si el dueño puede recibir mensajes directos de usuarios."
            />
            <ActionRow
              id="promos"
              button={
                <Link
                  href={`/app/dashboard/negocios/${business.id}/promociones`}
                  className="w-full inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-medium bg-pink-500/20 text-pink-200 border border-pink-500/40 hover:bg-pink-500/30 disabled:opacity-50"
                >
                  Ver promos
                </Link>
              }
              description="Administra, corrige o elimina las ofertas publicadas por este local."
            />
            <ActionRow
              id="reset-fotos"
              button={
                <button
                  type="button"
                  onClick={() => setShowResetPhotosModal(true)}
                  disabled={!!loading}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/40 hover:bg-orange-500/30 disabled:opacity-50"
                >
                  Reset fotos
                </button>
              }
              description="Elimina TODO el contenido visual del negocio por infracciones de calidad."
            />
            {business.owner_id && (
              <ActionRow
                id="limites"
                button={
                  <button
                    type="button"
                    onClick={() => setShowLimitsModal(true)}
                    disabled={!!loading}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 disabled:opacity-50"
                  >
                    Límites y tier
                  </button>
                }
                description="Ajusta el cupo máximo de negocios y el nivel de membresía global del usuario."
              />
            )}
            {business.owner_id && (
              <ActionRow
                id="alerta"
                button={
                  <button
                    type="button"
                    onClick={() => setShowAlertModal(true)}
                    disabled={!!loading}
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 disabled:opacity-50"
                  >
                    Enviar Alerta
                  </button>
                }
                description="Envía un mensaje emergente directo a la pantalla del usuario para notificaciones críticas."
              />
            )}
            <ActionRow
              id="badges"
              button={
                <button
                  type="button"
                  onClick={() => {
                    // reset selection on open
                    setSelectedBadges([])
                    setShowBadgesModal(true)
                  }}
                  disabled={!!loading}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  Gestionar badges
                </button>
              }
              description="Gestiona sellos de confianza y etiquetas especiales de la comunidad."
            />
            <ActionRow
              id="eliminar"
              button={
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={!!loading}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 disabled:opacity-50"
                >
                  Eliminar
                </button>
              }
              description="Borra permanentemente el registro. Acción irreversible."
            />
          </div>
          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
        </div>
      </div>

      {showVerifyModal && (
        <VerifyPremiumModal
          businessId={business.id}
          businessName={businessName}
          isOpen={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          onSuccess={() => { setShowVerifyModal(false); refresh() }}
        />
      )}
      {showPhotosModal && (
        <UpdatePhotosLimitModal
          businessId={business.id}
          businessName={businessName}
          currentLimit={business.max_photos ?? 5}
          isOpen={showPhotosModal}
          onClose={() => setShowPhotosModal(false)}
          onSuccess={() => { setShowPhotosModal(false); refresh() }}
        />
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => { setShowDeleteModal(false); setDeleteConfirmStep(1) }}>
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-bold text-white mb-2">
              {deleteConfirmStep === 1 ? "Eliminar negocio" : "Última confirmación"}
            </h4>
            {deleteConfirmStep === 1 ? (
              <>
                <p className="text-sm text-gray-400 mb-4">¿Eliminar &quot;{businessName}&quot;? Esta acción no se puede deshacer.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowDeleteModal(false); setDeleteConfirmStep(1) }}
                    className="flex-1 py-2 rounded-xl bg-white/10 text-white text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmStep(2)}
                    className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-4">¿Estás seguro? El negocio se borrará permanentemente.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowDeleteModal(false); setDeleteConfirmStep(1) }}
                    className="flex-1 py-2 rounded-xl bg-white/10 text-white text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false)
                      setDeleteConfirmStep(1)
                      deleteBusiness()
                    }}
                    disabled={!!loading}
                    className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Sí, eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {business.owner_id && showLimitsModal && (
        <ManageLimitsModal
          isOpen={showLimitsModal}
          onClose={() => setShowLimitsModal(false)}
          onSuccess={refresh}
          profileId={business.owner_id}
          profileName="Propietario"
          businessId={business.id}
          businessName={businessName}
        />
      )}

      {showAlertModal && business.owner_id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-6 max-w-md w-full">
            <h4 className="text-lg font-bold text-white mb-1">Enviar Alerta al usuario</h4>
            <p className="text-xs text-gray-400 mb-3">El mensaje se mostrará en un pop-up al iniciar sesión.</p>
            <textarea
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              placeholder="Escribe el mensaje (infracciones, mantenimiento, promociones…)"
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => { setShowAlertModal(false); setAlertMessage("") }}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={sendAlert}
                disabled={sendingAlert || !alertMessage.trim()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {sendingAlert ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetPhotosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => { setShowResetPhotosModal(false); setResetPhotosConfirmStep(1) }}>
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-bold text-white mb-2">
              {resetPhotosConfirmStep === 1 ? "Restablecer fotos" : "Última confirmación"}
            </h4>
            {resetPhotosConfirmStep === 1 ? (
              <>
                <p className="text-sm text-gray-400 mb-4">¿Vaciar galería y opcionalmente logo de &quot;{businessName}&quot;?</p>
                <div className="flex flex-col gap-2 mb-4">
                  <label className="flex items-center gap-2 text-sm text-white">
                    <input type="checkbox" id="resetLogo" defaultChecked={false} />
                    Incluir logo
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowResetPhotosModal(false); setResetPhotosConfirmStep(1) }}
                    className="flex-1 py-2 rounded-xl bg-white/10 text-white text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetLogoChoice((document.getElementById("resetLogo") as HTMLInputElement)?.checked ?? false)
                      setResetPhotosConfirmStep(2)
                    }}
                    className="flex-1 py-2 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700"
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-4">¿Estás seguro? Se eliminará todo el contenido visual del negocio.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowResetPhotosModal(false); setResetPhotosConfirmStep(1) }}
                    className="flex-1 py-2 rounded-xl bg-white/10 text-white text-sm font-medium"
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
                    className="flex-1 py-2 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
            className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-2xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Acción Crítica</h4>
                <p className="text-xs text-gray-400">
                  Ingrese su PIN Maestro para autorizar este cambio.
                </p>
              </div>
            </div>
            <div className="mt-3 mb-4">
              <label className="block text-xs font-medium text-gray-300 mb-1">
                PIN Maestro (6 dígitos)
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pinLoading}
                onClick={() => { if (!pinLoading) { setShowPinModal(false); setPin(""); setPendingAction(null) } }}
                className="flex-1 py-2 rounded-xl bg-white/10 text-white text-sm font-medium disabled:opacity-50"
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
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
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
            className="bg-gray-900 border border-emerald-500/40 rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-bold text-white mb-2">Gestor de Badges</h4>
            <p className="text-xs text-gray-400 mb-4">
              Selecciona las etiquetas especiales que quieres aplicar a este negocio.
            </p>
            <div className="space-y-2 mb-4">
              {["Verificado", "Pet Friendly", "Oferta", "Nuevo"].map((label) => {
                const checked = selectedBadges.includes(label)
                return (
                  <label key={label} className="flex items-center gap-2 text-sm text-white">
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
                className="flex-1 py-2 rounded-xl bg-white/10 text-white text-sm font-medium"
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
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
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
