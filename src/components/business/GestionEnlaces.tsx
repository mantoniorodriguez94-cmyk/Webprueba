"use client"

/**
 * Los cuatro enlaces del negocio, configurables uno por uno desde su ficha.
 *
 * El dueño ve SIEMPRE los cuatro botones, tenga o no tenga cada enlace puesto:
 * los que faltan salen apagados y con un "Añadir", que es lo que le dice que
 * eso existe y se puede rellenar. Un formulario con cuatro campos vacíos no
 * cuenta esa historia igual de bien, y además obliga a guardar la pantalla
 * entera para tocar una sola cosa.
 *
 * El público es al revés: ahí sólo aparecen los que están puestos. Un botón de
 * Instagram apagado en una ficha pública no informa de nada, sólo ocupa sitio
 * y hace parecer al negocio incompleto. Eso lo resuelve EnlacesDelNegocio, que
 * filtra por enlace existente.
 *
 * Cada diálogo escribe UNA columna. Es deliberado: la pantalla de editar ya
 * dejó escrito el criterio —"una consulta sólo debe escribir lo que su
 * pantalla gobierna"— después de que mandar campos vacíos borrara la
 * ubicación de los negocios sin querer.
 */

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { claseBoton } from "@/lib/ui/botones"
import { Dialog } from "@/components/ui/Overlay"
import {
  REDES,
  dominioVisible,
  etiquetaDeRed,
  normalizarRed,
  normalizarWeb,
  type RedSocial,
} from "@/lib/negocios/enlaces"

type Clave = "website" | RedSocial

const CAMPOS: { clave: Clave; etiqueta: string; ejemplo: string; ayuda: string }[] = [
  {
    clave: "website",
    etiqueta: "Sitio web",
    ejemplo: "minegocio.com",
    ayuda: "La dirección de tu página. No hace falta escribir https://.",
  },
  {
    clave: "facebook",
    etiqueta: "Facebook",
    ejemplo: "@minegocio",
    ayuda: "Tu usuario, o la dirección completa de tu página de Facebook.",
  },
  {
    clave: "instagram",
    etiqueta: "Instagram",
    ejemplo: "@minegocio",
    ayuda: "Tu usuario, o la dirección completa de tu perfil.",
  },
  {
    clave: "tiktok",
    etiqueta: "TikTok",
    ejemplo: "@minegocio",
    ayuda: "Tu usuario, o la dirección completa de tu perfil.",
  },
]

function normalizar(clave: Clave, valor: string): string | null {
  return clave === "website" ? normalizarWeb(valor) : normalizarRed(clave, valor)
}

/** Lo que se lee en el botón cuando el enlace está puesto. */
function resumen(clave: Clave, url: string): string {
  return clave === "website" ? dominioVisible(url) : etiquetaDeRed(clave, url)
}

export interface GestionEnlacesProps {
  businessId: string
  valores: Record<Clave, string | null>
  /** Para que la pantalla de arriba refleje el cambio sin recargar. */
  alGuardar: (clave: Clave, url: string | null) => void
}

export default function GestionEnlaces({ businessId, valores, alGuardar }: GestionEnlacesProps) {
  const [abierto, setAbierto] = useState<Clave | null>(null)
  const [texto, setTexto] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const campo = CAMPOS.find((c) => c.clave === abierto)

  const abrir = (clave: Clave) => {
    setAbierto(clave)
    setTexto(valores[clave] ?? "")
    setError(null)
  }

  const cerrar = () => {
    setAbierto(null)
    setError(null)
  }

  const escribir = async (clave: Clave, url: string | null) => {
    setGuardando(true)
    const { error: errorBase } = await supabase
      .from("businesses")
      .update({ [clave]: url } as never)
      .eq("id", businessId)
    setGuardando(false)

    if (errorBase) {
      setError("No se pudo guardar. Intentá de nuevo.")
      return
    }

    alGuardar(clave, url)
    cerrar()
  }

  const guardar = async () => {
    if (!abierto) return

    // Vacío significa quitar el enlace, y es una acción legítima.
    if (!texto.trim()) {
      await escribir(abierto, null)
      return
    }

    const url = normalizar(abierto, texto)
    if (!url) {
      setError(
        "No se entiende esa dirección. Escribí tu usuario, o la dirección completa del perfil."
      )
      return
    }

    await escribir(abierto, url)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {CAMPOS.map(({ clave, etiqueta }) => {
          const url = valores[clave]
          return (
            <button
              key={clave}
              type="button"
              onClick={() => abrir(clave)}
              aria-label={url ? `Editar ${etiqueta}` : `Añadir ${etiqueta}`}
              className={
                url
                  ? claseBoton("secundario", "compacto")
                  : claseBoton(
                      "secundario",
                      "compacto",
                      "border border-dashed border-black/20 dark:border-white/20 opacity-70"
                    )
              }
            >
              <span className="font-semibold">{etiqueta}</span>
              <span className="text-ink-2 font-normal">
                {url ? resumen(clave, url) : "Añadir"}
              </span>
            </button>
          )
        })}
      </div>

      <Dialog open={Boolean(abierto)} onClose={cerrar} aria-label={campo?.etiqueta}>
        {campo && (
          <>
            <h3 className="text-lg font-bold text-ink">{campo.etiqueta}</h3>
            <p className="mt-1 text-sm text-ink-2">{campo.ayuda}</p>

            <input
              autoFocus
              type="text"
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value)
                setError(null)
              }}
              placeholder={campo.ejemplo}
              disabled={guardando}
              className="mt-4 w-full rounded-2xl border-2 border-black/15 bg-white px-4 py-3 text-ink focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            />

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <p className="mt-2 text-xs text-ink-2">
              Sólo aparece en tu ficha pública si lo completás. Dejalo vacío para quitarlo.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className={claseBoton("primario", "compacto", "flex-1 disabled:opacity-60")}
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={cerrar}
                disabled={guardando}
                className={claseBoton("secundario", "compacto")}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </Dialog>
    </>
  )
}
