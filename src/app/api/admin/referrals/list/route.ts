/**
 * API Route: List referral data for admin (ADMIN)
 * GET /api/admin/referrals/list
 * Returns users who have referred others, with qualified counts and reward status.
 * Expects table referral_rewards (id, user_id, created_at) for claimed state.
 */

import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"
import { createClient } from "@/utils/supabase/server"

type ProfileRow = { id: string; referred_by: string | null; subscription_tier?: number | null }

export async function GET() {
  try {
    const { user, error: authError } = await checkAdminAuth()
    if (authError || !user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Se requieren permisos de administrador." },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    const { data: referredProfiles, error: refError } = await supabase
      .from("profiles")
      .select("id, referred_by, subscription_tier")
      .not("referred_by", "is", null)

    if (refError) {
      return NextResponse.json(
        { success: false, error: "Error al cargar referidos." },
        { status: 500 }
      )
    }

    const referredByMap = new Map<string, string[]>()
    const qualifiedByReferrer = new Map<string, number>()
    const rows = (referredProfiles || []) as ProfileRow[]
    for (const p of rows) {
      const referrerId = p.referred_by!
      const list = referredByMap.get(referrerId) || []
      list.push(p.id)
      referredByMap.set(referrerId, list)
      if ((p.subscription_tier ?? 0) > 0) {
        qualifiedByReferrer.set(referrerId, (qualifiedByReferrer.get(referrerId) || 0) + 1)
      }
    }

    const referrerIds = [...referredByMap.keys()]
    if (referrerIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { referrers: [], rewardsClaimed: [] },
      })
    }

    const { data: referrerProfiles, error: profError } = await supabase
      .from("profiles")
      .select("id, full_name, email, subscription_tier")
      .in("id", referrerIds)

    if (profError) {
      return NextResponse.json(
        { success: false, error: "Error al cargar perfiles de referidores." },
        { status: 500 }
      )
    }

    // Claimed rewards (referral_rewards table - optional)
    let rewardsClaimed: string[] = []
    try {
      const { data: rewards } = await supabase
        .from("referral_rewards")
        .select("user_id")
      rewardsClaimed = (rewards || []).map((r: { user_id: string }) => r.user_id)
    } catch {
      // Table may not exist
    }

    const referrers = (referrerProfiles || []).map((p) => {
      const referredIdsList = referredByMap.get(p.id) || []
      const qualified = qualifiedByReferrer.get(p.id) || 0
      const claimed = rewardsClaimed.includes(p.id)
      return {
        user_id: p.id,
        full_name: p.full_name ?? "—",
        email: p.email ?? "—",
        referred_count: referredIdsList.length,
        qualified_count: qualified,
        claimed,
      }
    })

    return NextResponse.json({
      success: true,
      data: { referrers, rewardsClaimed: rewardsClaimed },
    })
  } catch (err: unknown) {
    console.error("Error en admin referrals list:", err)
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
