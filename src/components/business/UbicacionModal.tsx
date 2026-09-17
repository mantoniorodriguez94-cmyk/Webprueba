"use client"

/**
 * Poner o cambiar la ubicación en el mapa de un negocio.
 *
 * Antes esto vivía duplicado dentro del alta y de la edición, con dos copias
 * del mismo modal que ya habían empezado a divergir. Y las dos compartían el
 * mismo fallo de fondo: los campos para escribir las coordenadas estaban en
 * `type="hidden"`, así que el ÚNICO camino real era el botón de "usar mi
 * ubicación actual", que lee el GPS del aparato en ese momento.
 *
 * O sea: sólo podía ubicarse quien rellenara el formulario de pie dentro de su
 * local. Quien lo hacía desde casa, de noche, o a quien el navegador le negara
 * el permiso, se quedaba sin opción aunque quisiera. Por eso los cuatro
 * negocios que hubo en producción tenían latitude y longitude en null: no es
 * que nadie quisiera aparecer en el mapa, es que casi nadie podía.
 *
 * Acá la entrada manual es visible y de primera clase, junto a la del GPS.
 */

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Dialog } from "@/components/ui/Overlay"

/* Caja aproximada de Venezuela. No sirve para rechazar —un negocio en la raya
   con Colombia es legítimo, y equivocarse contra el dueño es peor que dejar
   pasar un dato raro—, pero sí para avisar: unas coordenadas en mitad del
   Índico casi siempre son latitud y longitud puestas al revés. */
const VENEZUELA = { latMin: 0.5, latMax: 12.5, lngMin: -73.5, lngMax: -59.5 }

function dentroDeVenezuela(lat: number, lng: number): boolean {
  return (
    lat >= VENEZUELA.latMin && lat <= VENEZUELA.latMax &&
    lng >= VENEZUELA.lngMin && lng <= VENEZUELA.lngMax
  )
}

interface UbicacionModalProps {
  open: boolean
  onClose: () => void
  /** Coordenadas actuales del negocio, si ya tiene. */
  latitudInicial?: number | string | null
  longitudInicial?: number | string | null
  /** Se llama al confirmar. Si lanza, el modal se queda abierto. */
  onGuardar: (latitud: number, longitud: number) => Promise<void> | void
}

