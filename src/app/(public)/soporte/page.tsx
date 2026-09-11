"use client"

/**
 * Formulario de soporte.
 *
 * No existía ningún canal de contacto en toda la app, y sin embargo dos
 * pantallas le decían al usuario "Contacta a soporte" sin decirle cómo.
 * Vive fuera del área con sesión a propósito: quien no puede entrar a su
 * cuenta es justamente quien más necesita escribir.
 */

import { useState } from "react"
import Link from "next/link"
import useUser from "@/hooks/useUser"
import useMembershipAccess from "@/hooks/useMembershipAccess"

type Estado = "escribiendo" | "enviando" | "enviado"

export default function SoportePage() {
  const { user } = useUser()
  const { tier } = useMembershipAccess()

  const [estado, setEstado] = useState<Estado>("escribiendo")
  const [error, setError] = useState<string | null>(null)
  const [datos, setDatos] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const cambiar = (campo: keyof typeof datos) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDatos((prev) => ({ ...prev, [campo]: e.target.value }))

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setEstado("enviando")

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...datos,
          userId: user?.id ?? null,
          planTier: typeof tier === "number" ? tier : null,
        }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(json?.error ?? "No pudimos enviar tu mensaje. Intenta de nuevo.")
        setEstado("escribiendo")
        return
      }
      setEstado("enviado")
    } catch {
      setError("No pudimos conectar. Revisa tu conexión e intenta de nuevo.")
      setEstado("escribiendo")
    }
  }

  return (
    <div>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {estado === "enviado" ? (
          <div className="surface rounded-3xl p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink mb-2">Mensaje recibido</h1>
            <p className="text-ink-2 mb-6">
              Te respondemos al correo que dejaste. Si tu consulta es sobre un pago, incluye el
              comprobante en la respuesta para resolverlo más rápido.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-600"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold text-ink mb-2">¿Necesitas ayuda?</h1>
            <p className="text-ink-2 mb-8">
              Escríbenos y te respondemos por correo. Cuéntanos con el mayor detalle posible:
              qué intentabas hacer y qué pasó.
            </p>

            <form onSubmit={enviar} className="surface rounded-3xl p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink">Tu nombre</span>
                  <input
                    required
                    maxLength={80}
                    value={datos.name}
                    onChange={cambiar("name")}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink">Tu correo</span>
                  <input
                    required
                    type="email"
                    maxLength={160}
                    value={datos.email}
                    onChange={cambiar("email")}
                    placeholder="tu@email.com"
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-400"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Asunto</span>
                <input
                  required
                  maxLength={120}
                  value={datos.subject}
                  onChange={cambiar("subject")}
                  placeholder="Ej: No se activó mi plan después de pagar"
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-400"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Tu mensaje</span>
                <textarea
                  required
                  rows={6}
                  maxLength={4000}
                  value={datos.message}
                  onChange={cambiar("message")}
                  className="w-full resize-y rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-400"
                />
              </label>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={estado === "enviando"}
                className="w-full rounded-2xl bg-blue-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-60"
              >
                {estado === "enviando" ? "Enviando…" : "Enviar mensaje"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-ink-2">
              También puedes escribirnos directamente a{" "}
              <a href="mailto:contacto@appencuentra.com" className="font-semibold text-blue-600 hover:underline">
                contacto@appencuentra.com
              </a>
            </p>
          </>
        )}
      </main>
    </div>
  )
}
