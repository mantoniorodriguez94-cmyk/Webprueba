"use client"

import { useEffect, useState } from "react"

type ReferrerRow = {
  user_id: string
  full_name: string
  email: string
  referred_count: number
  qualified_count: number
  claimed: boolean
}

export default function AdminReferralesPage() {
  const [referrers, setReferrers] = useState<ReferrerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [awardingId, setAwardingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/referrals/list")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cargar")
      setReferrers(data.data?.referrers ?? [])
    } catch (e: unknown) {
      setError((e as Error).message)
      setReferrers([])
    } finally {
      setLoading(false)
    }
  }

  async function award(userId: string) {
    setAwardingId(userId)
    setError(null)
    try {
      const res = await fetch("/api/admin/referrals/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al otorgar")
      await load()
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setAwardingId(null)
    }
  }

  return (
    <div className="min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Referidos</h1>
        <p className="text-gray-400 text-sm">
          Usuarios que han invitado a otros. Otorga 1 mes gratis cuando alcancen 3 invitados válidos (plan de pago).
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400">Cargando...</div>
      ) : referrers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No hay datos de referidos</p>
          <p className="text-sm">Los referidos aparecerán cuando los usuarios inviten a otros con su enlace.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4 font-semibold text-gray-200">Usuario</th>
                <th className="p-4 font-semibold text-gray-200">Email</th>
                <th className="p-4 font-semibold text-gray-200">Registrados</th>
                <th className="p-4 font-semibold text-gray-200">Válidos (tier ≥1)</th>
                <th className="p-4 font-semibold text-gray-200">Estado</th>
                <th className="p-4 font-semibold text-gray-200">Acción</th>
              </tr>
            </thead>
            <tbody>
              {referrers.map((r) => (
                <tr key={r.user_id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">{r.full_name}</td>
                  <td className="p-4 text-gray-300">{r.email}</td>
                  <td className="p-4">{r.referred_count}</td>
                  <td className="p-4">{r.qualified_count} / 3</td>
                  <td className="p-4">
                    {r.claimed ? (
                      <span className="text-green-400">Recompensa otorgada</span>
                    ) : r.qualified_count >= 3 ? (
                      <span className="text-amber-400">Elegible</span>
                    ) : (
                      <span className="text-gray-500">Pendiente</span>
                    )}
                  </td>
                  <td className="p-4">
                    {r.claimed ? (
                      <span className="text-gray-500 text-xs">—</span>
                    ) : r.qualified_count >= 3 ? (
                      <button
                        type="button"
                        onClick={() => award(r.user_id)}
                        disabled={awardingId !== null}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium disabled:opacity-50"
                      >
                        {awardingId === r.user_id ? "Otorgando..." : "Otorgar mes gratis"}
                      </button>
                    ) : (
                      <span className="text-gray-500 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400">
        <strong className="text-gray-300">Referral rewards:</strong> La tabla <code className="bg-white/10 px-1 rounded">referral_rewards</code> (id, user_id, created_at) guarda quién ya recibió el mes gratis. Si no existe, créala en Supabase; el botón &quot;Otorgar mes gratis&quot; igual extiende el premium del primer negocio del referidor 30 días.
      </div>
    </div>
  )
}
