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
      .select("id, subscription_tier, extra_business_limit")
      .eq("id", profileId)
      .single()
    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Perfil no encontrado" },
        { status: 404 }
      )
    }
    return NextResponse.json({
      success: true,
      data: {
        subscription_tier: data.subscription_tier ?? 0,
        extra_business_limit: data.extra_business_limit ?? 0,
      },
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
