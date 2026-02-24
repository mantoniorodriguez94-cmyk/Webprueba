/**
 * API Route: Live admin metrics (ADMIN)
 * GET /api/admin/metrics
 * Returns real-time counts for profiles, businesses, revenue placeholder, etc.
 */

import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { getAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const { user, error: authError } = await checkAdminAuth()
    if (authError || !user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Se requieren permisos de administrador." },
        { status: 403 }
      )
    }

    const supabase = getAdminClient()

    let usersCount = 0
    try {
      const { data: authData } = await supabase.auth.admin.listUsers()
      usersCount = authData?.users?.length ?? 0
    } catch {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true })
      usersCount = count ?? 0
    }

    const [
      { count: businessesCount },
      { count: premiumCount },
      { count: pendingPaymentsCount },
      { count: expiringCount },
      { count: featuredCount },
    ] = await Promise.all([
      supabase.from("businesses").select("*", { count: "exact", head: true }),
      supabase.from("businesses").select("*", { count: "exact", head: true }).eq("is_premium", true),
      supabase
        .from("manual_payment_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("business_subscriptions")
        .select("*", { count: "exact", head: true })
        .lte("end_date", new Date(Date.now() + 7 * 86400000).toISOString())
        .eq("status", "active"),
      supabase
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .eq("is_featured", true)
        .not("featured_until", "is", null)
        .gt("featured_until", new Date().toISOString()),
    ])

    return NextResponse.json({
      success: true,
      data: {
        users: usersCount,
        businesses: businessesCount ?? 0,
        premium: premiumCount ?? 0,
        pendingPayments: pendingPaymentsCount ?? 0,
        expiring: expiringCount ?? 0,
        featured: featuredCount ?? 0,
      },
    })
  } catch (err: unknown) {
    console.error("Error en admin metrics:", err)
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
