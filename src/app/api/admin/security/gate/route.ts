import { NextRequest, NextResponse } from "next/server"
import { checkAdminAuth } from "@/utils/admin-auth"

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await checkAdminAuth()
    if (authError || !user?.isAdmin) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { password } = body as { password?: string }
    const expected = process.env.ADMIN_PANEL_PASSWORD

    if (!expected) {
      return NextResponse.json(
        { success: false, error: "ADMIN_PANEL_PASSWORD no está configurado en el entorno." },
        { status: 500 }
      )
    }

    if (!password || password !== expected) {
      return NextResponse.json(
        { success: false, error: "Clave de acceso inválida." },
        { status: 401 }
      )
    }

    const res = NextResponse.json(
      { success: true },
      { status: 200 }
    )

    // Cookie de sesión: válido durante la sesión del navegador (sin maxAge)
    res.cookies.set("admin_gate_ok", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/app/admin",
    })

    return res
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno" },
      { status: 500 }
    )
  }
}

