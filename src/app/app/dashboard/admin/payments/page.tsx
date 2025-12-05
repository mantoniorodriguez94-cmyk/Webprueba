/**
 * Panel de Administración - Pagos Manuales (Server Component)
 * Permite a los admins aprobar o rechazar pagos manuales pendientes
 * 
 * Los datos se cargan en el servidor y se pasan al cliente para interactividad
 */

import { createClient } from '@supabase/supabase-js'
import AdminPaymentsClient from './AdminPaymentsClient'

// Cliente de Supabase para Server Components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function loadSubmissions(status: 'pending' | 'approved' | 'rejected' = 'pending') {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data, error } = await supabase
    .from('manual_payment_submissions')
    .select(`
      *,
      business:businesses(name),
      plan:premium_plans(name, price_usd)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })
  
  // Obtener emails de los usuarios desde profiles
  if (data && data.length > 0) {
    const userIds = data.map((s: any) => s.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)
    
    // Mapear los perfiles a los submissions
    if (profiles) {
      const profileMap = new Map(profiles.map(p => [p.id, p]))
      data.forEach((s: any) => {
        const profile = profileMap.get(s.user_id)
        s.user = profile ? { full_name: profile.full_name } : null
      })
    }
  }

  if (error) {
    console.error('Error cargando pagos:', error)
    return []
  }

  return data || []
}

export default async function AdminPaymentsPage() {
  // Cargar datos iniciales en el servidor (pendientes por defecto)
  const initialSubmissions = await loadSubmissions('pending')

  return (
    <AdminPaymentsClient 
      initialSubmissions={initialSubmissions as any} 
      initialFilter="pending" 
    />
  )
}
