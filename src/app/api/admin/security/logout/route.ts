import { NextRequest, NextResponse } from "next/server"

// Cierra explícitamente la sesión del panel admin:
// - Elimina admin_gate_ok (Gatekeeper)
// - Elimina admin_master_ok (PIN maestro)
export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ success: true }, { status: 200 })

  // Borrar cookie de acceso al panel (mismo path que en /security/gate)
  res.cookies.set("admin_gate_ok", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/app/admin",
    maxAge: 0,
  })

  // Borrar cookie de PIN maestro (path raíz para todos los /api/admin/**)
  res.cookies.set("admin_master_ok", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })

  return res
}

