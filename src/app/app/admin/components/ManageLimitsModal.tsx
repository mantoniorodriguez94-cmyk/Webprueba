"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

const TIER_LABELS: Record<number, string> = { 0: "Básico", 1: "Conecta", 2: "Destaca", 3: "Fundador" }

type Props = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  profileId: string
  profileName?: string
  businessId?: string
  businessName?: string
}

export default function ManageLimitsModal({
  isOpen,
  onClose,
  onSuccess,
  profileId,
  profileName = "Usuario",
  businessId,
  businessName,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [tier, setTier] = useState(0)
  const [extraBusinessLimit, setExtraBusinessLimit] = useState(0)
  const [extraPhotoLimit, setExtraPhotoLimit] = useState(0)
  const [searchPriorityBoost, setSearchPriorityBoost] = useState(false)
  const [infractionStatus, setInfractionStatus] = useState(false)
  const [infractionReason, setInfractionReason] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")

  useEffect(() => {
    if (!isOpen || !profileId) return
    setLoadingData(true)
    const load = async () => {
      try {
        const [profileRes, businessRes] = await Promise.all([
          fetch(`/api/admin/profile-data?profileId=${encodeURIComponent(profileId)}`),
          businessId ? fetch(`/api/admin/business-data?businessId=${encodeURIComponent(businessId)}`) : null,
        ])
        const profileData = await profileRes.json()
        if (profileData.success && profileData.data) {
          setTier(profileData.data.subscription_tier ?? 0)
          setExtraBusinessLimit(profileData.data.extra_business_limit ?? 0)
        }
        if (businessId && businessRes) {
          const businessData = await businessRes.json()
          if (businessData.success && businessData.data) {
            setExtraPhotoLimit(businessData.data.extra_photo_limit ?? 0)
            setSearchPriorityBoost(businessData.data.search_priority_boost ?? false)
            setInfractionStatus(businessData.data.infraction_status ?? false)
            setInfractionReason(businessData.data.infraction_reason ?? "")
          }
        }
      } catch {
        toast.error("Error al cargar datos")
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [isOpen, profileId, businessId])

  const saveLimits = async () => {
    setLoading(true)
    try {
      const resProfile = await fetch("/api/admin/profile-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          subscription_tier: tier,
          extra_business_limit: Math.max(0, extraBusinessLimit),
        }),
      })
      const dataProfile = await resProfile.json()
      if (!resProfile.ok) {
        toast.error(dataProfile.error || "Error al actualizar perfil")
        setLoading(false)
        return
      }

      if (businessId) {
        const resBiz = await fetch("/api/admin/business-override", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId,
            extra_photo_limit: Math.max(0, extraPhotoLimit),
            search_priority_boost: searchPriorityBoost,
            infraction_status: infractionStatus,
            infraction_reason: infractionStatus ? infractionReason.trim() || null : null,
          }),
        })
        const dataBiz = await resBiz.json()
        if (!resBiz.ok) {
          toast.error(dataBiz.error || "Error al actualizar negocio")
          setLoading(false)
          return
        }
      }

      if (notificationMessage.trim()) {
        const resNotif = await fetch("/api/admin/profile-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId,
            admin_message: notificationMessage.trim(),
          }),
        })
        const dataNotif = await resNotif.json()
        if (!resNotif.ok) {
          toast.error(dataNotif.error || "Error al enviar notificación")
        } else {
          toast.success("Notificación enviada")
        }
      }

      toast.success("Límites y tier actualizados")
      onSuccess?.()
      onClose()
    } catch (e) {
      toast.error((e as Error).message || "Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-gray-900 border border-white/20 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-1">Gestionar límites y tier</h3>
          <p className="text-sm text-gray-400 mb-4">{profileName}{businessName ? ` · ${businessName}` : ""}</p>

          {loadingData ? (
            <div className="py-8 text-center text-gray-400">Cargando...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tier de suscripción</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white"
                >
                  {([0, 1, 2, 3] as const).map((t) => (
                    <option key={t} value={t}>{TIER_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Límite extra de negocios</label>
                <input
                  type="number"
                  min={0}
                  value={extraBusinessLimit}
                  onChange={(e) => setExtraBusinessLimit(Number(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white"
                />
              </div>

              {businessId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Fotos extra permitidas</label>
                    <input
                      type="number"
                      min={0}
                      value={extraPhotoLimit}
                      onChange={(e) => setExtraPhotoLimit(Number(e.target.value) || 0)}
                      className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="searchBoost"
                      checked={searchPriorityBoost}
                      onChange={(e) => setSearchPriorityBoost(e.target.checked)}
                      className="rounded border-white/20"
                    />
                    <label htmlFor="searchBoost" className="text-sm text-gray-300">Prioridad en búsqueda (arriba)</label>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="infraction"
                        checked={infractionStatus}
                        onChange={(e) => setInfractionStatus(e.target.checked)}
                        className="rounded border-white/20"
                      />
                      <label htmlFor="infraction" className="text-sm font-medium text-amber-300">Marcar infracción</label>
                    </div>
                    {infractionStatus && (
                      <textarea
                        placeholder="Motivo (visible para el dueño)"
                        value={infractionReason}
                        onChange={(e) => setInfractionReason(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm"
                      />
                    )}
                  </div>
                </>
              )}

              <div className="border-t border-white/10 pt-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Notificación directa al usuario</label>
                <textarea
                  placeholder="Mensaje que verá en un modal al iniciar sesión (opcional)"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveLimits}
              disabled={loading || loadingData}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
