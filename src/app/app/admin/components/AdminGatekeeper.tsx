"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield } from "lucide-react"
import { toast } from "sonner"

export default function AdminGatekeeper() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/security/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        toast.error("Acceso denegado", {
          description: data.error || "La clave de acceso es incorrecta.",
        })
        return
      }
      toast.success("Autorización exitosa", {
        description: "Bienvenido al panel administrativo.",
      })
      setPassword("")
      router.refresh()
    } catch {
      toast.error("Acceso denegado", {
        description: "No se pudo verificar la clave. Intenta nuevamente.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950/90 backdrop-blur-xl px-4">
      <div className="max-w-sm w-full rounded-3xl border border-white/15 bg-black/60 p-6 shadow-2xl">
        <div className="flex flex-col items-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-lg font-semibold text-white text-center">
            Área Restringida
          </h1>
          <p className="mt-1 text-xs text-gray-400 text-center">
            Ingrese la clave de acceso para Portal Encuentra LLC.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Clave de acceso
            </label>
            <input
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-black/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full inline-flex items-center justify-center rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verificando..." : "Acceder al Panel"}
          </button>
        </form>
      </div>
    </div>
  )
}

