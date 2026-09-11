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
    <div className="min-h-screen text-ink">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Referidos</h1>
        <p className="text-ink-2 text-sm">
          Usuarios que han invitado a otros. Otorga 1 mes gratis cuando alcancen 3 invitados válidos (plan de pago).
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-ink-2">Cargando...</div>
      ) : referrers.length === 0 ? (
        <div className="text-center py-12 text-ink-2">
          <p className="text-lg mb-2">No hay datos de referidos</p>
          <p className="text-sm">Los referidos aparecerán cuando los usuarios inviten a otros con su enlace.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/8">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.02] border-b border-black/8">
              <tr>
                <th className="p-4 font-semibold text-ink-2">Usuario</th>
                <th className="p-4 font-semibold text-ink-2">Email</th>
                <th className="p-4 font-semibold text-ink-2">Registrados</th>
                <th className="p-4 font-semibold text-ink-2">Válidos (tier ≥1)</th>
                <th className="p-4 font-semibold text-ink-2">Estado</th>
                <th className="p-4 font-semibold text-ink-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {referrers.map((r) => (
                <tr key={r.user_id} className="border-b border-black/5 hover:bg-black/[0.02]">
                  <td className="p-4">{r.full_name}</td>
                  <td className="p-4 text-ink-2">{r.email}</td>
                  <td className="p-4">{r.referred_count}</td>
                  <td className="p-4">{r.qualified_count} / 3</td>
                  <td className="p-4">
                    {r.claimed ? (
                      <span className="text-green-700">Recompensa otorgada</span>
                    ) : r.qualified_count >= 3 ? (
                      <span className="text-amber-700">Elegible</span>
                    ) : (
                      <span className="text-ink-2/70">Pendiente</span>
                    )}
                  </td>
                  <td className="p-4">
                    {r.claimed ? (
                      <span className="text-ink-2/70 text-xs">—</span>
                    ) : r.qualified_count >= 3 ? (
                      <button
                        type="button"
                        onClick={() => award(r.user_id)}
                        disabled={awardingId !== null}
                        className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium disabled:opacity-50"
                      >
                        {awardingId === r.user_id ? "Otorgando..." : "Otorgar mes gratis"}
                      </button>
                    ) : (
                      <span className="text-ink-2/70 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 p-4 rounded-xl bg-black/[0.02] border border-black/8 text-xs text-ink-2">
        <strong className="text-ink-2">Referral rewards:</strong> La tabla <code className="bg-black/5 px-1 rounded">referral_rewards</code> (id, user_id, created_at) guarda quién ya recibió el mes gratis. Si no existe, créala en Supabase; el botón &quot;Otorgar mes gratis&quot; igual extiende el premium del primer negocio del referidor 30 días.
      </div>
    </div>
  )
}
