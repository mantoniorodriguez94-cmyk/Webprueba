"use client"

import { useCallback, useEffect, useSyncExternalStore } from "react"

export interface UserLocation {
  lat: number
  lng: number
}

/** Por qué no tenemos la ubicación. Importa distinguir "denegado" del resto:
 *  una vez que alguien niega el permiso, el navegador NO vuelve a preguntar
 *  por más veces que se le pida, así que reintentar no sirve de nada y hay que
 *  decirle a la persona que lo desbloquee ella. */
export type MotivoSinUbicacion =
  | "denegado"
  | "no-disponible"
  | "tiempo-agotado"
  | "sin-soporte"
  | "desconocido"

interface UseUserLocationReturn {
  userLocation: UserLocation | null
  motivo: MotivoSinUbicacion | null
  isLoading: boolean
  requestLocation: () => void
}

const STORAGE_KEY = "user_location"
const DURACION_CACHE = 1000 * 60 * 30 // 30 minutos

interface UbicacionGuardada {
  lat: number
  lng: number
  timestamp: number
}

/* ── Estado COMPARTIDO entre todas las tarjetas ──────────────────────────────
 *
 * Antes cada llamada al hook tenía su propio estado. Con veinte negocios en
 * el feed eso eran veinte copias independientes: veinte peticiones de GPS al
 * cargar, y —lo que rompe el botón de compartir— conceder el permiso desde
 * una tarjeta no enteraba a las otras diecinueve, que seguían mostrando el
 * botón como si nada.
 *
 * Con un único estado a nivel de módulo, se pide una vez y se enteran todas.
 */
interface Estado {
  userLocation: UserLocation | null
  motivo: MotivoSinUbicacion | null
  isLoading: boolean
}

let estado: Estado = { userLocation: null, motivo: null, isLoading: false }
const suscriptores = new Set<() => void>()

function publicar(cambio: Partial<Estado>) {
  estado = { ...estado, ...cambio }
  suscriptores.forEach((avisar) => avisar())
}

function suscribir(avisar: () => void) {
  suscriptores.add(avisar)
  return () => {
    suscriptores.delete(avisar)
  }
}

const leer = () => estado

/* En el servidor no hay navegador ni ubicación. Tiene que ser SIEMPRE el mismo
   objeto: si devolviera uno nuevo en cada llamada, React entraría en un bucle
   de renders. */
const ESTADO_SERVIDOR: Estado = { userLocation: null, motivo: null, isLoading: false }
const leerEnServidor = () => ESTADO_SERVIDOR

/** La ubicación cacheada se lee una sola vez por carga de página. */
let cacheLeida = false

function rescatarDeLaSesion() {
  if (cacheLeida) return
  cacheLeida = true

  try {
    const guardado = sessionStorage.getItem(STORAGE_KEY)
    if (!guardado) return

    const parseado: UbicacionGuardada = JSON.parse(guardado)
    if (Date.now() - parseado.timestamp < DURACION_CACHE) {
      publicar({ userLocation: { lat: parseado.lat, lng: parseado.lng } })
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    /* En incógnito o con el almacenamiento bloqueado esto lanza. No es un
       error que le importe a nadie: simplemente no hay nada cacheado. */
  }
}

function pedirAlNavegador() {
  if (estado.isLoading) return // ya hay una petición en vuelo

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    publicar({ motivo: "sin-soporte" })
    return
  }

  publicar({ isLoading: true, motivo: null })

  navigator.geolocation.getCurrentPosition(
    (posicion) => {
      const ubicacion: UserLocation = {
        lat: posicion.coords.latitude,
        lng: posicion.coords.longitude,
      }
      publicar({ userLocation: ubicacion, isLoading: false, motivo: null })

      try {
        const guardar: UbicacionGuardada = { ...ubicacion, timestamp: Date.now() }
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(guardar))
      } catch {
        /* Sin almacenamiento se vuelve a pedir en la próxima carga. */
      }
    },
    (err) => {
      const motivo: MotivoSinUbicacion =
        err.code === err.PERMISSION_DENIED
          ? "denegado"
          : err.code === err.POSITION_UNAVAILABLE
            ? "no-disponible"
            : err.code === err.TIMEOUT
              ? "tiempo-agotado"
              : "desconocido"
      publicar({ isLoading: false, motivo })
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    }
  )
}

/**
 * Ubicación de QUIEN MIRA la app — no la del negocio, que vive en la base.
 * Sólo sirve para calcular distancias en el navegador; no se envía a ninguna
 * parte ni se guarda más allá de la sesión.
 *
 * NO la pide sola. Antes sí: el hook lanzaba `getCurrentPosition` al montar,
 * así que el cartel de permiso del navegador saltaba nada más entrar a la app,
 * sin contexto y sin que nadie lo hubiera pedido. Esa es la peor forma de
 * pedirlo —y la más cara, porque una vez que alguien lo niega el navegador no
 * vuelve a preguntar nunca—. Ahora se pide cuando la persona pulsa el botón de
 * la tarjeta, que es el momento en el que ve qué gana a cambio.
 */
export default function useUserLocation(): UseUserLocationReturn {
  const { userLocation, motivo, isLoading } = useSyncExternalStore(
    suscribir,
    leer,
    leerEnServidor
  )

  // Recuperar lo cacheado sí es gratis y no pregunta nada.
  useEffect(() => {
    rescatarDeLaSesion()
  }, [])

  const requestLocation = useCallback(() => {
    pedirAlNavegador()
  }, [])

  return { userLocation, motivo, isLoading, requestLocation }
}
