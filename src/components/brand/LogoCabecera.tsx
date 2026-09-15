"use client"

import { useEffect, useState } from "react"
import LogoBuscando from "./LogoBuscando"

/**
 * El logo del encabezado, que hace el barrido UNA vez por sesión.
 *
 * La pantalla de carga ya lo hace al abrir, pero se la lleva por delante en
 * cuanto llegan los datos: en una conexión rápida dura menos de lo que tarda
 * el ojo. Este es el que se ve entero.
 *
 * Una vez por sesión y no en cada navegación: el encabezado se remonta al
 * cambiar de sección, y un logo que se pone a buscar cada vez que tocas una
 * pestaña cansa en dos días. La marca la pone sessionStorage, así que vuelve
 * a correr cuando se abre una pestaña nueva —que es lo que una persona vive
 * como "volver a entrar"— y no sobrevive al cierre del navegador.
 */
const CLAVE = "encuentra:barrido-visto"

export default function LogoCabecera({
  size = 44,
  className = "",
}: {
  size?: number
  className?: string
}) {
  const [animar, setAnimar] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CLAVE)) return
      sessionStorage.setItem(CLAVE, "1")
      setAnimar(true)
    } catch {
      // Navegación privada o almacenamiento bloqueado: se queda quieto. El
      // fallo seguro es no animar, nunca animar en cada render.
    }
  }, [])

  /* El servidor pinta la marca quieta y el efecto añade la clase después, así
     que no hay desajuste de hidratación: el primer render del cliente coincide
     con el del servidor. La animación arranca al aparecer la clase.

     idPrefix distinto al de la pantalla de carga porque LogoBuscando no puede
     usar useId(): sus <clipPath> chocarían si coincidieran en pantalla. */
  return <LogoBuscando size={size} animado={animar} idPrefix="cab" className={className} />
}
