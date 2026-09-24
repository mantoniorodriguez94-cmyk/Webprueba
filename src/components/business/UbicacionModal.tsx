"use client"

/**
 * Poner o cambiar la ubicación en el mapa de un negocio.
 *
 * ── LA REGLA DE ESTA PANTALLA: AQUÍ NADIE LEE "LATITUD" ─────────────────────
 *
 * Antes pedía dos números con seis decimales. Un panadero no tiene por qué
 * saber qué es una longitud, y pedírselo convierte una función mágica —un
 * toque y ya sales en el mapa— en un formulario técnico que se abandona.
 *
 * El botón hace TODO: pide el permiso, lee el GPS y guarda. No hay un segundo
 * paso de confirmar, porque el segundo paso es donde la gente se cae.
 *
 * ── HAY UN SOLO CAMINO, Y ES DELIBERADO ─────────────────────────────────────
 *
 * Se probó una segunda vía —pegar el enlace de Google Maps del local— y se
 * descartó por una razón de negocio, no técnica: mandar al dueño de un local a
 * Google Maps es enseñarle que ahí ya está lo que él quiere vender, y de paso
 * sacarlo de la app. Está en el historial de git por si alguna vez se
 * reconsidera.
 *
 * Lo que queda en su lugar no es una alternativa sino un AVISO: "No estoy en
 * mi negocio ahora" explica que el botón guarda donde estás parado y que
 * conviene pulsarlo dentro del local. No pide nada; devuelve al botón.
 *
 * ── LO QUE ESTE DISEÑO CUESTA, PARA QUE NADIE LO REDESCUBRA ─────────────────
 *
 * Con un solo camino, quien nunca pisa su local no puede ubicarse. Eso ya pasó
 * una vez y salió caro: la versión original tenía los campos manuales en
 * `type="hidden"`, el único camino era el GPS del momento, y los cuatro
 * negocios que hubo en producción tenían latitude y longitude en null. No es
 * que nadie quisiera salir en el mapa — es que casi nadie podía.
 *
 * La diferencia ahora es que se le DICE. Antes fallaba en silencio; ahora la
 * persona sabe qué guarda el botón y cuándo pulsarlo, y puede volver cuando
 * esté en el negocio.
 *
 * Si algún día hace falta cubrir al dueño que gestiona a distancia, la salida
 * que respeta esta decisión es un mapa con un pin arrastrable DENTRO de la
 * app, no un enlace que lleve fuera.
 */

import { useEffect, useState } from "react"
import { Dialog } from "@/components/ui/Overlay"

type Paso = "inicio" | "aviso" | "listo"

interface UbicacionModalProps {
  open: boolean
  onClose: () => void
  latitudInicial?: number | string | null
  longitudInicial?: number | string | null
  onGuardar: (latitud: number, longitud: number) => Promise<void> | void
}

