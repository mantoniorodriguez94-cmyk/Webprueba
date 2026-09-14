"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import ConfirmationModal from "@/components/ui/ConfirmationModal"
import { PERKS_CONCEDIBLES, perkVigente } from "@/lib/memberships/perks"

const TIER_LABELS: Record<number, string> = { 0: "Básico", 1: "Conecta", 2: "Destaca", 3: "Patrocina" }

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
  const [searchPriorityBoost, setSearchPriorityBoost] = useState(false)
  const [infractionStatus, setInfractionStatus] = useState(false)
  const [infractionReason, setInfractionReason] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  /* Beneficios sueltos. Se piden en MESES y no como fecha porque así es como
     se concede en la práctica ("dale tres meses"), y evita que la fecha
     dependa del reloj del navegador: el servidor la calcula.

     Los campos arrancan vacíos, no en 0. Es la diferencia entre "no toques
     esto" y "quítaselo": si arrancaran en 0, abrir el modal para cambiar el
     tier y guardar le retiraría al negocio todos los beneficios sin que nadie
     lo pidiera. `vigenteHasta` guarda lo que ya tiene, sólo para mostrarlo. */
  const [bordeDoradoMeses, setBordeDoradoMeses] = useState("")
  const [promocionesMeses, setPromocionesMeses] = useState("")
  const [prioridadMeses, setPrioridadMeses] = useState("")
  const [fotosExtra, setFotosExtra] = useState("")
  const [fotosExtraMeses, setFotosExtraMeses] = useState("")
  const [vigenteHasta, setVigenteHasta] = useState<Record<string, string | null>>({})

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
        }
        if (businessId && businessRes) {
          const businessData = await businessRes.json()
          if (businessData.success && businessData.data) {
            setSearchPriorityBoost(businessData.data.search_priority_boost ?? false)
            setInfractionStatus(businessData.data.infraction_status ?? false)
            setInfractionReason(businessData.data.infraction_reason ?? "")
            setVigenteHasta({
              borde_dorado: businessData.data.perk_borde_dorado_hasta ?? null,
              promociones: businessData.data.perk_promociones_hasta ?? null,
              prioridad: businessData.data.perk_prioridad_hasta ?? null,
              fotos_extra: businessData.data.perk_fotos_extra_hasta ?? null,
            })
            setFotosExtra(String(businessData.data.perk_fotos_extra ?? 0))
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

        // Sólo se manda lo que el admin escribió. Un campo vacío no viaja, y
        // la ruta deja ese beneficio como estaba.
        const perks: Record<string, number> = {}
        if (bordeDoradoMeses.trim() !== "") perks.bordeDoradoMeses = Number(bordeDoradoMeses)
        if (promocionesMeses.trim() !== "") perks.promocionesMeses = Number(promocionesMeses)
        if (prioridadMeses.trim() !== "") perks.prioridadMeses = Number(prioridadMeses)
        if (fotosExtraMeses.trim() !== "") {
          perks.fotosExtraMeses = Number(fotosExtraMeses)
          perks.fotosExtra = Number(fotosExtra) || 0
        }

        if (Object.keys(perks).length > 0) {
          const resPerks = await fetch("/api/admin/business/perks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId, ...perks }),
          })
          const dataPerks = await resPerks.json()
          if (!resPerks.ok) {
            toast.error(dataPerks.error || "Error al conceder beneficios")
            setLoading(false)
            return
          }
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

  const handleResetUser = async () => {
    setResetLoading(true)
    try {
      const res = await fetch("/api/admin/profile-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error("[ManageLimitsModal] Error en reset total:", data)
        toast.error(data.error || "Error al resetear usuario a plan gratuito")
        return
      }
      toast.success("Usuario reseteado a Plan Gratis con éxito")
      onSuccess?.()
      onClose()
    } catch (e) {
      console.error("[ManageLimitsModal] Error inesperado en reset total:", e)
      toast.error((e as Error).message || "Error al resetear usuario")
    } finally {
      setResetLoading(false)
      setShowResetModal(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <div className="bg-white border border-black/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-6">
            <h3 className="text-xl font-bold text-ink mb-1">Gestionar límites y tier</h3>
            <p className="text-sm text-ink-2 mb-4">
              {profileName}
              {businessName ? ` · ${businessName}` : ""}
            </p>

            {loadingData ? (
              <div className="py-8 text-center text-ink-2">Cargando...</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1">Tier de suscripción</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl bg-white border border-black/15 text-ink"
                  >
                    {([0, 1, 2, 3] as const).map((t) => (
                      <option key={t} value={t}>
                        {TIER_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                {businessId && (
                  <>
                    <div className="rounded-xl border border-black/10 p-3 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-ink">Beneficios sueltos</p>
                        <p className="text-[11px] text-ink-2">
                          Se suman a lo que da su plan. Escribe los meses y deja en
                          blanco lo que no quieras cambiar; 0 lo retira.
                        </p>
                      </div>

                      {PERKS_CONCEDIBLES.map((perk) => {
                        const valor =
                          perk.clave === "borde_dorado" ? bordeDoradoMeses
                          : perk.clave === "promociones" ? promocionesMeses
                          : perk.clave === "prioridad" ? prioridadMeses
                          : fotosExtraMeses
                        const setValor =
                          perk.clave === "borde_dorado" ? setBordeDoradoMeses
                          : perk.clave === "promociones" ? setPromocionesMeses
                          : perk.clave === "prioridad" ? setPrioridadMeses
                          : setFotosExtraMeses
                        const hasta = vigenteHasta[perk.clave]

                        return (
                          <div key={perk.clave} className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <label className="block text-xs font-medium text-ink truncate">
                                {perk.etiqueta}
                              </label>
                              <p className="text-[10px] text-ink-2">
                                {perkVigente(hasta)
                                  ? `Vigente hasta ${new Date(hasta as string).toLocaleDateString()}`
                                  : "Sin conceder"}
                              </p>
                            </div>
                            {perk.clave === "fotos_extra" && (
                              <input
                                type="number"
                                min={0}
                                max={50}
                                value={fotosExtra}
                                onChange={(e) => setFotosExtra(e.target.value)}
                                aria-label="Cuántas fotos extra"
                                className="w-16 px-2 py-1.5 rounded-lg bg-white border border-black/15 text-ink text-sm"
                                placeholder="nº"
                              />
                            )}
                            <input
                              type="number"
                              min={0}
                              max={120}
                              value={valor}
                              onChange={(e) => setValor(e.target.value)}
                              aria-label={`Meses de ${perk.etiqueta}`}
                              className="w-20 px-2 py-1.5 rounded-lg bg-white border border-black/15 text-ink text-sm"
                              placeholder="meses"
                            />
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="searchBoost"
                        checked={searchPriorityBoost}
                        onChange={(e) => setSearchPriorityBoost(e.target.checked)}
                        className="rounded border-black/20"
                      />
                      <label htmlFor="searchBoost" className="text-sm text-ink-2">
                        Prioridad en búsqueda (arriba)
                      </label>
                    </div>
                    <div className="border-t border-black/8 pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          id="infraction"
                          checked={infractionStatus}
                          onChange={(e) => setInfractionStatus(e.target.checked)}
                          className="rounded border-black/20"
                        />
                        <label htmlFor="infraction" className="text-sm font-medium text-amber-700">
                          Marcar infracción
                        </label>
                      </div>
                      {infractionStatus && (
                        <textarea
                          placeholder="Motivo (visible para el dueño)"
                          value={infractionReason}
                          onChange={(e) => setInfractionReason(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2 rounded-xl bg-white border border-black/15 text-ink placeholder-ink-2/50 text-sm"
                        />
                      )}
                    </div>
                  </>
                )}

                <div className="border-t border-black/8 pt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-ink-2 mb-1">Notificación directa al usuario</label>
                    <textarea
                      placeholder="Mensaje que verá en un modal al iniciar sesión (opcional)"
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 rounded-xl bg-white border border-black/15 text-ink placeholder-ink-2/50 text-sm"
                    />
                  </div>
                  <div className="mt-3 p-3 rounded-xl border border-red-200 bg-red-50">
                    <p className="text-xs text-red-700 font-semibold mb-2">Reset Total de Usuario</p>
                    <p className="text-xs text-red-600 mb-3">
                      Esta acción elimina TODOS los beneficios y vuelve al usuario al plan gratuito (Tier 0) para todos sus negocios.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowResetModal(true)}
                      className="w-full px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
                    >
                      Resetear Usuario a Plan Gratis
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-black/5 text-ink text-sm font-medium hover:bg-black/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveLimits}
                disabled={loading || loadingData}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={showResetModal}
        title="¡Cuidado! Esto eliminará TODOS los beneficios"
        description={
          profileName
            ? `Esta acción reseteará a "${profileName}" al plan gratuito (Tier 0) y quitará todos los beneficios premium de sus negocios.`
            : "Esta acción reseteará al usuario al plan gratuito (Tier 0) y quitará todos los beneficios premium de sus negocios."
        }
        loading={resetLoading}
        onClose={() => {
          if (!resetLoading) setShowResetModal(false)
        }}
        onConfirm={() => {
          if (!resetLoading) void handleResetUser()
        }}
        confirmLabel="Resetear Usuario"
        cancelLabel="Cancelar"
      />
    </>
  )
}

