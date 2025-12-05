/**
 * Tipos TypeScript para el Sistema de Suscripciones Premium
 */

// ============================================
// PLANES PREMIUM
// ============================================

export type BillingPeriod = 'monthly' | 'quarterly' | 'semiannual' | 'yearly'

export interface PremiumPlan {
  id: string
  name: string
  description: string | null
  price_usd: number
  billing_period: BillingPeriod
  max_photos: number
  highlight_level: number
  is_active: boolean
  created_at: string
}

// ============================================
// SUSCRIPCIONES
// ============================================

export type SubscriptionStatus = 'active' | 'pending' | 'expired' | 'canceled'

export interface BusinessSubscription {
  id: string
  business_id: string
  user_id: string
  plan_id: string
  status: SubscriptionStatus
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

// Con información del plan (JOIN)
export interface BusinessSubscriptionWithPlan extends BusinessSubscription {
  plan: PremiumPlan
}

// ============================================
// PAGOS
// ============================================

export type PaymentMethod = 'paypal' | 'manual'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface Payment {
  id: string
  business_id: string
  user_id: string
  plan_id: string
  method: PaymentMethod
  amount_usd: number
  currency: string
  status: PaymentStatus
  external_id: string | null
  raw_payload: any | null
  created_at: string
}

// Con información del plan (JOIN)
export interface PaymentWithPlan extends Payment {
  plan: PremiumPlan
}

// ============================================
// PAGOS MANUALES
// ============================================

export type ManualPaymentMethod = 'zelle' | 'bank_transfer' | 'other'
export type ManualPaymentStatus = 'pending' | 'approved' | 'rejected'

export interface ManualPaymentSubmission {
  id: string
  business_id: string
  user_id: string
  plan_id: string
  amount_usd: number
  payment_method: ManualPaymentMethod
  reference: string | null
  screenshot_url: string
  status: ManualPaymentStatus
  admin_notes: string | null
  created_at: string
  reviewed_at: string | null
}

// Con información del plan y negocio (para admin)
export interface ManualPaymentSubmissionWithDetails extends ManualPaymentSubmission {
  plan: PremiumPlan
  business: {
    id: string
    name: string
    owner_id: string
  }
  user: {
    id: string
    email: string
    full_name?: string
  }
}

// ============================================
// PAYPAL
// ============================================

export interface PayPalCreateOrderRequest {
  plan_id: string
  business_id: string
}

export interface PayPalCreateOrderResponse {
  success: boolean
  orderId?: string
  paymentId?: string
  error?: string
}

export interface PayPalCaptureOrderRequest {
  orderId: string
  paymentId: string
}

export interface PayPalCaptureOrderResponse {
  success: boolean
  subscriptionId?: string
  error?: string
}

// ============================================
// NEGOCIO CON PREMIUM (extendido)
// ============================================

export interface BusinessPremiumInfo {
  is_premium: boolean
  premium_until: string | null
  premium_plan_id: string | null
}

// ============================================
// FORMULARIOS
// ============================================

export interface ManualPaymentFormData {
  plan_id: string
  business_id: string
  payment_method: ManualPaymentMethod
  reference: string
  screenshot: File
}

// ============================================
// ESTADO DE SUSCRIPCIÓN (para UI)
// ============================================

export interface SubscriptionState {
  hasActive: boolean
  subscription: BusinessSubscriptionWithPlan | null
  daysRemaining: number | null
  isExpired: boolean
  canRenew: boolean
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


