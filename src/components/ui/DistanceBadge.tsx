"use client"

import React from "react"
import useUserLocation from "@/hooks/useUserLocation"
import { calculateDistance } from "@/lib/utils/distance"

interface DistanceBadgeProps {
  latitude: number | null
  longitude: number | null
  className?: string
}

/**
 * Componente que muestra la distancia entre el usuario y un negocio
 * Falla silenciosamente si no hay permiso o no se puede obtener la ubicación
 */
export default function DistanceBadge({
  latitude,
  longitude,
  className = "",
}: DistanceBadgeProps) {
  const { userLocation, isLoading, error } = useUserLocation()

  // No mostrar nada si no hay coordenadas del negocio
  if (!latitude || !longitude) {
    return null
  }

  // No mostrar nada si está cargando o hay error (fallo silencioso)
  if (isLoading || error || !userLocation) {
    return null
  }

  // Calcular distancia
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    latitude,
    longitude
  )

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30 ${className}`}
      title={`Aproximadamente ${distance} km de distancia`}
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      <span>{distance} km</span>
    </span>
  )
}

