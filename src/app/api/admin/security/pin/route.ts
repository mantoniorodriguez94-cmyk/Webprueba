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
    const expected = process.env.ADMIN_MASTER_PIN

    if (!expected) {
      return NextResponse.json(
        { success: false, error: "ADMIN_MASTER_PIN no está configurado en el entorno." },
        { status: 500 }
      )
    }

    if (!pin || pin !== expected) {
      return NextResponse.json(
        { success: false, error: "PIN maestro inválido." },
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

