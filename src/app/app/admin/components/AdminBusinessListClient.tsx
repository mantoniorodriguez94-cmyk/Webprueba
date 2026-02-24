"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Search } from "lucide-react"
import AdminQuickActions, { AdminBusinessRow } from "./AdminQuickActions"

interface AdminBusinessListClientProps {
  businesses: AdminBusinessRow[]
}

export default function AdminBusinessListClient({ businesses }: AdminBusinessListClientProps) {
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return businesses
    return businesses.filter((b) => {
      const name = (b.name || "").toLowerCase()
      const id = (b.id || "").toLowerCase()
      return name.includes(term) || id.includes(term)
    })
  }, [businesses, search])

  const handleToggle = (id: string) => {
    setExpandedId((current) => (current === id ? null : id))
  }

  const getDaysUntilExpiry = (premiumUntil: string | null) => {
    if (!premiumUntil) return null
    const expiry = new Date(premiumUntil)
    const now = new Date()
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar negocios por nombre o ID..."
          className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No hay negocios que coincidan con la búsqueda</p>
          <p className="text-sm">Ajusta el término de búsqueda o filtros.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => {
            const isOpen = expandedId === b.id
            const daysLeft = getDaysUntilExpiry(b.premium_until)
            const businessName = b.name || "Negocio"

            return (
              <div key={b.id} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                {/* Header row */}
                <button
                  type="button"
                  onClick={() => handleToggle(b.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition-colors"
                >
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
                      {b.logo_url ? (
                        <Image
                          src={b.logo_url}
                          width={40}
                          height={40}
                          alt={businessName}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <span className="text-blue-400 text-lg font-bold">
                          {businessName[0]?.toUpperCase() || "N"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{businessName}</p>
                      <p className="text-[11px] text-gray-400 truncate">
                        ID: <span className="font-mono text-gray-300">{b.id.slice(0, 8)}...</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {b.is_premium && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                          Premium
                        </span>
                      )}
                      {b.is_verified && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/40">
                          Verificado
                        </span>
                      )}
                      {daysLeft !== null && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            daysLeft <= 7
                              ? "bg-red-500/10 text-red-300 border-red-500/40"
                              : daysLeft <= 30
                              ? "bg-yellow-500/10 text-yellow-200 border-yellow-500/40"
                              : "bg-emerald-500/10 text-emerald-200 border-emerald-500/40"
                          }`}
                        >
                          {daysLeft <= 0 ? "Expirado" : `${daysLeft} días`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <div className="flex-shrink-0 pl-1">
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden border-t border-white/10 bg-black/40"
                    >
                      <div className="px-3 pb-3 pt-2">
                        {/* On mobile, we want big tap targets: AdminQuickActions already uses compact rows/buttons */}
                        <AdminQuickActions business={b} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

