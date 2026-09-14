"use client"

import { trackBusinessInteraction } from "@/lib/analytics"
import { supabase } from "@/lib/supabaseClient"

/**
 * Un enlace de contacto de la página pública que registra el clic.
 *
 * La página pública es un componente de servidor y sus enlaces de teléfono y
 * WhatsApp no registraban nada: sólo se contaban los clics dados dentro de la
 * app. Eso dejaba sin datos justo la página que Google indexa y la que se abre
 * cuando alguien comparte el negocio por WhatsApp.
 *
 * Importa para algo más que las estadísticas: el argumento con el que se le
 * ofrece su ficha al dueño de un negocio sembrado es "lleva 340 visitas y 12
 * clics a tu teléfono este mes". Sin este registro ese número no existe.
 */
export default function EnlaceContacto({
  businessId,
  tipo,
  href,
  externo = false,
  className,
  children,
}: {
  businessId: string
  tipo: "phone" | "whatsapp"
  href: string
  externo?: boolean
  className?: string
  children: React.ReactNode
}) {
  const registrar = async () => {
    // Sin await ni bloqueo: el clic debe abrir el marcador o WhatsApp de
    // inmediato. Si el registro falla, se pierde un dato, no la llamada.
    try {
      const { data } = await supabase.auth.getUser()
      trackBusinessInteraction(businessId, tipo, data.user?.id ?? null)
    } catch {
      /* que no se registre no puede impedir contactar al negocio */
    }
  }

  return (
    <a
      href={href}
      onClick={registrar}
      className={className}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  )
}
