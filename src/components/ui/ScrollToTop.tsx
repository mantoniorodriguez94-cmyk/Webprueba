"use client"

/**
 * Ancla cada pantalla arriba al entrar.
 *
 * El síntoma era que varias secciones abrían por la mitad, tapando su propio
 * encabezado. Dos causas distintas daban el mismo resultado:
 *
 * 1. Al navegar dentro de la app, Next ya lleva la vista arriba, pero lo hacía
 *    como animación (por `scroll-behavior: smooth`, ya retirado). Estas
 *    pantallas piden sus datos a Supabase y crecen de golpe cuando llegan; ese
 *    cambio de alto interrumpe la animación a media altura y ahí se queda.
 * 2. Al abrir o recargar una dirección, el navegador restaura por su cuenta el
 *    desplazamiento que esa página tenía la última vez. Como el contenido llega
 *    después, restaura contra un documento que todavía está corto y termina
 *    cayendo en cualquier parte.
 *
 * Vive en el layout raíz y no en cada pantalla: si depende de que cada una se
 * acuerde, alguna se olvida.
 *
 * Lo que NO hace: tocar el botón de atrás. Volver al listado después de abrir
 * un negocio tiene que devolverte al mismo punto del feed, no al principio, así
 * que las navegaciones hacia atrás se dejan pasar sin intervenir.
 */

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export default function ScrollToTop() {
  const pathname = usePathname()
  const haciaAtras = useRef(false)
  const primeraCarga = useRef(true)

  // `popstate` es la única señal de que la navegación vino del botón de atrás
  // o adelante del navegador. Se marca acá y se consume en el efecto de abajo.
  useEffect(() => {
    const marcar = () => {
      haciaAtras.current = true
    }
    window.addEventListener("popstate", marcar)
    return () => window.removeEventListener("popstate", marcar)
  }, [])

  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false

      const entrada = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined

      // Llegar con atrás/adelante o con un ancla en la URL son los dos casos
      // donde el usuario sí quiere caer en un punto concreto.
      if (entrada?.type === "back_forward" || window.location.hash) return

      // Se le quita al navegador la restauración automática para esta carga:
      // es la que arrastra la vista a un desplazamiento viejo mientras el
      // contenido todavía está llegando. Se le devuelve apenas termina de
      // cargar, para que atrás/adelante siga recordando la posición.
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual"
        const devolver = () => {
          history.scrollRestoration = "auto"
        }
        if (document.readyState === "complete") devolver()
        else window.addEventListener("load", devolver, { once: true })
      }
    } else if (haciaAtras.current) {
      haciaAtras.current = false
      return
    }

    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
