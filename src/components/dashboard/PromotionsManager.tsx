"use client"

import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import { Sparkles, Plus, Lock, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Promotion {
  id: string
  title: string
  description: string | null
  active: boolean
  created_at: string
}

export default function PromotionsManager() {
  const { user } = useUser()
  const router = useRouter()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const [subscriptionTier, setSubscriptionTier] = useState<number>(0)
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null)

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("subscription_tier, subscription_end_date")
          .eq("id", user.id)
          .single()

        if (!error && data) {
          setSubscriptionTier(data.subscription_tier ?? 0)
          setSubscriptionEndDate(data.subscription_end_date ?? null)
        }
      } catch (err) {
        console.error("[promotions] Error cargando suscripción:", err)
      }
    }

    loadSubscription()
  }, [user])

  const isFounder = subscriptionTier >= 3
  const hasActiveSubscription =
    isFounder &&
    subscriptionEndDate !== null &&
    new Date(subscriptionEndDate) > new Date()

  useEffect(() => {
    const loadPromotions = async () => {
      if (!user || !hasActiveSubscription) return
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("business_promotions")
          .select("id, title, description, active, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[promotions] Error cargando promociones:", error)
          return
        }

        setPromotions((data as Promotion[]) || [])
      } finally {
        setLoading(false)
      }
    }

    loadPromotions()
  }, [user, hasActiveSubscription])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !hasActiveSubscription) return
    if (!title.trim()) {
      toast.error("Error en la promoción", {
        description: "El título es obligatorio.",
      })
      return
    }

    try {
      setCreating(true)
      const { data, error } = await supabase
        .from("business_promotions")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          active: true
        })
        .select("id, title, description, active, created_at")
        .single()

      if (error) {
        console.error("[promotions] Error creando promoción:", error)
        toast.error("Error en la promoción", {
          description: error.message || "Error al crear la promoción.",
        })
        return
      }

      if (data) {
        setPromotions((prev) => [data as Promotion, ...prev])
        setTitle("")
        setDescription("")
      }
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (promotion: Promotion) => {
    if (!user || !hasActiveSubscription) return
    try {
      const { error } = await supabase
        .from("business_promotions")
        .update({ active: !promotion.active })
        .eq("id", promotion.id)

      if (error) {
        console.error("[promotions] Error actualizando promoción:", error)
        toast.error("Error en la promoción", {
          description: "No se pudo actualizar la promoción.",
        })
        return
      }

      setPromotions((prev) =>
        prev.map((p) =>
          p.id === promotion.id ? { ...p, active: !promotion.active } : p
        )
      )
    } catch (err) {
      console.error("[promotions] Error en toggleActive:", err)
    }
  }

  // Estado bloqueado para usuarios que no son Fundador activo
  if (!hasActiveSubscription) {
    return (
      <div className="bg-transparent backdrop-blur-sm rounded-3xl border border-white/10 p-5 md:p-6 shadow-lg shadow-black/40 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-yellow-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Módulo de Promociones
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 text-yellow-300 text-[10px] font-semibold px-2 py-0.5">
                <Sparkles className="w-3 h-3" />
                Exclusivo Fundadores
              </span>
            </h3>
            <p className="mt-1 text-xs text-gray-300">
              🔒 Esta función es exclusiva para el plan{" "}
              <span className="font-semibold text-yellow-300">Fundador</span>.
            </p>
            <button
              type="button"
              onClick={() => router.push("/app/dashboard/membresia")}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-yellow-500 px-4 py-2 text-xs font-semibold text-yellow-950 hover:bg-yellow-400 transition-colors"
            >
              Mejorar a Fundador
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-transparent backdrop-blur-sm rounded-3xl border border-white/10 p-5 md:p-6 shadow-lg shadow-black/40 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Promociones Destacadas
            </h3>
            <p className="text-[11px] text-gray-400">
              Crea promociones especiales visibles para todos los usuarios.
            </p>
          </div>
        </div>
      </div>

      {/* Formulario de creación */}
      <form onSubmit={handleCreate} className="mb-4 space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la promoción"
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Crear
              </>
            )}
          </button>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción (opcional)"
          rows={2}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
      </form>

      {/* Lista de promociones */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando promociones...
        </div>
      ) : promotions.length === 0 ? (
        <p className="text-xs text-gray-400">
          Aún no has creado promociones. Usa el formulario de arriba para crear la primera.
        </p>
      ) : (
        <div className="space-y-2">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 px-3 py-2"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  {promo.title}
                </p>
                {promo.description && (
                  <p className="mt-1 text-xs text-gray-300">
                    {promo.description}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-gray-500">
                  Creada el{" "}
                  {new Date(promo.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit"
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleActive(promo)}
                className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors ${
                  promo.active
                    ? "border-emerald-400 text-emerald-300 bg-emerald-500/10"
                    : "border-gray-500 text-gray-300 bg-black/40"
                }`}
              >
                {promo.active ? "Activa" : "Inactiva"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