export default function UbicacionModal({
  open,
  onClose,
  latitudInicial,
  longitudInicial,
  onGuardar,
}: UbicacionModalProps) {
  const yaTenia = latitudInicial != null && longitudInicial != null

  const [paso, setPaso] = useState<Paso>("inicio")
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState("")
  /* Sólo para dibujar el mapita de confirmación. Nunca se muestra como texto. */
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!open) return
    setPaso("inicio")
    setError("")
    setOcupado(false)
    setPunto(
      yaTenia ? { lat: Number(latitudInicial), lng: Number(longitudInicial) } : null
    )
  }, [open, yaTenia, latitudInicial, longitudInicial])

  /** Guarda y pasa a la pantalla de confirmación. Único camino de guardado. */
  const guardar = async (lat: number, lng: number) => {
    setOcupado(true)
    setError("")
    try {
      await onGuardar(lat, lng)
      setPunto({ lat, lng })
      setPaso("listo")
    } catch {
      setError("No se pudo guardar. Inténtalo de nuevo.")
    } finally {
      setOcupado(false)
    }
  }

  const compartirUbicacion = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no puede leer la ubicación. Prueba desde otro teléfono o navegador.")
      return
    }
    setOcupado(true)
    setError("")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void guardar(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        /* Denegado, sin cobertura o tardó demasiado. El mensaje nombra la
           causa más común —el permiso— porque "error de ubicación" a secas no
           le dice a nadie qué hacer a continuación. */
        setOcupado(false)
        setError(
          "No pudimos leer tu ubicación. Revisa que le hayas dado permiso a la app en los ajustes de tu teléfono, y vuelve a intentarlo."
        )
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    )
  }

  const Mapa = () =>
    punto ? (
      <div className="rounded-2xl overflow-hidden border border-black/10 bg-black/5">
        <iframe
          title="Tu negocio en el mapa"
          width="100%"
          height="180"
          frameBorder="0"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${punto.lng},${punto.lat},${punto.lng},${punto.lat}&layer=mapnik&marker=${punto.lat},${punto.lng}`}
          className="w-full"
        />
      </div>
    ) : null

  const Aviso = () =>
    error ? (
      <p className="mt-4 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
        {error}
      </p>
    ) : null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-label="Ubicación del negocio en el mapa"
      panelClassName="bg-white dark:bg-paper-2 border border-black/10 dark:border-white/10 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-xl font-bold text-ink">
          {paso === "listo" ? "¡Listo!" : "Ubicación en el mapa"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="p-2 -mr-2 -mt-1 hover:bg-black/5 rounded-full transition-all"
        >
          <svg className="w-6 h-6 text-ink-2 hover:text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── El camino principal ─────────────────────────────────────────── */}
      {paso === "inicio" && (
        <>
          <p className="text-sm text-ink-2 mb-6">
            {yaTenia
              ? "Tu negocio ya aparece en el mapa. Si te mudaste, vuelve a compartir tu ubicación desde el local."
              : "Con esto, quien vea tu negocio sabrá a qué distancia está de él."}
          </p>

          {yaTenia && (
            <div className="mb-6">
              <Mapa />
            </div>
          )}

          <button
            type="button"
            onClick={compartirUbicacion}
            disabled={ocupado}
            className="w-full flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold text-base py-5 px-6 rounded-2xl transition-all shadow-sm"
          >
            {ocupado ? (
              <>
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Buscándote…
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Comparte tu Ubicación Actual
              </>
            )}
          </button>

          <p className="text-xs text-ink-2 mt-3 text-center">
            Un toque estando en tu negocio. No tienes que escribir nada.
          </p>

          <Aviso />

          {/* El enlace hace dos trabajos, y el segundo es el importante.
              Es la salida para quien no está en el local — pero sobre todo es
              el AVISO de que el botón guarda donde estás parado ahora mismo.
              Sin él, alguien que dé de alta desde su casa pulsa convencido de
              que el sistema sabe dónde está su negocio, y termina publicando
              la dirección de su casa sin enterarse.

              Va en voz baja a propósito: informa sin competir con el botón. */}
          <button
            type="button"
            onClick={() => {
              setError("")
              setPaso("aviso")
            }}
            className="mt-6 w-full text-sm text-ink-2 hover:text-ink underline underline-offset-4 transition-colors"
          >
            No estoy en mi negocio ahora
          </button>
        </>
      )}

      {/* ── El aviso ────────────────────────────────────────────────────
          No es una vía alternativa: es una explicación. A propósito no manda a
          buscar el sitio en un mapa externo — mandar a un dueño a Google Maps
          es enseñarle que ahí ya está lo que él quiere vender, y de paso
          sacarlo de la app.

          Así que esta pantalla no pide nada. Sólo dice qué guarda el botón y
          cuándo conviene pulsarlo, y devuelve a la persona a él. */}
      {paso === "aviso" && (
        <>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 mb-5">
            <p className="text-sm font-semibold text-ink mb-1">
              El botón guarda el lugar donde estás en ese momento
            </p>
            <p className="text-sm text-ink-2">
              Si lo pulsas desde tu casa, tu negocio quedará marcado en tu casa.
            </p>
          </div>

          <p className="text-sm text-ink-2 mb-2">
            Para que tus clientes te encuentren bien, compártela estando dentro
            de tu negocio.
          </p>
          <p className="text-sm text-ink-2">
            No hay prisa: puedes hacerlo cuando quieras. Entra a «Mi negocio» y
            vuelve a este botón.
          </p>

          <button
            type="button"
            onClick={() => {
              setError("")
              setPaso("inicio")
            }}
            className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl transition-all"
          >
            Entendido
          </button>
        </>
      )}

      {/* ── Confirmación ────────────────────────────────────────────────── */}
      {paso === "listo" && (
        <>
          <div className="flex items-center gap-2 text-green-700 font-semibold mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Tu negocio ya aparece en el mapa
          </div>

          <Mapa />

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl transition-all"
          >
            Entendido
          </button>

          {/* El precio de guardar de un toque: si el GPS erró —o se pulsó
              desde el sitio equivocado— hay que poder rehacerlo sin cerrar y
              volver a abrir. */}
          <button
            type="button"
            onClick={() => {
              setError("")
              setPaso("inicio")
            }}
            className="mt-3 w-full text-sm text-ink-2 hover:text-ink underline underline-offset-4 transition-colors"
          >
            No es aquí — volver a intentarlo
          </button>
        </>
      )}
    </Dialog>
  )
}
