/**
 * Tipos TypeScript para el Sistema de Comisiones/Afiliados
 */

export type CommissionStatus = 'pending' | 'paid' | 'cancelled'

export interface Commission {
  id: string
  partner_id: string
  referred_user_id: string
  source_payment_id: string
  amount: number
  status: CommissionStatus
  created_at: string
  paid_at: string | null
  notes: string | null
}

export interface CommissionWithDetails extends Commission {
  partner?: {
    id: string
    full_name: string | null
    email: string | null
  }
  referred_user?: {
    id: string
    full_name: string | null
    email: string | null
  }
  source_payment?: {
    id: string
    amount_usd: number
    status: string
    created_at: string
  }
}

export interface CommissionStats {
  total_commissions: number
  total_amount: number
  pending_count: number
  pending_amount: number
  paid_count: number
  paid_amount: number
}

