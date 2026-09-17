"use client"

import React from "react"
import useUserLocation from "@/hooks/useUserLocation"
import { calculateDistance } from "@/lib/utils/distance"

interface DistanceBadgeProps {
  latitude: number | null
  longitude: number | null
  className?: string
}

const BASE_CHIP =
  "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border"

function IconoPin({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

/**
 * Distancia entre quien mira y el negocio.
 *
 * Antes esto "fallaba en silencio": si no teníamos la ubicación de quien mira,
 * devolvía null y no pintaba nada. Sonaba prudente y era un agujero — la
 * persona no veía un hueco, veía una app donde esta función sencillamente no
 * existía, y nunca se enteraba de que podía tenerla. Justo la función que
 * distingue al producto de un listín de teléfonos.
 *
 * Ahora, cuando no la tenemos, el hueco se convierte en la oferta: un botón
 * que dice qué se gana y pide el permiso sólo si lo pulsas. Es también el
 * único sitio donde se pide: el hook ya no pregunta solo al cargar.
 *
 * Sigue sin pintar nada cuando el NEGOCIO no tiene ubicación, porque ahí no
 * hay distancia que ofrecer por mucho permiso que se conceda.
 */
export default function DistanceBadge({
  latitude,
  longitude,
  className = "",
}: DistanceBadgeProps) {
  const { userLocation, motivo, isLoading, requestLocation } = useUserLocation()

  if (!latitude || !longitude) {
    return null
  }

  // ── Lo tenemos todo: la distancia ────────────────────────────────────────
  if (userLocation) {
    const distancia = calculateDistance(userLocation.lat, userLocation.lng, latitude, longitude)
    return (
      <span
        className={`group ${BASE_CHIP} bg-blue-500/15 text-blue-700 border-blue-500/30 ${className}`}
        title={`Aproximadamente ${distancia} km de distancia`}
      >
        <IconoPin className="w-3.5 h-3.5 group-hover:animate-pin-drop" />
        <span className="font-mono">{distancia} km</span>
      </span>
    )
  }

  if (isLoading) {
    return (
      <span className={`${BASE_CHIP} bg-black/5 text-ink-2 border-black/10 ${className}`}>
        <IconoPin />
        Calculando…
      </span>
    )
  }

  /* Denegado es un callejón sin salida, no un reintento: una vez que se niega
     el permiso el navegador no vuelve a preguntar por mucho que se le pida.
     Un botón acá sería un botón que no hace nada, así que se dice qué pasa y
     dónde se arregla. */
  if (motivo === "denegado") {
    return (
      <span
        className={`${BASE_CHIP} bg-black/5 text-ink-2 border-black/10 ${className}`}
        title="Tu navegador tiene bloqueada la ubicación para este sitio. Actívala en sus ajustes para ver a qué distancia estás."
      >
        <IconoPin />
        Ubicación bloqueada
      </span>
    )
  }

  if (motivo === "sin-soporte") {
    return null
  }

  // ── El caso normal de quien todavía no la ha compartido ──────────────────
  return (
    <button
      type="button"
      onClick={(e) => {
        /* La tarjeta entera suele ser un enlace al negocio. Sin esto, pedir la
           distancia te sacaba de la lista. */
        e.preventDefault()
        e.stopPropagation()
        requestLocation()
      }}
      className={`${BASE_CHIP} bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 border-blue-500/30 transition-colors cursor-pointer ${className}`}
      title="Comparte tu ubicación para ver a qué distancia estás de este negocio"
    >
      <IconoPin />
      {motivo ? "Reintentar distancia" : "¿A qué distancia?"}
    </button>
  )
}
