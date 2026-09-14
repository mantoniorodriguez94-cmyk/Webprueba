"use client"

import { useEffect, useRef } from "react"
import { trackBusinessView } from "@/lib/analytics"
import { supabase } from "@/lib/supabaseClient"

/**
 * Registra una vista de negocio desde la página pública.
 *
 * Existe porque esa página es un componente de servidor y hasta ahora no
 * contaba nada: `trackBusinessView` sólo se llamaba desde la ficha de dentro
 * de la app. Un negocio podía compartir su enlace, recibir cincuenta visitas
 * desde WhatsApp y ver un cero en sus estadísticas — que es justamente el
 * número que le estamos pidiendo que pague por ver.
 *
 * Va en el cliente y no en el servidor a propósito: en el servidor cada
 * petición cuenta, incluidas las de Googlebot y las precargas del navegador,
 * y el dueño acabaría viendo visitas que nunca fueron personas.
 */
export default function RegistrarVista({ businessId }: { businessId: string }) {
  // React monta dos veces en desarrollo con StrictMode; sin esto la vista se
  // registraría por duplicado cada recarga local.
  const yaRegistrada = useRef(false)

  useEffect(() => {
    if (!businessId || yaRegistrada.current) return
    yaRegistrada.current = true

    const registrar = async () => {
      const { data } = await supabase.auth.getUser()
      await trackBusinessView(businessId, data.user?.id ?? null)
    }

    registrar()
  }, [businessId])

  return null
}
