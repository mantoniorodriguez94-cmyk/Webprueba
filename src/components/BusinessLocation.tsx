// src/components/BusinessLocation.tsx
"use client"
import React from "react"

interface BusinessLocationProps {
  address: string | null
  latitude: number | null
  longitude: number | null
  showIcon?: boolean
  className?: string
  variant?: "default" | "compact" | "detailed"
}

export default function BusinessLocation({
  address,
  latitude,
  longitude,
  showIcon = true,
  className = "",
  variant = "default"
}: BusinessLocationProps) {
  // Validar si tenemos coordenadas válidas
  const hasValidCoordinates = 
    latitude !== null && 
    longitude !== null && 
    !isNaN(latitude) && 
    !isNaN(longitude) &&
    latitude !== 0 &&
    longitude !== 0

  // Generar URL de Google Maps
  const googleMapsUrl = hasValidCoordinates 
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : null

  // Caso 1: Solo dirección manual (sin coordenadas o coordenadas inválidas)
  if (address && !hasValidCoordinates) {
    return (
      <div className={`flex items-start gap-2 ${className}`}>
        {showIcon && (
          <svg 
            className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" 
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
        )}
        <span className="flex-1 text-gray-400 text-sm leading-relaxed">
          {address}
        </span>
      </div>
    )
  }

  // Caso 2: Solo coordenadas GPS (sin dirección)
  if (!address && hasValidCoordinates && googleMapsUrl) {
    if (variant === "compact") {
      return (
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium ${className}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Ver en mapa
        </a>
      )
    }

    return (
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-2xl transition-all group ${className}`}
      >
        <svg 
          className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" 
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
        <span className="text-blue-400 font-semibold text-sm group-hover:text-blue-300 transition-colors">
          📍 Ver ubicación en Google Maps
        </span>
        <svg 
          className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    )
  }

  // Caso 3: Tiene ambos (dirección Y coordenadas válidas)
  if (address && hasValidCoordinates && googleMapsUrl) {
    if (variant === "detailed") {
      return (
        <div className={`space-y-2 ${className}`}>
          {/* Dirección principal */}
          <div className="flex items-start gap-2">
            {showIcon && (
              <svg 
                className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" 
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
            )}
            <span className="flex-1 text-gray-400 text-sm leading-relaxed">
              {address}
            </span>
          </div>
          
          {/* Enlace al mapa */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium ml-7"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Ver en mapa
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )
    }

    // Variant default: Solo dirección (prioridad)
    return (
      <div className={`flex items-start gap-2 ${className}`}>
        {showIcon && (
          <svg 
            className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" 
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
        )}
        <div className="flex-1">
          <span className="text-gray-400 text-sm leading-relaxed block">
            {address}
          </span>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-xs font-medium mt-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Ver en mapa
          </a>
        </div>
      </div>
    )
  }

  // Caso 4: No tiene ni dirección ni coordenadas válidas
  return (
    <div className={`flex items-start gap-2 text-gray-500 italic text-sm ${className}`}>
      {showIcon && (
        <svg 
          className="w-5 h-5 flex-shrink-0 mt-0.5" 
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
      )}
      <span>Ubicación no disponible</span>
    </div>
  )
}

