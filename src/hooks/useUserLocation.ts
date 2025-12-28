"use client"

import { useState, useEffect, useCallback } from "react"

export interface UserLocation {
  lat: number
  lng: number
}

interface UseUserLocationReturn {
  userLocation: UserLocation | null
  error: string | null
  isLoading: boolean
  requestLocation: () => void
}

const STORAGE_KEY = "user_location"
const LOCATION_CACHE_DURATION = 1000 * 60 * 30 // 30 minutos

interface StoredLocation {
  lat: number
  lng: number
  timestamp: number
}

/**
 * Hook personalizado para obtener la ubicación del usuario
 * Usa sessionStorage para persistir la ubicación durante la sesión
 */
export default function useUserLocation(): UseUserLocationReturn {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Función para obtener la ubicación
  const requestLocationInternal = useCallback(() => {
    if (!navigator.geolocation) {
      setError("La geolocalización no está disponible en este navegador")
      return
    }

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        
        setUserLocation(location)
        setIsLoading(false)

        // Guardar en sessionStorage
        try {
          const stored: StoredLocation = {
            ...location,
            timestamp: Date.now(),
          }
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
        } catch (err) {
          console.error("Error saving location to sessionStorage:", err)
        }
      },
      (err) => {
        setIsLoading(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Permiso de ubicación denegado")
            break
          case err.POSITION_UNAVAILABLE:
            setError("Ubicación no disponible")
            break
          case err.TIMEOUT:
            setError("Tiempo de espera agotado")
            break
          default:
            setError("Error desconocido al obtener la ubicación")
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 segundos
        maximumAge: 300000, // 5 minutos
      }
    )
  }, [])

  // Función pública para obtener la ubicación (puede ser llamada manualmente)
  const requestLocation = useCallback(() => {
    requestLocationInternal()
  }, [requestLocationInternal])

  // Cargar ubicación desde sessionStorage al montar y solicitar si no existe
  useEffect(() => {
    const loadStoredLocation = () => {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed: StoredLocation = JSON.parse(stored)
          const now = Date.now()
          
          // Validar que la ubicación almacenada no sea muy antigua
          if (now - parsed.timestamp < LOCATION_CACHE_DURATION) {
            setUserLocation({ lat: parsed.lat, lng: parsed.lng })
            return true
          } else {
            // Limpiar ubicación expirada
            sessionStorage.removeItem(STORAGE_KEY)
          }
        }
      } catch (err) {
        console.error("Error loading stored location:", err)
      }
      return false
    }

    const hasStoredLocation = loadStoredLocation()
    
    // Si no hay ubicación almacenada, solicitar ubicación
    if (!hasStoredLocation && navigator.geolocation) {
      requestLocationInternal()
    }
  }, [requestLocationInternal])

  return {
    userLocation,
    error,
    isLoading,
    requestLocation,
  }
}
