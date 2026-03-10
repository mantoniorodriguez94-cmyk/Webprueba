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
      console.error("[admin/security/gate] ADMIN_PANEL_PASSWORD no está definido en las variables de entorno.")
      return NextResponse.json(
        { success: false, error: "Error de configuración: contraseña del servidor no encontrada. Contacta al administrador del sistema." },
        { status: 500 }
      )
    }

    // Trim both sides before comparing to avoid hidden whitespace in env values
    const passwordInput = String(password ?? "").trim()
    const passwordExpected = String(expected).trim()

    if (!passwordInput || passwordInput !== passwordExpected) {
      return NextResponse.json(
        { success: false, error: "Clave de acceso inválida. Acceso denegado." },
        { status: 401 }
      )
    }

    const res = NextResponse.json({ success: true }, { status: 200 })

    // Cookie de sesión estricta: 2 horas máximo para el acceso al panel
    res.cookies.set("admin_gate_ok", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/app/admin",
      maxAge: 60 * 60 * 2, // 2 horas en segundos
    })

    return res
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno" },
      { status: 500 }
    )
  }
}

