/**
 * Tipos TypeScript para el sistema de PAGOS de la MEMBRESÍA DE CUENTA.
 *
 * NOTA HISTÓRICA: este archivo contenía además los tipos del producto
 * "Negocio Premium" (premium_plans / business_subscriptions). Ese producto fue
 * eliminado — la app vende un único producto: la membresía de cuenta
 * (profiles.subscription_tier 0..3). Los niveles y precios viven en
 * `src/lib/memberships/tiers.ts`.
 */

// ============================================
// PAGOS
// ============================================

export type PaymentMethod = 'paypal' | 'manual'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

// ============================================
// PAGOS MANUALES (fallback "Plan B" de la membresía)
// ============================================

export type ManualPaymentMethod = 'zelle' | 'bank_transfer' | 'other'
export type ManualPaymentStatus = 'pending' | 'approved' | 'rejected'

export interface ManualPaymentSubmission {
  id: string
  user_id: string
  /** NULLABLE: la membresía pertenece a la cuenta, no a un negocio */
  business_id: string | null
  /** Nivel de membresía solicitado: 1 Conecta, 2 Destaca, 3 Patrocina */
  target_tier: number | null
  /** Meses comprados */
  months: number | null
  amount_usd: number
  payment_method: ManualPaymentMethod
  reference: string | null
  screenshot_url: string
  status: ManualPaymentStatus
  admin_notes: string | null
  created_at: string
  reviewed_at: string | null
}

// Con información de negocio y usuario (para admin)
export interface ManualPaymentSubmissionWithDetails extends ManualPaymentSubmission {
  business: {
    id: string
    name: string
    owner_id: string
  } | null
  user: {
    id: string
    email: string
    full_name?: string
  }
}

// ============================================
// FORMULARIOS
// ============================================

export interface ManualPaymentFormData {
  /** 1 Conecta, 2 Destaca, 3 Patrocina */
  target_tier: number
  months: number
  /** Opcional: solo como referencia, la membresía es de la cuenta */
  business_id?: string | null
  payment_method: ManualPaymentMethod
  reference: string
  screenshot: File
}

// ============================================
// NEGOCIO CON PREMIUM (flags espejo en businesses)
// ============================================

export interface BusinessPremiumInfo {
  is_premium: boolean
  premium_until: string | null
}

// ============================================
// RESPUESTAS DE API
// ============================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
