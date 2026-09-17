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
 * ── PERO SIGUE HABIENDO SALIDA PARA QUIEN NO ESTÁ EN EL LOCAL ───────────────
 *
 * Esto importa y ya costó caro: la versión original tenía los campos manuales
 * en `type="hidden"`, así que el ÚNICO camino era el GPS del momento. Quien
 * daba de alta desde su casa no podía poner la ubicación de su negocio, y por
 * eso los cuatro negocios que hubo en producción tenían latitude y longitude
 * en null. No es que nadie quisiera salir en el mapa: es que casi nadie podía.
 *
 * La salida secundaria tampoco habla de coordenadas: se pega el enlace de
 * Google Maps del local, que es algo que la gente sí sabe hacer. Los números
 * se sacan del enlace y no se le enseñan a nadie.
 */

import { useEffect, useState } from "react"
import { Dialog } from "@/components/ui/Overlay"
import { puntoDesdeEnlace, esEnlaceCorto } from "@/lib/enlaceMapa"

type Paso = "inicio" | "enlace" | "listo"

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
  const [enlace, setEnlace] = useState("")
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState("")
  /* Sólo para dibujar el mapita de confirmación. Nunca se muestra como texto. */
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!open) return
    setPaso("inicio")
    setEnlace("")
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
      setError("Tu navegador no puede leer la ubicación. Prueba con el enlace del mapa.")
      setPaso("enlace")
      return
    }
    setOcupado(true)
    setError("")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void guardar(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        /* Denegado o fuera de cobertura. No es un callejón sin salida: se
           empuja a la otra puerta en vez de dejar a la persona mirando un
           error que no sabe resolver. */
        setOcupado(false)
        setError("No pudimos leer tu ubicación. Puedes indicarla con el enlace del mapa.")
        setPaso("enlace")
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    )
  }

  const guardarDesdeEnlace = () => {
    const p = puntoDesdeEnlace(enlace)
    if (p) {
      void guardar(p.latitud, p.longitud)
      return
    }
    setError(
      esEnlaceCorto(enlace)
        ? "Ese enlace corto no dice dónde está. Ábrelo en Google Maps y copia el enlace de la barra de direcciones."
        : "No reconocimos ese enlace. Tiene que ser un enlace de Google Maps de tu local."
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
      panelClassName="bg-white border border-black/10 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
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
              setPaso("enlace")
            }}
            className="mt-6 w-full text-sm text-ink-2 hover:text-ink underline underline-offset-4 transition-colors"
          >
            No estoy en mi negocio ahora
          </button>
        </>
      )}

      {/* ── La salida: pegar el enlace del mapa ─────────────────────────── */}
      {paso === "enlace" && (
        <>
          <p className="text-sm text-ink-2 mb-4">
            Busca tu local en Google Maps y pega aquí el enlace. Nosotros
            encontramos el punto.
          </p>

          <input
            type="url"
            inputMode="url"
            autoFocus
            value={enlace}
            onChange={(e) => {
              setEnlace(e.target.value)
              setError("")
            }}
            placeholder="Pega aquí el enlace de Google Maps"
            disabled={ocupado}
            className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
          />

          <p className="text-xs text-ink-2 mt-2">
            En Google Maps: busca tu local, pulsa «Compartir» y luego «Copiar
            vínculo».
          </p>

          <Aviso />

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={guardarDesdeEnlace}
              disabled={ocupado || !enlace.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-2xl transition-all"
            >
              {ocupado ? "Guardando…" : "Guardar ubicación"}
            </button>
            <button
              type="button"
              onClick={() => {
                setError("")
                setPaso("inicio")
              }}
              disabled={ocupado}
              className="px-6 py-3 bg-black/5 hover:bg-black/10 disabled:opacity-60 text-ink font-semibold rounded-2xl transition-all"
            >
              Atrás
            </button>
          </div>
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

          {/* El precio de guardar de un toque: si el GPS erró, hay que poder
              deshacerlo sin salir y volver a entrar. */}
          <button
            type="button"
            onClick={() => {
              setError("")
              setEnlace("")
              setPaso("enlace")
            }}
            className="mt-3 w-full text-sm text-ink-2 hover:text-ink underline underline-offset-4 transition-colors"
          >
            No es aquí — corregir
          </button>
        </>
      )}
    </Dialog>
  )
}
