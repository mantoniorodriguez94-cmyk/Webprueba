"use client"

/**
 * Los botones de la web propia y las redes del negocio.
 *
 * Es un componente y no marcado suelto en cada ficha por lo mismo que
 * lib/ui/botones.ts es un módulo: los botones de contacto ya estuvieron
 * escritos tres veces y las tres copias derivaron por su cuenta.
 *
 * ── Por qué NO llevan los colores de cada red ───────────────────────────────
 *
 * Lo esperable sería azul Facebook, degradado Instagram, negro TikTok. Va en
 * contra de la regla que declara tailwind.config y respeta lib/ui/botones.ts:
 * un solo color saturado por pantalla, el azul, reservado a la acción
 * principal. Tres losas de color de marca al lado del CTA lo entierran, y son
 * además lo menos importante de la ficha.
 *
 * Se resuelve igual que WhatsApp, que tuvo el mismo dilema y está documentado
 * en botones.ts: "verde como acento, nunca como losa: el glifo ya lo
 * identifica". El glifo de Instagram se reconoce en blanco y negro.
 */

import { trackBusinessInteraction } from "@/lib/analytics"
import { supabase } from "@/lib/supabaseClient"
import { claseBoton } from "@/lib/ui/botones"
import {
  REDES,
  dominioVisible,
  enlaceRenderizable,
  etiquetaDeRed,
  type RedSocial,
} from "@/lib/negocios/enlaces"

const GLIFOS: Record<RedSocial | "web", React.ReactNode> = {
  web: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18a15 15 0 010-18z" />
    </svg>
  ),
  facebook: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  ),
  instagram: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.72a6.12 6.12 0 100 12.24 6.12 6.12 0 000-12.24zm0 10.1a3.98 3.98 0 110-7.96 3.98 3.98 0 010 7.96zm7.79-10.34a1.43 1.43 0 11-2.86 0 1.43 1.43 0 012.86 0z" />
    </svg>
  ),
  tiktok: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0115.54 3h-3.09v12.4a2.59 2.59 0 01-2.59 2.5 2.59 2.59 0 110-5.18c.27 0 .53.04.77.12v-3.2a5.8 5.8 0 00-.77-.05A5.79 5.79 0 1016.1 15.4V9.01a7.35 7.35 0 004.29 1.38V7.3a4.28 4.28 0 01-3.79-1.48z" />
    </svg>
  ),
}

export interface EnlacesDelNegocioProps {
  businessId: string
  website?: string | null
  facebook?: string | null
  instagram?: string | null
  tiktok?: string | null
  /** La ficha completa usa botones normales; la tarjeta de lista, compactos. */
  tamano?: "compacto" | "normal"
}

export default function EnlacesDelNegocio({
  businessId,
  website,
  facebook,
  instagram,
  tiktok,
  tamano = "normal",
}: EnlacesDelNegocioProps) {
  /* Se vuelve a validar al pintar, no sólo al guardar: estas filas pueden
     haberse escrito antes de que existiera la validación, o desde el panel. */
  const web = enlaceRenderizable(website)
  const redes = (
    [
      ["facebook", enlaceRenderizable(facebook)],
      ["instagram", enlaceRenderizable(instagram)],
      ["tiktok", enlaceRenderizable(tiktok)],
    ] as const
  ).filter((par): par is readonly [RedSocial, string] => Boolean(par[1]))

  if (!web && redes.length === 0) return null

  /* Sin await ni bloqueo: el clic debe abrir el enlace ya. Si el registro
     falla se pierde un dato, no la visita. Mismo criterio que EnlaceContacto. */
  const registrar = (tipo: "website" | RedSocial) => {
    try {
      supabase.auth
        .getUser()
        .then(({ data }) => trackBusinessInteraction(businessId, tipo, data.user?.id ?? null))
        .catch(() => {})
    } catch {
      /* que no se registre no puede impedir abrir el enlace */
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {web && (
        <a
          href={web}
          target="_blank"
          /* noopener evita que la pestaña abierta pueda manipular la nuestra
             por window.opener; noreferrer, que se filtre de dónde viene. */
          rel="noopener noreferrer nofollow"
          onClick={() => registrar("website")}
          className={claseBoton("secundario", tamano)}
        >
          {GLIFOS.web}
          {dominioVisible(web)}
        </a>
      )}

      {redes.map(([red, url]) => (
        <a
          key={red}
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={() => registrar(red)}
          aria-label={`${REDES[red].etiqueta} de este negocio`}
          className={claseBoton("secundario", tamano)}
        >
          {GLIFOS[red]}
          {etiquetaDeRed(red, url)}
        </a>
      ))}
    </div>
  )
}
