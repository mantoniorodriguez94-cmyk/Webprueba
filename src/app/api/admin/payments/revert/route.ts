/**
 * Revertir un pago manual ya aprobado (ADMIN)
 * POST /api/admin/payments/revert
 *
 * Sólo existía aprobar y rechazar. Una vez aprobado no había vuelta atrás: un
 * comprobante falso detectado tarde, un monto mal leído o un reembolso dejaban
 * la membresía activa sin ninguna forma de deshacerla desde el panel.
 *
 * Qué deshace, exactamente:
 *   1. Resta del vencimiento los mismos meses que la aprobación sumó. Es el
 *      inverso exacto de lo que hizo aprobar, no una estimación. Si el
 *      vencimiento queda en el pasado, el nivel baja a 0.
 *   2. Borra la fila de membership_payments de ese envío, para que el pago
 *      pueda volver a aprobarse si la reversión fue un error (esa tabla es
 *      idempotente por transaction_ref: sin borrarla, reaprobar no haría nada).
 *   3. Marca el envío como rechazado y anota quién revirtió y por qué.
 *
 * Lo que NO hace: recalcular los beneficios visuales de los negocios. Si algo
 * quedara descuadrado, "Cambiar Tier" del panel lo corrige a mano. Se prefiere
 * eso a adivinar y dejar el estado peor de lo que estaba.
 *
 * Requiere las columnas de scripts/panel-admin-control.sql.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { getAdminClient } from "@/lib/supabase/admin"
import { registrarAccionAdmin } from "@/lib/auditoria"

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await checkAdminAuth()

    if (authError || !user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { paymentId, motivo } = body as { paymentId?: string; motivo?: string }

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "paymentId es requerido" },
        { status: 400 }
      )
    }

    if (!motivo?.trim()) {
      return NextResponse.json(
        { success: false, error: "Hace falta un motivo para revertir un pago" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    const { data: pago } = await supabase
      .from("manual_payment_submissions")
      .select("id, user_id, months, amount_usd, target_tier, status")
      .eq("id", paymentId)
      .single()

    if (!pago) {
      return NextResponse.json(
        { success: false, error: "Pago no encontrado" },
        { status: 404 }
      )
    }

    const datos = pago as {
      user_id: string
      months: number
      amount_usd: number
      target_tier: number
      status: string
    }

    // Revertir algo que nunca se aprobó restaría meses que nadie sumó.
    if (datos.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          error: `Sólo se puede revertir un pago aprobado (este está en "${datos.status}").`,
        },
        { status: 400 }
      )
    }

    const { data: perfil } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_end_date")
      .eq("id", datos.user_id)
      .single()

    const anterior = perfil as {
      subscription_tier?: number | null
      subscription_end_date?: string | null
    } | null

    // Inverso de la aprobación: los mismos meses, hacia atrás.
    const meses = Number(datos.months)
    let nuevoVencimiento: string | null = null
    let nuevoTier = 0

    if (anterior?.subscription_end_date && Number.isFinite(meses)) {
      const fecha = new Date(anterior.subscription_end_date)
      fecha.setMonth(fecha.getMonth() - meses)
      // Si al restar los meses el vencimiento ya pasó, no queda suscripción
      // que sostener y el nivel cae a 0.
      if (fecha.getTime() > Date.now()) {
        nuevoVencimiento = fecha.toISOString()
        nuevoTier = Number(anterior.subscription_tier ?? 0)
      }
    }

    const { error: perfilError } = await supabase
      .from("profiles")
      // @ts-expect-error - los tipos generados pueden omitir estas columnas
      .update({
        subscription_tier: nuevoTier,
        subscription_end_date: nuevoVencimiento,
      })
      .eq("id", datos.user_id)

    if (perfilError) {
      return NextResponse.json(
        { success: false, error: "No se pudo actualizar la suscripción del usuario" },
        { status: 500 }
      )
    }

    // Sin borrar esta fila, reaprobar el pago no haría nada: membership_payments
    // es idempotente por transaction_ref.
    await supabase.from("membership_payments").delete().eq("transaction_ref", paymentId)

    const { error: pagoError } = await supabase
      .from("manual_payment_submissions")
      // @ts-expect-error - los tipos generados todavía no incluyen estas columnas
      .update({
        status: "rejected",
        reverted_at: new Date().toISOString(),
        reverted_by: user.id,
        reverted_reason: motivo.trim(),
      })
      .eq("id", paymentId)

    if (pagoError) {
      return NextResponse.json(
        {
          success: false,
          error:
            "La suscripción se revirtió pero no se pudo marcar el pago. Comprueba que ejecutaste scripts/panel-admin-control.sql.",
        },
        { status: 500 }
      )
    }

    await registrarAccionAdmin({
      adminId: user.id,
      adminEmail: user.email,
      accion: "payment.revert",
      objetoTipo: "payment",
      objetoId: paymentId,
      detalle: {
        motivo: motivo.trim(),
        usuario_id: datos.user_id,
        monto_usd: datos.amount_usd,
        meses_restados: meses,
        tier_antes: anterior?.subscription_tier ?? null,
        vence_antes: anterior?.subscription_end_date ?? null,
        tier_despues: nuevoTier,
        vence_despues: nuevoVencimiento,
      },
    })

    return NextResponse.json({
      success: true,
      message:
        nuevoTier === 0
          ? "Pago revertido. La membresía quedó sin vigencia."
          : `Pago revertido. La membresía sigue activa hasta ${new Date(nuevoVencimiento!).toLocaleDateString("es-VE")}.`,
    })
  } catch (err) {
    console.error("[admin] payments/revert:", err)
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 }
    )
  }
}
