/**
 * API Route: Get profile override data (ADMIN)
 * GET /api/admin/profile-data?profileId=xxx
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { checkAdminAuth } from "@/utils/admin-auth"

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await checkAdminAuth()
    if (authError) {
      return NextResponse.json(
        { success: false, error: "No autorizado." },
        { status: 403 }
      )
    }
    const profileId = request.nextUrl.searchParams.get("profileId")
    if (!profileId) {
      return NextResponse.json(
        { success: false, error: "profileId requerido" },
        { status: 400 }
      )
    }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, subscription_tier, extra_business_limit, subscription_end_date, " +
        "golden_border_expires_at, spotlight_expires_at, promotions_expires_at, chat_expires_at"
      )
      .eq("id", profileId)
      .single()
    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Perfil no encontrado" },
        { status: 404 }
      )
    }
    const d = data as any
    return NextResponse.json(
      {
        success: true,
        data: {
          subscription_tier: d.subscription_tier ?? 0,
          extra_business_limit: d.extra_business_limit ?? 0,
          subscription_end_date: d.subscription_end_date ?? null,
          golden_border_expires_at: d.golden_border_expires_at ?? null,
          spotlight_expires_at: d.spotlight_expires_at ?? null,
          promotions_expires_at: d.promotions_expires_at ?? null,
          chat_expires_at: d.chat_expires_at ?? null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    )
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
