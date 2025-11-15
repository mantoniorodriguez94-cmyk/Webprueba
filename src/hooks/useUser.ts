// src/hooks/useUser.ts
"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Session, User } from "@supabase/supabase-js"

export default function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let mounted = true

    const getUser = async () => {
      setLoading(true)
      const {
        data: { user: currentUser },
        error
      } = await supabase.auth.getUser()
      if (mounted) {
        setUser(currentUser ?? null)
        setLoading(false)
      }
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}