export default function UbicacionModal({
  open,
  onClose,
  latitudInicial,
  longitudInicial,
  onGuardar,
}: UbicacionModalProps) {
  const [latitud, setLatitud] = useState("")
  const [longitud, setLongitud] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  /* El estado se recarga cada vez que se abre, no una sola vez al montar.
     Así "Cancelar" descarta de verdad: al volver a abrir se ve lo que hay
     guardado, no lo que se tecleó y se desechó. Antes "Cancelar" y
     "Confirmar" hacían exactamente lo mismo —cerrar— y no había forma de
     echarse atrás. */
  useEffect(() => {
    if (!open) return
    setLatitud(latitudInicial != null ? String(latitudInicial) : "")
    setLongitud(longitudInicial != null ? String(longitudInicial) : "")
    setError("")
  }, [open, latitudInicial, longitudInicial])

  const usarUbicacionActual = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no permite obtener la ubicación. Escribe las coordenadas abajo.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setLatitud(posicion.coords.latitude.toFixed(6))
        setLongitud(posicion.coords.longitude.toFixed(6))
        setError("")
        toast.success("Ubicación tomada del GPS")
      },
      () => {
        /* El fallo más común acá es que la persona no está en el local, o que
           negó el permiso. Ninguno de los dos es un callejón sin salida ahora
           que la entrada manual existe, así que el mensaje apunta hacia ella
           en vez de dejarla mirando un error. */
        setError(
          "No pudimos leer tu ubicación. Revisa el permiso del navegador, o escribe las coordenadas abajo."
        )
      }
    )
  }

  const confirmar = async () => {
    const lat = Number(latitud)
    const lng = Number(longitud)

    if (!latitud.trim() || !longitud.trim()) {
      setError("Faltan las coordenadas. Usa el botón del GPS o escríbelas abajo.")
      return
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Las coordenadas tienen que ser números.")
      return
    }
    if (lat < -90 || lat > 90) {
      setError("La latitud va entre -90 y 90.")
      return
    }
    if (lng < -180 || lng > 180) {
      setError("La longitud va entre -180 y 180.")
      return
    }

    setGuardando(true)
    try {
      await onGuardar(lat, lng)
      if (!dentroDeVenezuela(lat, lng)) {
        toast.warning("Ubicación guardada, pero cae fuera de Venezuela", {
          description: "Si no es lo que esperabas, revisa que la latitud y la longitud no estén invertidas.",
        })
      }
      onClose()
    } catch {
      setError("No se pudo guardar la ubicación. Inténtalo de nuevo.")
    } finally {
      setGuardando(false)
    }
  }

  const hayCoordenadas = latitud.trim() !== "" && longitud.trim() !== ""

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-label="Ubicación del negocio en el mapa"
      panelClassName="bg-white border border-black/10 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-ink">Ubicación en el mapa</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 hover:bg-black/5 rounded-full transition-all"
          >
            <svg className="w-6 h-6 text-ink-2 hover:text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-ink-2">
          Con esto, quien vea tu negocio sabrá a qué distancia está de él.
        </p>
      </div>

      {/* Camino 1: el GPS del aparato. Un toque, y es el bueno si estás en el
          local ahora mismo. */}
      <button
        type="button"
        onClick={usarUbicacionActual}
        disabled={guardando}
        className="w-full flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-sm"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Estoy en el negocio — usar mi ubicación
      </button>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-black/10" />
        <span className="text-xs font-semibold text-ink-2">o escríbelas</span>
        <div className="flex-1 h-px bg-black/10" />
      </div>

      {/* Camino 2: a mano. Es el que faltaba, y el que hace que esto sirva
          para quien no está en el local al registrarse. */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ubicacion-lat" className="block text-sm font-semibold text-ink mb-2">
            Latitud
          </label>
          <input
            id="ubicacion-lat"
            type="text"
            inputMode="decimal"
            value={latitud}
            onChange={(e) => setLatitud(e.target.value)}
            placeholder="10.4806"
            disabled={guardando}
            className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
          />
        </div>
        <div>
          <label htmlFor="ubicacion-lng" className="block text-sm font-semibold text-ink mb-2">
            Longitud
          </label>
          <input
            id="ubicacion-lng"
            type="text"
            inputMode="decimal"
            value={longitud}
            onChange={(e) => setLongitud(e.target.value)}
            placeholder="-66.9036"
            disabled={guardando}
            className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      <p className="text-xs text-ink-2 mt-2">
        ¿No las sabes? Abre Google Maps, mantén pulsado sobre tu local y copia
        los dos números que aparecen.
      </p>

      {error && (
        <p className="mt-4 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Vista previa. Sirve de comprobación: si el punto no cae donde está tu
          negocio, las coordenadas están mal y se ve antes de guardar. */}
      {hayCoordenadas && (
        <div className="mt-5 bg-black/[0.02] border border-black/10 rounded-2xl p-4">
          <p className="text-sm font-semibold text-ink mb-2">Vista previa</p>
          <div className="rounded-xl overflow-hidden bg-black/5">
            <iframe
              title="Mapa de ubicación"
              width="100%"
              height="200"
              frameBorder="0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitud},${latitud},${longitud},${latitud}&layer=mapnik&marker=${latitud},${longitud}`}
              className="w-full"
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-6">
        <button
          type="button"
          onClick={confirmar}
          disabled={guardando}
          className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-2xl transition-all"
        >
          {guardando ? "Guardando…" : "Guardar ubicación"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={guardando}
          className="px-6 py-3 bg-black/5 hover:bg-black/10 disabled:opacity-60 text-ink font-semibold rounded-2xl transition-all"
        >
          Cancelar
        </button>
      </div>
    </Dialog>
  )
}
