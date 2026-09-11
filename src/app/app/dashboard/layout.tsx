"use client"

/**
 * Layout del dashboard: renderiza la barra inferior UNA sola vez para todas
 * las pantallas de la sección.
 *
 * Antes no existía este layout, así que cada página tenía que acordarse de
 * incluir <BottomNav /> por su cuenta. Cinco lo hacían y el resto no, así que
 * la barra desaparecía al entrar a "Mi negocio" o a "Plan" — el usuario perdía
 * la navegación justo en las pantallas más profundas. Centralizarlo acá hace
 * que el problema no pueda repetirse cuando se agregue una pantalla nueva.
 *
 * El contador de no leídos también se calcula acá: antes cada página lo
 * resolvía por su cuenta (o no lo mostraba), así que el badge aparecía y
 * desaparecía según dónde estuvieras.
 */

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import BottomNav from "@/components/ui/BottomNav"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [noLeidos, setNoLeidos] = useState(0)

  const isCompany = (user?.user_metadata?.role ?? "person") === "company"

  const contarNoLeidos = useCallback(async () => {
    if (!user) {
      setNoLeidos(0)
      return
    }

    try {
      let idsConversacion: string[] = []

      if (isCompany) {
        // Dueño de negocio: los mensajes que le llegan a sus negocios.
        const { data: negocios } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", user.id)

        if (!negocios?.length) {
          setNoLeidos(0)
          return
        }

        const { data: convs } = await supabase
          .from("conversations")
          .select("id")
          .in(
            "business_id",
            negocios.map((n) => n.id)
          )
        idsConversacion = (convs ?? []).map((c) => c.id)
      } else {
        // Persona: sus propias conversaciones con negocios.
        const { data: convs } = await supabase
          .from("conversations")
          .select("id")
          .eq("user_id", user.id)
        idsConversacion = (convs ?? []).map((c) => c.id)
      }

      if (!idsConversacion.length) {
        setNoLeidos(0)
        return
      }

      const { data: mensajes } = await supabase
        .from("messages")
        .select("id")
        .in("conversation_id", idsConversacion)
        .eq("is_read", false)
        .neq("sender_id", user.id)

      setNoLeidos(mensajes?.length ?? 0)
    } catch (err) {
      // El contador es informativo: si falla, la barra se muestra sin badge.
      console.warn("[dashboard] No se pudo contar mensajes sin leer:", err)
    }
  }, [user, isCompany])

  useEffect(() => {
    contarNoLeidos()
    const intervalo = setInterval(contarNoLeidos, 30000)
    return () => clearInterval(intervalo)
  }, [contarNoLeidos])

  return (
    <>
      {children}

      {/* Reserva el alto de la barra para que no tape el final del contenido.
          Vive acá y no en cada página por el mismo motivo que la barra: si
          depende de que cada pantalla se acuerde, alguna se va a olvidar. */}
      {user && <div aria-hidden="true" className="h-24 lg:hidden" />}

      {/* Sin sesión no hay a dónde navegar: las pantallas muestran el AuthGate. */}
      {user && (
        <BottomNav
          isCompany={isCompany}
          unreadCount={noLeidos}
          // Un dueño de negocio entra a la bandeja de su negocio, no a la suya
          // como cliente. Este detalle venía de la página principal y se
          // conserva al centralizar la barra.
          messagesHref={
            isCompany ? "/app/dashboard/chat?tab=negocio" : "/app/dashboard/chat"
          }
        />
      )}
    </>
  )
}
