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

import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import BottomNav from "@/components/ui/BottomNav"
import { useChatNotificationSound } from "@/hooks/useChatNotificationSound"
import CuentaSuspendida from "@/components/auth/CuentaSuspendida"
import { alMarcarLeidos } from "@/lib/mensajesNoLeidos"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [noLeidos, setNoLeidos] = useState(0)
  // Identificador del negocio del dueño, para que "Mi negocio" de la barra
  // vaya DIRECTO a gestionarlo. Antes el botón apuntaba a la lista, que al
  // cargar redirigía a la gestión: funcionaba, pero se veía el salto.
  const [negocioId, setNegocioId] = useState<string | null>(null)

  const isCompany = (user?.user_metadata?.role ?? "person") === "company"

  /* Suspensión.
     Se consulta acá y no en cada pantalla por el mismo motivo que la barra
     inferior: si depende de que cada página se acuerde, alguna se olvida — y
     la que se olvide es un agujero por el que la persona suspendida sigue
     operando. Este layout envuelve todo el panel.

     Esto es la CORTESÍA, no el candado. Lo que de verdad impide escribir son
     las políticas restrictivas de la base (suspension_efectiva.sql) más la
     comprobación de la ruta del chat. Si alguien se saltara esta pantalla, no
     conseguiría escribir nada igualmente. */
  const [suspension, setSuspension] = useState<{ desde: string; motivo: string | null } | null>(null)

  useEffect(() => {
    if (!user) {
      setSuspension(null)
      return
    }
    let vivo = true
    ;(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("suspended_at, suspended_reason")
        .eq("id", user.id)
        .maybeSingle()

      if (!vivo) return
      const desde = (data as any)?.suspended_at ?? null
      setSuspension(desde ? { desde, motivo: (data as any)?.suspended_reason ?? null } : null)
    })()
    return () => {
      vivo = false
    }
  }, [user])

  /* El sonido del chat estaba construido —hook, mp3 precargado, manejo de
     errores— pero ningún archivo llamaba al hook, así que no sonaba nunca.
     Va acá y no en la pantalla de chat porque el aviso sirve justamente
     cuando NO estás mirando el chat, y este layout envuelve todo el panel. */
  const { playSound, enableSound } = useChatNotificationSound()

  // El conteo anterior. Arranca en null para que la primera medición no
  // suene: al abrir la app con mensajes pendientes no hay nada nuevo que
  // anunciar, sólo pendiente de antes.
  const noLeidosPrevios = useRef<number | null>(null)

  useEffect(() => {
    const previo = noLeidosPrevios.current
    noLeidosPrevios.current = noLeidos
    if (previo !== null && noLeidos > previo) {
      playSound()
    }
  }, [noLeidos, playSound])

  /* Safari y iOS bloquean el audio hasta que la persona interactúa con la
     página. Se desbloquea en el primer toque, sea cual sea, y el listener se
     retira solo. Sin esto el primer sonido fallaría con NotAllowedError. */
  useEffect(() => {
    const desbloquear = () => {
      enableSound()
      window.removeEventListener("pointerdown", desbloquear)
    }
    window.addEventListener("pointerdown", desbloquear, { once: true })
    return () => window.removeEventListener("pointerdown", desbloquear)
  }, [enableSound])

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

        // Con un negocio por cuenta, el primero es "su" negocio.
        setNegocioId(negocios?.[0]?.id ?? null)

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
        setNegocioId(null)
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

  /* Tiempo real, con el sondeo detrás como red.
     Antes esto era sólo un setInterval de 30 segundos: bastaba para un badge,
     pero un aviso sonoro que llega medio minuto tarde se siente roto.

     Se escucha `conversations` y no `messages` por dos razones. Se puede
     filtrar por usuario o por negocio, así que cada persona recibe únicamente
     lo suyo y no se gasta cuota en conversaciones ajenas —Realtime cuenta por
     mensaje recibido—. Y basta con una conexión, en vez de una por
     conversación abierta.

     Funciona porque insertar un mensaje modifica esa fila: dos triggers mueven
     last_message_at y suben el contador de no leídos. El código que envía no
     toca la conversación, así que todo depende de ellos; van asegurados en
     scripts/chat-tiempo-real.sql.

     El intervalo se queda, pero cada dos minutos en vez de cada treinta
     segundos: si la conexión se cae o un aviso se pierde, el contador se
     corrige solo sin que nadie lo note. */
  useEffect(() => {
    contarNoLeidos()

    /* Aviso directo desde la pantalla de chat, sin pasar por la base.
       Es el camino que hace que el globo se apague EN EL ACTO al leer. Los
       otros dos —Realtime y el sondeo de abajo— siguen ahí porque cubren lo
       que éste no ve: un mensaje que llega mientras miras, o uno leído desde
       otro dispositivo. */
    const dejarDeEscuchar = alMarcarLeidos(contarNoLeidos)

    const intervalo = setInterval(contarNoLeidos, 120000)

    return () => {
      clearInterval(intervalo)
      // Sin esto se acumularía una escucha por cada vez que el efecto se
      // rehace, y el conteo se dispararía varias veces por un solo aviso.
      dejarDeEscuchar()
    }
  }, [contarNoLeidos])

  useEffect(() => {
    if (!user) return

    const filtro = isCompany
      ? negocioId
        ? `business_id=eq.${negocioId}`
        : null
      : `user_id=eq.${user.id}`

    // Un dueño sin negocio todavía no tiene conversaciones que escuchar.
    if (!filtro) return

    const canal = supabase
      .channel(`no_leidos_${isCompany ? negocioId : user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: filtro },
        () => contarNoLeidos()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [user, isCompany, negocioId, contarNoLeidos])

  /* Sin barra inferior ni contador: no hay a dónde navegar dentro del panel
     hasta que se levante la suspensión. */
  if (suspension) {
    return <CuentaSuspendida motivo={suspension.motivo} desde={suspension.desde} />
  }

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
          miNegocioHref={
            negocioId ? `/app/dashboard/negocios/${negocioId}/gestionar` : undefined
          }
        />
      )}
    </>
  )
}
