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
    const { pin } = body as { pin?: string }

    // Support both variable names: ADMIN_SETUP_KEY (Vercel/production) and
    // ADMIN_MASTER_PIN (legacy / local dev fallback)
    const expected = process.env.ADMIN_SETUP_KEY ?? process.env.ADMIN_MASTER_PIN

    if (!expected) {
      console.error(
        "[admin/security/pin] Ninguna variable de PIN está definida. " +
        "Configura ADMIN_SETUP_KEY (producción) o ADMIN_MASTER_PIN (desarrollo)."
      )
      return NextResponse.json(
        {
          success: false,
          error:
            "Error de configuración: PIN del servidor no encontrado. " +
            "Configura ADMIN_SETUP_KEY en las variables de entorno.",
        },
        { status: 500 }
      )
    }

    // Trim both sides before comparing to avoid hidden whitespace in env values
    const pinInput = String(pin ?? "").trim()
    const pinExpected = String(expected).trim()

    if (!pinInput || pinInput !== pinExpected) {
      return NextResponse.json(
        { success: false, error: "PIN incorrecto. Acceso denegado." },
        { status: 401 }
      )
    }

    const res = NextResponse.json(
      { success: true },
      { status: 200 }
    )

    // Cookie de 5 minutos: ventana de autorización corta
    // Path "/" para que esté disponible tanto en /app/admin como en /api/admin/**
    res.cookies.set("admin_master_ok", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 5 * 60,
      path: "/",
    })

    return res
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Error interno" },
      { status: 500 }
    )
  }
}

