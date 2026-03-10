"use client"

/**
 * ManageLimitsButton
 * ─────────────────────────────────────────────────────────────────────────────
 * Self-contained "Gestionar" button used in the "Usuarios Registrados" table.
 * It includes its own Master PIN modal so it can be dropped anywhere without
 * requiring a parent component to provide `ensureUnlocked`.
 *
 * Opens AdminUserManagementModal for all 7 modular actions:
 * plan, perks (borde/spotlight/promos/chat), alert, photos, delete user.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Loader2 } from "lucide-react"
import { toast } from "sonner"
import AdminUserManagementModal from "./AdminUserManagementModal"

type Props = {
  profileId: string
  profileName?: string
  businessId?: string
  businessName?: string
}

export default function ManageLimitsButton({
  profileId,
  profileName = "Usuario",
  businessId,
  businessName,
}: Props) {
  const router = useRouter()

  // ── Main modal ────────────────────────────────────────────────────────────
  const [open, setOpen] = useState(false)

  // ── Self-contained PIN state ──────────────────────────────────────────────
  const [isActionUnlocked, setIsActionUnlocked] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pin, setPin] = useState("")
  const [pinLoading, setPinLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  // ── ensureUnlocked — identical contract to AdminQuickActions ─────────────
  const ensureUnlocked = (action: () => void) => {
    if (isActionUnlocked) {
      action()
      return
    }
    setPendingAction(() => action)
    setShowPinModal(true)
  }

  // ── PIN submission ────────────────────────────────────────────────────────
  const handlePinSubmit = async () => {
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
          description: data.error || "PIN maestro incorrecto.",
        })
        return
      }
      toast.success("Autorización exitosa", {
        description: "PIN verificado. Sesión activa 5 min.",
      })
      setIsActionUnlocked(true)
      setShowPinModal(false)
      setPin("")
      // Auto-expire the in-memory unlock after 5 min (matches server cookie)
      setTimeout(() => setIsActionUnlocked(false), 5 * 60 * 1000)
      if (pendingAction) {
        const action = pendingAction
        setPendingAction(null)
        action()
      }
    } catch {
      toast.error("Error de conexión al verificar el PIN. Intenta nuevamente.")
    } finally {
      setPinLoading(false)
    }
  }

  const closePinModal = () => {
    if (pinLoading) return
    setShowPinModal(false)
    setPin("")
    setPendingAction(null)
  }

  return (
    <>
      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 text-xs font-medium transition-colors"
      >
        Gestionar
      </button>

      {/* ── Main modular management modal ──────────────────────────────── */}
      <AdminUserManagementModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          setOpen(false)
          router.refresh()
        }}
        profileId={profileId}
        profileName={profileName}
        businessId={businessId}
        businessName={businessName}
        onEnsureUnlocked={ensureUnlocked}
      />

      {/* ── Self-contained Master PIN modal ────────────────────────────── */}
      {showPinModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closePinModal}
        >
          <div
            className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Acción Crítica</h4>
                <p className="text-xs text-gray-400">
                  Ingresa el PIN Maestro para autorizar este cambio.
                </p>
              </div>
            </div>

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
              onKeyDown={(e) => e.key === "Enter" && void handlePinSubmit()}
              className="w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="••••••"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                type="button"
                disabled={pinLoading}
                onClick={closePinModal}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pinLoading || pin.length !== 6}
                onClick={() => void handlePinSubmit()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {pinLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando…
                  </>
                ) : (
                  "Autorizar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
