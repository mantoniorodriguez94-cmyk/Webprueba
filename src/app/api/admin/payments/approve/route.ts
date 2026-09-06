/**
 * API Route: Aprobar pago manual de MEMBRESÍA (ADMIN)
 * POST /api/admin/payments/approve
 *
 * Aprobar un pago manual debe tener EXACTAMENTE el mismo efecto que una compra
 * automática por PayPal del mismo tier:
 *   1. applyMembershipFromPayment()      → profiles.subscription_tier / end_date
 *                                          + log idempotente en membership_payments
 *   2. applyTierBenefitsToBusinesses()   → flags visuales en los negocios del usuario
 *
 * Ambos pasos son los MISMOS que usa /api/memberships/paypal/capture-order.
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/utils/admin-auth'
import { getAdminClient } from '@/lib/supabase/admin'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { PaymentApprovedTemplate } from '@/lib/emails/templates'
import {
  applyMembershipFromPayment,
  applyTierBenefitsToBusinesses,
} from '@/lib/memberships/service'
import { getLabelForTier } from '@/lib/memberships/tiers'
import type { SubscriptionTier } from '@/lib/memberships/tiers'

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario es admin
    const { user, error: authError } = await checkAdminAuth()

    if (authError || !user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No autorizado - Se requieren permisos de administrador' },
        { status: 403 }
      )
    }

    // Parsear body
    const body = await request.json()
    const { submissionId, submission_id, admin_notes } = body
    const submission_id_final = submissionId || submission_id

    if (!submission_id_final) {
      return NextResponse.json(
        { success: false, error: 'submission_id es requerido' },
        { status: 400 }
      )
    }

    // Usar cliente admin (bypass RLS)
    const adminSupabase = getAdminClient()

    // Obtener información del pago manual
    const { data: submission, error: submissionError } = await (adminSupabase as any)
      .from('manual_payment_submissions')
      .select('id, user_id, business_id, target_tier, months, amount_usd, status')
      .eq('id', submission_id_final)
      .single()

    if (submissionError || !submission) {
      console.error('[APPROVE] Error buscando submission:', submissionError)
      return NextResponse.json(
        { success: false, error: `Error al buscar el pago: ${submissionError?.message || 'Pago no encontrado'}` },
        { status: 404 }
      )
    }

    const submissionData = submission as any

    // Verificar que está pendiente (evita doble aplicación)
    if (submissionData.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'El pago ya fue procesado' },
        { status: 400 }
      )
    }

    // ── Validar los datos de membresía del envío ──────────────────────────────
    const targetTier = Number(submissionData.target_tier)
    const months = Number(submissionData.months)
    const amount = Number(submissionData.amount_usd)

    if (!Number.isFinite(targetTier) || targetTier < 1 || targetTier > 3) {
      return NextResponse.json(
        {
          success: false,
          error:
            'El pago no tiene un nivel de membresía válido (target_tier). Probablemente fue creado con el sistema anterior; recházalo y pide al usuario que lo envíe de nuevo.',
        },
        { status: 400 }
      )
    }

    if (!Number.isFinite(months) || months < 1) {
      return NextResponse.json(
        { success: false, error: 'El pago no tiene una duración válida (months).' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'El pago no tiene un monto válido (amount_usd).' },
        { status: 400 }
      )
    }

    // ── 1) Aplicar la membresía a la CUENTA (mismo camino que PayPal) ────────
    // transactionRef = id del submission → idempotente en membership_payments.
    const membershipResult = await applyMembershipFromPayment({
      userId: submissionData.user_id,
      amount,
      currency: 'USD',
      gateway: 'manual',
      transactionRef: submissionData.id,
      targetTier: targetTier as SubscriptionTier,
      monthsToAdd: months,
    })

    if (!membershipResult.success) {
      console.error('[APPROVE] Error aplicando membresía:', membershipResult.error)
      return NextResponse.json(
        { success: false, error: `Error al activar la membresía: ${membershipResult.error}` },
        { status: 500 }
      )
    }

    const appliedTier = membershipResult.tier ?? (targetTier as SubscriptionTier)

    // ── 2) Sincronizar beneficios visuales en los negocios del usuario ───────
    // Misma función que usa la captura automática de PayPal.
    await applyTierBenefitsToBusinesses(submissionData.user_id, appliedTier)

    // ── 3) Marcar el envío como aprobado ─────────────────────────────────────
    const { error: updateSubmissionError } = await (adminSupabase as any)
      .from('manual_payment_submissions')
      .update({
        status: 'approved',
        admin_notes: admin_notes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', submission_id_final)

    if (updateSubmissionError) {
      // La membresía YA fue aplicada. No revertimos (applyMembershipFromPayment es
      // idempotente por transaction_ref), pero avisamos para revisión manual.
      console.error('[APPROVE] Membresía aplicada pero falló marcar el submission como aprobado:', updateSubmissionError)
      return NextResponse.json(
        {
          success: false,
          error: `La membresía se activó, pero no se pudo marcar el pago como aprobado: ${updateSubmissionError.message}. Revísalo manualmente.`,
        },
        { status: 500 }
      )
    }

    const tierLabel = getLabelForTier(appliedTier)
    const planLabel = `${tierLabel} · ${months} ${months === 1 ? 'mes' : 'meses'}`

    // ── 4) Enviar correo de aprobación (no bloqueante) ───────────────────────
    if (resend) {
      try {
        const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(submissionData.user_id)

        if (!userError && userData?.user?.email) {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: userData.user.email,
            subject: `🎉 Pago Aprobado - Tu membresía ${tierLabel} está activa`,
            html: PaymentApprovedTemplate(planLabel),
          })
        } else {
          console.warn('[APPROVE] No se pudo obtener el email del usuario:', userError?.message || 'Usuario no encontrado')
        }
      } catch (emailError: any) {
        // NO hacer rollback de la aprobación si el email falla
        console.error('[APPROVE] Error enviando correo de aprobación (no crítico):', emailError?.message || emailError)
      }
    } else {
      console.warn('[APPROVE] Resend no está configurado. Correo no enviado.')
    }

    return NextResponse.json({
      success: true,
      message: `Pago aprobado. Membresía ${planLabel} activada exitosamente.`,
      tier: appliedTier,
      months: membershipResult.monthsAdded ?? months,
    })

  } catch (error: any) {
    console.error('[APPROVE] Error en approve payment:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
