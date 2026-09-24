"use client"

import React, { useState } from "react"
import { X, CreditCard, Bitcoin, CheckCircle2, AlertTriangle, Landmark } from "lucide-react"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import type { ResolvedMembershipTier } from "@/lib/memberships/tiers"
import { calculateSubscriptionTotal, getPlanByTier } from "@/lib/memberships/tiers"
import { submitManualPayment } from "@/actions/payments"
import { toast } from "sonner"
import { Dialog } from "@/components/ui/Overlay"

interface MembershipPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  selectedTier: ResolvedMembershipTier | null
}

type TabId = "paypal" | "binance" | "transfer"

type ManualMethod = "pago_movil" | "zelle" | "bank_transfer"

/** Datos de cobro para el pago manual. Cámbialos aquí si cambian las cuentas. */
const MANUAL_PAYMENT_DETAILS = {
  phone: "0426-1010281",
  phoneRaw: "04261010281",
  idNumber: "V-23480465",
  idNumberRaw: "23480465",
  bankName: "Banco de Venezuela",
  bankCode: "0102",
}

export function MembershipPaymentModal({
  isOpen,
  onClose,
  selectedTier
}: MembershipPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("paypal")
  const [paypalError, setPaypalError] = useState<string | null>(null)
  const [paypalLoading, setPaypalLoading] = useState(false)
  const [paypalProcessing, setPaypalProcessing] = useState(false)
  const [paypalCompleted, setPaypalCompleted] = useState(false)
  const [binanceLoading, setBinanceLoading] = useState(false)
  const [binanceError, setBinanceError] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

  // ── Pago por transferencia (revisión manual) ─────────────────────────────
  const [manualMethod, setManualMethod] = useState<ManualMethod>("pago_movil")
  const [manualReference, setManualReference] = useState("")
  const [manualScreenshot, setManualScreenshot] = useState<File | null>(null)
  const [manualLoading, setManualLoading] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)
  const [manualSubmitted, setManualSubmitted] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // No se desmonta con `!isOpen`: el padre mantiene `selectedTier` poblado
  // tras la primera selección (solo alterna `isOpen`), así que dejamos que
  // sea Dialog quien controle visibilidad — eso es lo que permite que la
  // animación de salida se reproduzca en vez de desaparecer en seco.
  if (!selectedTier) return null

  // Read from env so it can be changed without touching code
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""

  const months = billingPeriod === "yearly" ? 12 : 1
  const plan = getPlanByTier(selectedTier.tier)
  const monthlyPrice = plan?.priceMonthly ?? selectedTier.baseAmount
  const planName = plan?.name ?? selectedTier.label
  const totalAmount = calculateSubscriptionTotal(selectedTier.tier, months)
  const discountMonths = months === 12 ? 2 : 0

  const copyValue = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      setCopiedField(null)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (manualLoading || manualSubmitted) return

    setManualError(null)

    if (!manualScreenshot) {
      setManualError("Debes subir la captura del comprobante de pago")
      return
    }
    if (!manualScreenshot.type.startsWith("image/")) {
      setManualError("El comprobante debe ser una imagen (JPEG, PNG, WEBP, GIF)")
      return
    }
    if (manualScreenshot.size > 10 * 1024 * 1024) {
      setManualError("La imagen es demasiado grande. Máximo 10MB")
      return
    }

    setManualLoading(true)
    try {
      const formData = new FormData()
      // El producto es la MEMBRESÍA DE CUENTA: tier + meses, sin business_id.
      // El monto lo recalcula el servidor a partir de estos dos campos.
      formData.append("target_tier", String(selectedTier.tier))
      formData.append("months", String(months))
      formData.append("payment_method", manualMethod)
      formData.append("reference", manualReference || "")
      formData.append("screenshot", manualScreenshot)

      const result = await submitManualPayment(formData)

      if (!result.success) {
        throw new Error(result.error || "Error enviando el comprobante")
      }

      setManualSubmitted(true)
      toast.success("Comprobante enviado", {
        description:
          "Un administrador verificará tu pago y activará tu membresía. Te notificaremos por correo.",
        duration: 6000
      })
    } catch (error: any) {
      const message = error?.message || "Error enviando el comprobante"
      setManualError(message)
      toast.error("Error en el pago", { description: message })
    } finally {
      setManualLoading(false)
    }
  }

  const handleBinancePay = async () => {
    setBinanceError(null)
    setBinanceLoading(true)

    try {
      const response = await fetch("/api/memberships/binance/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier.tier, months })
      })

      const data = await response.json()

      if (!response.ok || !data.success || !data.checkoutUrl) {
        throw new Error(data.error || "No se pudo iniciar el pago con Binance")
      }

      // Redirigir al checkout hospedado de Binance Pay
      window.location.href = data.checkoutUrl
    } catch (error: any) {
      console.error("[membership] binance create-order error:", error)
      const message = error?.message || "Hubo un problema iniciando el pago con Binance."
      setBinanceError(message)
      toast.error("Error en el pago", {
        description: message
      })
      setBinanceLoading(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-label="Completar contribución"
      panelClassName="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-paper-2 p-6 shadow-2xl"
    >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-600">
              Completar contribución
            </p>
            <h2 className="text-xl font-bold text-ink">
              {planName} — ${monthlyPrice.toFixed(2)} USD / mes
            </h2>
            <p className="mt-1 text-xs text-ink-2">
              Total:{" "}
              <span className="font-semibold text-ink">
                ${totalAmount.toFixed(2)}
              </span>{" "}
              ({months} {months === 1 ? "mes" : "meses"})
              {discountMonths > 0 && (
                <span className="ml-1 text-green-600">
                  (Ahorras {discountMonths} meses)
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-ink-2 hover:bg-black/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Duración */}
        <div className="mb-4 flex items-center gap-2 text-xs">
          <span className="text-ink-2">Duración:</span>
          <div className="inline-flex rounded-full bg-black/5 border border-black/8 p-1">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={`px-3 py-1.5 rounded-full font-medium ${
                billingPeriod === "monthly"
                  ? "bg-white dark:bg-paper-2 text-ink shadow-sm"
                  : "text-ink-2 hover:bg-black/5"
              }`}
            >
              1 Mes
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("yearly")}
              className={`px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${
                billingPeriod === "yearly"
                  ? "bg-green-500 text-white shadow-sm"
                  : "text-ink-2 hover:bg-black/5"
              }`}
            >
              1 Año
              <span className="hidden sm:inline text-[10px] font-semibold bg-white/20 text-white px-1.5 py-0.5 rounded-full">
                Mejor valor
              </span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2 rounded-full bg-black/5 p-1 text-xs font-medium border border-black/8">
          <button
            type="button"
            onClick={() => setActiveTab("paypal")}
            className={`flex-1 rounded-full px-3 py-2 flex items-center justify-center gap-1 ${
              activeTab === "paypal"
                ? "bg-white dark:bg-paper-2 text-ink shadow-sm"
                : "text-ink-2 hover:bg-black/5"
            }`}
          >
            <CreditCard className="h-3 w-3" />
            PayPal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("binance")}
            className={`flex-1 rounded-full px-3 py-2 flex items-center justify-center gap-1 ${
              activeTab === "binance"
                ? "bg-white dark:bg-paper-2 text-ink shadow-sm"
                : "text-ink-2 hover:bg-black/5"
            }`}
          >
            <Bitcoin className="h-3 w-3" />
            Binance Pay
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("transfer")}
            className={`flex-1 rounded-full px-3 py-2 flex items-center justify-center gap-1 ${
              activeTab === "transfer"
                ? "bg-white dark:bg-paper-2 text-ink shadow-sm"
                : "text-ink-2 hover:bg-black/5"
            }`}
          >
            <Landmark className="h-3 w-3" />
            Transferencia
          </button>
        </div>

        {/* Content */}
        {activeTab === "paypal" && (
          <div className="space-y-3">
            {!paypalClientId && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">
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
              <div className="rounded-2xl bg-black/[0.02] p-3 border border-black/8">
                <PayPalButtons
                  style={{ layout: "vertical", shape: "rect", color: "blue" }}
                  disabled={paypalLoading || paypalProcessing || paypalCompleted || !paypalClientId}
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
                    if (paypalProcessing || paypalCompleted) {
                      return
                    }
                    if (!data.orderID) {
                      setPaypalError("No se recibió orderID de PayPal")
                      return
                    }
                    try {
                      setPaypalError(null)
                      setPaypalLoading(true)
                      setPaypalProcessing(true)
                      setPaypalCompleted(false)

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

                      setPaypalCompleted(true)
                      toast.success("¡Pago Exitoso!", {
                        description: "Tu membresía ha sido actualizada correctamente.",
                        duration: 5000
                      })

                      // Esperar un momento para mostrar el estado de éxito antes de cerrar
                      setTimeout(() => {
                        onClose()
                        window.location.reload()
                      }, 2000)
                    } catch (error: any) {
                      console.error("[membership] PayPal onApprove error:", error)
                      const message = error?.message || "Error capturando pago de PayPal"
                      setPaypalError(message)
                      toast.error("Error en el pago", {
                        description: message
                      })
                    } finally {
                      setPaypalLoading(false)
                      setPaypalProcessing(false)
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

            <p className="text-[11px] text-ink-2">
              Serás redirigido a PayPal para completar tu contribución de forma segura por{" "}
              <span className="font-semibold text-ink">${totalAmount.toFixed(2)}</span>.
            </p>

            {/* Estado de procesamiento / éxito */}
            {paypalProcessing && !paypalCompleted && (
              <div className="flex items-center gap-2 text-xs text-blue-700">
                <div className="h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <span>Procesando pago...</span>
              </div>
            )}
            {paypalCompleted && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>Pago exitoso. Actualizando tu cuenta...</span>
              </div>
            )}

            {paypalError && (
              <p className="text-xs text-red-600 mt-1">
                {paypalError}
              </p>
            )}
          </div>
        )}

        {activeTab === "binance" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-black/8 bg-black/[0.02] p-4">
              <p className="text-sm text-ink-2">
                Paga <span className="font-bold text-amber-600">${totalAmount.toFixed(2)} USD</span> desde
                tu cuenta de Binance — cripto, saldo o tarjeta vinculada. Binance Pay convierte el
                monto automáticamente.
              </p>
              <p className="mt-2 text-[11px] text-ink-2">
                Serás redirigido al checkout seguro de Binance para completar el pago.
              </p>
            </div>

            {binanceError && (
              <p className="text-xs text-red-600">
                {binanceError}
              </p>
            )}

            <button
              type="button"
              onClick={handleBinancePay}
              disabled={binanceLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {binanceLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  Redirigiendo...
                </>
              ) : (
                <>
                  <Bitcoin className="h-4 w-4" />
                  Pagar con Binance Pay
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === "transfer" && (
          manualSubmitted ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-ink">¡Comprobante enviado!</h3>
              <p className="text-xs text-ink-2">
                Un administrador verificará tu pago de{" "}
                <span className="font-semibold text-ink">
                  {planName} · {months} {months === 1 ? "mes" : "meses"}
                </span>{" "}
                y activará tu membresía. Te notificaremos por correo.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
              >
                Entendido
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {/* Datos de pago */}
              <div className="rounded-2xl border border-black/8 bg-black/[0.02] p-4 space-y-3">
                <p className="text-xs font-semibold text-ink-2">
                  Pago Móvil / Transferencia — {MANUAL_PAYMENT_DETAILS.bankName}
                </p>

                {[
                  { label: "Teléfono", shown: MANUAL_PAYMENT_DETAILS.phone, value: MANUAL_PAYMENT_DETAILS.phoneRaw, field: "telefono" },
                  { label: "Cédula", shown: MANUAL_PAYMENT_DETAILS.idNumber, value: MANUAL_PAYMENT_DETAILS.idNumberRaw, field: "cedula" },
                  { label: "Banco", shown: `${MANUAL_PAYMENT_DETAILS.bankName} (${MANUAL_PAYMENT_DETAILS.bankCode})`, value: MANUAL_PAYMENT_DETAILS.bankCode, field: "banco" },
                ].map((row) => (
                  <div key={row.field} className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-paper-2 border border-black/8 dark:border-white/10 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[10px] text-ink-2">{row.label}</p>
                      <p className="truncate font-mono text-sm font-semibold text-ink">{row.shown}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyValue(row.value, row.field)}
                      className="flex-shrink-0 rounded-lg bg-black/5 px-2.5 py-1.5 text-[11px] text-ink hover:bg-black/10"
                    >
                      {copiedField === row.field ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                ))}

                <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-amber-700">Monto exacto a pagar</p>
                    <p className="font-mono text-lg font-bold text-amber-700">
                      ${totalAmount.toFixed(2)} USD
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyValue(totalAmount.toFixed(2), "monto")}
                    className="flex-shrink-0 rounded-lg bg-amber-100 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-200"
                  >
                    {copiedField === "monto" ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>
                  Realiza el pago por el monto exacto y sube el comprobante. Un administrador lo
                  verificará y activará tu membresía{" "}
                  <span className="font-semibold text-ink">{planName}</span> por{" "}
                  <span className="font-semibold text-ink">
                    {months} {months === 1 ? "mes" : "meses"}
                  </span>
                  . Suele tardar hasta 24 horas.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-ink-2">Método de pago</label>
                <select
                  value={manualMethod}
                  onChange={(e) => setManualMethod(e.target.value as ManualMethod)}
                  className="w-full rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-paper-2 px-3 py-2 text-sm text-ink focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="pago_movil">Pago Móvil (Venezuela)</option>
                  <option value="zelle">Zelle</option>
                  <option value="bank_transfer">Transferencia bancaria</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-ink-2">
                  Referencia / número de confirmación
                </label>
                <input
                  type="text"
                  value={manualReference}
                  onChange={(e) => setManualReference(e.target.value)}
                  placeholder="Ej: 123456789"
                  className="w-full rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-paper-2 px-3 py-2 text-sm text-ink placeholder:text-ink-2/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-ink-2">
                  Captura del comprobante <span className="text-red-600">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setManualScreenshot(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-paper-2 px-3 py-2 text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500 file:px-3 file:py-1.5 file:text-xs file:text-white hover:file:bg-blue-600"
                />
                <p className="text-[11px] text-ink-2">
                  Sube una foto clara y completa del comprobante (máx. 10MB).
                </p>
              </div>

              {manualError && <p className="text-xs text-red-600">{manualError}</p>}

              <button
                type="submit"
                disabled={manualLoading || !manualScreenshot}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {manualLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Enviar para verificación
                  </>
                )}
              </button>
            </form>
          )
        )}
    </Dialog>
  )
}

export default MembershipPaymentModal


