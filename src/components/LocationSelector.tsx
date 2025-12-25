"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

interface State {
  id: number
  name: string
}

interface Municipality {
  id: number
  name: string
  state_id: number
}

interface LocationSelectorProps {
  selectedStateId: number | null
  selectedMunicipalityId: number | null
  onStateChange: (stateId: number | null) => void
  onMunicipalityChange: (municipalityId: number | null) => void
  disabled?: boolean
  required?: boolean
}

export default function LocationSelector({
  selectedStateId,
  selectedMunicipalityId,
  onStateChange,
  onMunicipalityChange,
  disabled = false,
  required = true,
}: LocationSelectorProps) {
  const [states, setStates] = useState<State[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [loadingStates, setLoadingStates] = useState(true)
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false)
  const [error, setError] = useState("")

  // Cargar estados al montar el componente
  useEffect(() => {
    const loadStates = async () => {
      try {
        setLoadingStates(true)
        setError("")
        
        const { data, error: fetchError } = await supabase
          .from("states")
          .select("id, name")
          .order("name", { ascending: true })

        if (fetchError) throw fetchError

        setStates(data || [])
      } catch (err: any) {
        console.error("Error loading states:", err)
        setError("Error al cargar los estados. Por favor, intenta de nuevo.")
      } finally {
        setLoadingStates(false)
      }
    }

    loadStates()
  }, [])

  // Cargar municipios cuando se selecciona un estado
  useEffect(() => {
    const loadMunicipalities = async () => {
      if (!selectedStateId) {
        setMunicipalities([])
        onMunicipalityChange(null)
        return
      }

      try {
        setLoadingMunicipalities(true)
        setError("")
        
        const { data, error: fetchError } = await supabase
          .from("municipalities")
          .select("id, name, state_id")
          .eq("state_id", selectedStateId)
          .order("name", { ascending: true })

        if (fetchError) throw fetchError

        setMunicipalities(data || [])
        
        // Resetear municipio seleccionado si no está en la lista de municipios del nuevo estado
        if (selectedMunicipalityId) {
          const municipalityExists = data?.some(m => m.id === selectedMunicipalityId)
          if (!municipalityExists) {
            onMunicipalityChange(null)
          }
        }
      } catch (err: any) {
        console.error("Error loading municipalities:", err)
        setError("Error al cargar los municipios. Por favor, intenta de nuevo.")
      } finally {
        setLoadingMunicipalities(false)
      }
    }

    loadMunicipalities()
  }, [selectedStateId])

  return (
    <div className="space-y-4">
      {/* Mensaje informativo */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
        <p className="text-sm text-blue-300 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Selecciona tu ubicación base para que los clientes te encuentren en las búsquedas por zona
          </span>
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Selector de Estado */}
      <div>
        <label htmlFor="state" className="block text-sm font-semibold text-white mb-2">
          Estado {required && <span className="text-red-400">*</span>}
        </label>
        <select
          id="state"
          value={selectedStateId || ""}
          onChange={(e) => {
            const stateId = e.target.value ? parseInt(e.target.value) : null
            onStateChange(stateId)
          }}
          disabled={disabled || loadingStates}
          required={required}
          className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Selecciona un estado</option>
          {states.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
        {loadingStates && (
          <p className="text-xs text-gray-400 mt-1">Cargando estados...</p>
        )}
      </div>

      {/* Selector de Municipio */}
      <div>
        <label htmlFor="municipality" className="block text-sm font-semibold text-white mb-2">
          Municipio {required && <span className="text-red-400">*</span>}
        </label>
        <select
          id="municipality"
          value={selectedMunicipalityId || ""}
          onChange={(e) => {
            const municipalityId = e.target.value ? parseInt(e.target.value) : null
            onMunicipalityChange(municipalityId)
          }}
          disabled={disabled || loadingMunicipalities || !selectedStateId}
          required={required}
          className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">
            {!selectedStateId 
              ? "Primero selecciona un estado" 
              : loadingMunicipalities 
              ? "Cargando municipios..." 
              : "Selecciona un municipio"}
          </option>
          {municipalities.map((municipality) => (
            <option key={municipality.id} value={municipality.id}>
              {municipality.name}
            </option>
          ))}
        </select>
        {loadingMunicipalities && (
          <p className="text-xs text-gray-400 mt-1">Cargando municipios...</p>
        )}
      </div>
    </div>
  )
}

