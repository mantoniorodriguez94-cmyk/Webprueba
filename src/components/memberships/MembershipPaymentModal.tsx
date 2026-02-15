"use client"

import React, { useState } from "react"
import { X, CreditCard, Bitcoin, Copy, CheckCircle2, AlertTriangle } from "lucide-react"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import type { ResolvedMembershipTier } from "@/lib/memberships/tiers"
import { calculateSubscriptionTotal, getPlanByTier } from "@/lib/memberships/tiers"
import { toast } from "sonner"

interface MembershipPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  selectedTier: ResolvedMembershipTier | null
  isTestMode?: boolean
}

type TabId = "paypal" | "crypto"

export function MembershipPaymentModal({
  isOpen,
  onClose,
  selectedTier,
  isTestMode = false
}: MembershipPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("paypal")
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle")
  const [paypalError, setPaypalError] = useState<string | null>(null)
  const [paypalLoading, setPaypalLoading] = useState(false)
  const [cryptoTxId, setCryptoTxId] = useState("")
  const [cryptoLoading, setCryptoLoading] = useState(false)
  const [cryptoError, setCryptoError] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

  if (!isOpen || !selectedTier) return null

  const depositAddress =
    process.env.NEXT_PUBLIC_CRYPTO_DEPOSIT_ADDRESS || "TRXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""

  const months = billingPeriod === "yearly" ? 12 : 1
  const plan = getPlanByTier(selectedTier.tier)
  const monthlyPrice = plan?.priceMonthly ?? selectedTier.baseAmount
  const planName = plan?.name ?? selectedTier.label
  const totalAmount = calculateSubscriptionTotal(selectedTier.tier, months)
  const discountMonths = months === 12 ? 2 : 0

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress)
      setCopyState("copied")
      setTimeout(() => setCopyState("idle"), 2000)
    } catch {
      // Silenciar, pero mostrar feedback simple
      setCopyState("idle")
    }
  }

  const handleCryptoVerify = async () => {
    setCryptoError(null)
    setCryptoLoading(true)

    try {
      let txidToSend = cryptoTxId.trim()

      // En modo test podemos generar un txid ficticio para usar con CRYPTO_VERIFY_MODE=mock
      if (isTestMode && !txidToSend) {
        txidToSend = `mock-txid-${Date.now()}`
      }

      if (!txidToSend) {
        setCryptoError("Debes ingresar el hash de la transacción (TXID)")
        setCryptoLoading(false)
        return
      }

      const response = await fetch("/api/payments/verify-crypto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txid: txidToSend, tier: selectedTier.tier, months })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al verificar el pago")
      }

      toast.success("¡Pago Exitoso!", {
        description: "Tu membresía ha sido actualizada correctamente.",
        duration: 5000
      })
      onClose()
      window.location.reload()
    } catch (error: any) {
      console.error("[membership] verify-crypto error:", error)
      const message = error?.message || "Hubo un problema procesando tu solicitud."
      setCryptoError(message)
      toast.error("Error en el pago", {
        description: message
      })
    } finally {
      setCryptoLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xl px-4">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-gray-900/95 backdrop-blur-xl p-6 shadow-2xl shadow-black/60 animate-fade-in">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-400">
              Completar contribución
            </p>
            <h2 className="text-xl font-bold text-white">
              {planName} — ${monthlyPrice.toFixed(2)} USD / mes
            </h2>
            <p className="mt-1 text-xs text-gray-300">
              Total:{" "}
              <span className="font-semibold text-white">
                ${totalAmount.toFixed(2)}
              </span>{" "}
              ({months} {months === 1 ? "mes" : "meses"})
              {discountMonths > 0 && (
                <span className="ml-1 text-emerald-300">
                  (Ahorras {discountMonths} meses)
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gray-200 hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Duración */}
        <div className="mb-4 flex items-center gap-2 text-xs">
          <span className="text-gray-400">Duración:</span>
          <div className="inline-flex rounded-full bg-black/40 border border-white/10 p-1">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={`px-3 py-1.5 rounded-full font-medium ${
                billingPeriod === "monthly"
                  ? "bg-white text-gray-900 shadow"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              1 Mes
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("yearly")}
              className={`px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${
                billingPeriod === "yearly"
                  ? "bg-emerald-400 text-emerald-950 shadow"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              1 Año
              <span className="hidden sm:inline text-[10px] font-semibold bg-emerald-900/20 text-emerald-100 px-1.5 py-0.5 rounded-full">
                Mejor valor
              </span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2 rounded-full bg-black/40 p-1 text-xs font-medium border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("paypal")}
            className={`flex-1 rounded-full px-3 py-2 flex items-center justify-center gap-1 ${
              activeTab === "paypal"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-300 hover:bg-white/5"
            }`}
          >
            <CreditCard className="h-3 w-3" />
            PayPal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("crypto")}
            className={`flex-1 rounded-full px-3 py-2 flex items-center justify-center gap-1 ${
              activeTab === "crypto"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-300 hover:bg-white/5"
            }`}
          >
            <Bitcoin className="h-3 w-3" />
            Cripto (USDT)
          </button>
        </div>

        {/* Content */}
        {activeTab === "paypal" && (
          <div className="space-y-3">
            {!paypalClientId && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300 border border-red-500/40">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  Falta configurar <code className="font-mono">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code>{" "}
                  en el entorno.
                </span>
              </div>
            )}

            <PayPalScriptProvider
              options={{
                clientId: paypalClientId,
                currency: "USD"
              }}
            >
              <div className="rounded-2xl bg-black/20 p-3 border border-white/10">
                <PayPalButtons
                  style={{ layout: "vertical", shape: "rect", color: "gold" }}
                  disabled={paypalLoading || !paypalClientId}
                  createOrder={async () => {
                    try {
                      setPaypalError(null)
                      setPaypalLoading(true)

                      const response = await fetch(
                        "/api/memberships/paypal/create-order",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ tier: selectedTier.tier, months })
                        }
                      )

                      const data = await response.json()

                      if (!response.ok || !data.success || !data.orderId) {
                        throw new Error(data.error || "Error creando orden de PayPal")
                      }

                      return data.orderId as string
                    } catch (error: any) {
                      console.error("[membership] PayPal createOrder error:", error)
                      const message = error?.message || "Error creando orden de PayPal"
                      setPaypalError(message)
                      toast.error("Error en el pago", {
                        description: message
                      })
                      throw error
                    } finally {
                      setPaypalLoading(false)
                    }
                  }}
                  onApprove={async (data) => {
                    if (!data.orderID) {
                      setPaypalError("No se recibió orderID de PayPal")
                      return
                    }
                    try {
                      setPaypalError(null)
                      setPaypalLoading(true)

                      const response = await fetch(
                        "/api/memberships/paypal/capture-order",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ orderId: data.orderID })
                        }
                      )

                      const result = await response.json()

                      if (!response.ok || !result.success) {
                        throw new Error(result.error || "Error capturando pago de PayPal")
                      }

                      toast.success("¡Pago Exitoso!", {
                        description: "Tu membresía ha sido actualizada correctamente.",
                        duration: 5000
                      })
                      onClose()
                      window.location.reload()
                    } catch (error: any) {
                      console.error("[membership] PayPal onApprove error:", error)
                      const message = error?.message || "Error capturando pago de PayPal"
                      setPaypalError(message)
                      toast.error("Error en el pago", {
                        description: message
                      })
                    } finally {
                      setPaypalLoading(false)
                    }
                  }}
                  onError={(err) => {
                    console.error("[membership] PayPalButtons onError:", err)
                    const message = "Se produjo un error con PayPal. Intenta nuevamente."
                    setPaypalError(message)
                    toast.error("Error en el pago", {
                      description: message
                    })
                  }}
                />
              </div>
            </PayPalScriptProvider>

            <p className="text-[11px] text-gray-400">
              Serás redirigido a PayPal para completar tu contribución de forma segura por{" "}
              <span className="font-semibold text-white">${totalAmount.toFixed(2)}</span>.
            </p>

            {paypalError && (
              <p className="text-xs text-red-400 mt-1">
                {paypalError}
              </p>
            )}
          </div>
        )}

        {activeTab === "crypto" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="mb-2 text-xs font-medium text-gray-300">
                Dirección de Depósito USDT (TRC-20)
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-black/60 px-3 py-2 text-xs text-emerald-300">
                  {depositAddress}
                </code>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/90 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400"
                >
                  {copyState === "copied" ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-gray-400">
                Red: <span className="font-semibold text-emerald-300">TRON (TRC-20)</span>
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-2xl border border-yellow-400/50 bg-yellow-500/10 p-3 text-xs text-yellow-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-semibold">Importante</p>
                <p className="mt-1">
                  Envía{" "}
                  <span className="font-bold text-yellow-200">
                    exactamente ${totalAmount.toFixed(2)} USDT
                  </span>{" "}
                  a la dirección indicada usando la red{" "}
                  <span className="font-semibold">TRC-20</span>. No incluyas las comisiones
                  dentro de ese monto.
                </p>
              </div>
            </div>

            {isTestMode && (
              <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-2 text-[11px] text-blue-100 flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <p>
                  Modo test activo. Si el backend tiene{" "}
                  <code className="font-mono">CRYPTO_VERIFY_MODE=mock</code>, puedes dejar el TXID
                  vacío y se usará uno ficticio para simular el flujo.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">
                Hash de la Transacción (TXID)
              </label>
              <input
                type="text"
                value={cryptoTxId}
                onChange={(e) => setCryptoTxId(e.target.value)}
                placeholder="Ej: 0x1234...abcd"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {cryptoError && (
              <p className="text-xs text-red-400">
                {cryptoError}
              </p>
            )}

            <button
              type="button"
              onClick={handleCryptoVerify}
              disabled={cryptoLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cryptoLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-emerald-950" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Verificar Pago
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MembershipPaymentModal


