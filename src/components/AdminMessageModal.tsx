"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"

/**
 * Shows a modal when the logged-in user has show_admin_modal = true and admin_message set.
 * "Entendido" dismisses by setting show_admin_modal = false via API.
 */
export default function AdminMessageModal() {
  const { user } = useUser()
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissing, setDismissing] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      setMessage(null)
      setLoading(false)
      return
    }
    let mounted = true
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("show_admin_modal, admin_message")
          .eq("id", user.id)
          .single()
        if (!mounted) return
        if (!error && data?.show_admin_modal && data?.admin_message) {
          setMessage(data.admin_message)
        } else {
          setMessage(null)
        }
      } catch {
        if (mounted) setMessage(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user?.id])

  const dismiss = async () => {
    if (!user?.id) return
    setDismissing(true)
    try {
      const res = await fetch("/api/admin/profile-notification-dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: user.id }),
      })
      const data = await res.json()
      if (data.success) setMessage(null)
    } finally {
      setDismissing(false)
    }
  }

  if (loading || !message) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-900 border-2 border-amber-500/50 rounded-2xl max-w-md w-full shadow-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-amber-400 font-semibold">Mensaje del equipo</span>
        </div>
        <p className="text-white whitespace-pre-wrap text-sm mb-6">{message}</p>
        <button
          type="button"
          onClick={dismiss}
          disabled={dismissing}
          className="w-full py-3 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/50 font-medium hover:bg-amber-500/30 disabled:opacity-50"
        >
          {dismissing ? "Cerrando..." : "Entendido"}
        </button>
      </div>
    </div>
  )
}
