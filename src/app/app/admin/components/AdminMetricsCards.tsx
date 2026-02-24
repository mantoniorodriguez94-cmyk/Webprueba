"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Metrics = {
  users: number
  businesses: number
  premium: number
  pendingPayments: number
  expiring: number
  featured: number
}

const REFRESH_MS = 30_000

export default function AdminMetricsCards() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch("/api/admin/metrics")
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Error")
        setMetrics(data.data)
        setError(null)
      } catch (e: unknown) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, REFRESH_MS)
    return () => clearInterval(interval)
  }, [])

  if (loading && !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-6 animate-pulse">
            <div className="h-4 w-24 bg-white/10 rounded mb-2" />
            <div className="h-8 w-16 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (error && !metrics) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
        Error al cargar métricas: {error}
      </div>
    )
  }

  const m = metrics!

  const cards: { title: string; value: number; iconBg: string; href: string }[] = [
    { title: "Usuarios Registrados", value: m.users, iconBg: "bg-blue-500/20", href: "/app/admin/usuarios" },
    { title: "Negocios", value: m.businesses, iconBg: "bg-green-500/20", href: "/app/admin/negocios" },
    { title: "Negocios Premium", value: m.premium, iconBg: "bg-yellow-500/20", href: "/app/admin/negocios?filter=premium" },
    { title: "Pagos Pendientes", value: m.pendingPayments, iconBg: "bg-orange-500/20", href: "/app/admin/pagos" },
    { title: "Suscripciones por Expirar", value: m.expiring, iconBg: "bg-red-500/20", href: "/app/admin/pagos" },
    { title: "Negocios Destacados", value: m.featured, iconBg: "bg-purple-500/20", href: "/app/admin/destacados" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((c) => (
        <Link
          key={c.title}
          href={c.href}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{c.title}</p>
              <p className="text-3xl font-bold text-white">{c.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
