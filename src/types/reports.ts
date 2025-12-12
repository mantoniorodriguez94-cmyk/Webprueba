/**
 * Tipos TypeScript para el Sistema de Reportes
 */

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export interface BusinessReport {
  id: string
  business_id: string
  reporter_id: string
  reason: string
  status: ReportStatus
  admin_notes: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

export interface ReviewReport {
  id: string
  review_id: string
  reporter_id: string
  reason: string
  status: ReportStatus
  admin_notes: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

// Con información relacionada (para admin)
export interface BusinessReportWithDetails extends BusinessReport {
  business?: {
    id: string
    name: string
  }
  reporter?: {
    id: string
    email: string
    full_name: string | null
  }
}

export interface ReviewReportWithDetails extends ReviewReport {
  review?: {
    id: string
    business_id: string
    rating: number
    comment: string | null
  }
  reporter?: {
    id: string
    email: string
    full_name: string | null
  }
}


