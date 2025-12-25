"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"

interface State {
  id: number
  name: string
}

interface Municipality {
  id: number
  state_id: number
  name: string
}

interface LocationSelectorProps {
  selectedStateId: number | null
  selectedMunicipalityId: number | null
  onStateChange: (stateId: number | null, stateName: string) => void
  onMunicipalityChange: (municipalityId: number | null, municipalityName: string) => void
  required?: boolean
  disabled?: boolean
}

export default function LocationSelector({
  selectedStateId,
  selectedMunicipalityId,
  onStateChange,
  onMunicipalityChange,
  required = false,
  disabled = false
}: LocationSelectorProps) {
  const [states, setStates] = useState<State[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [loadingStates, setLoadingStates] = useState(true)
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false)
  const prevStateIdRef = useRef<number | null>(null)
  const isLoadingRef = useRef(false)

  // Memoizar funciones de carga para evitar recrearlas
  const loadStates = useCallback(async () => {
    if (isLoadingRef.current) return
    
    try {
      isLoadingRef.current = true
      const { data, error } = await supabase
        .from('states')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) throw error
      setStates(data || [])
    } catch (error) {
      console.error('Error loading states:', error)
    } finally {
      setLoadingStates(false)
      isLoadingRef.current = false
    }
  }, [])

  const loadMunicipalities = useCallback(async (stateId: number) => {
    if (isLoadingRef.current) return
    
    try {
      isLoadingRef.current = true
      setLoadingMunicipalities(true)
      const { data, error } = await supabase
        .from('municipalities')
        .select('id, state_id, name')
        .eq('state_id', stateId)
        .order('name', { ascending: true })

      if (error) throw error
      setMunicipalities(data || [])
    } catch (error) {
      console.error('Error loading municipalities:', error)
    } finally {
      setLoadingMunicipalities(false)
      isLoadingRef.current = false
    }
  }, [])

  useEffect(() => {
    loadStates()
  }, [loadStates])

  useEffect(() => {
    // Solo ejecutar si stateId realmente cambió
    if (prevStateIdRef.current === selectedStateId) return
    
    prevStateIdRef.current = selectedStateId

    if (selectedStateId) {
      loadMunicipalities(selectedStateId)
    } else {
      setMunicipalities([])
      // Solo resetear municipio si había uno seleccionado
      if (selectedMunicipalityId !== null) {
        onMunicipalityChange(null, '')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStateId, loadMunicipalities])

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value ? parseInt(e.target.value) : null
    const selectedState = states.find(s => s.id === selectedId)
    onStateChange(selectedId, selectedState?.name || '')
  }

  const handleMunicipalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value ? parseInt(e.target.value) : null
    const selectedMunicipality = municipalities.find(m => m.id === selectedId)
    onMunicipalityChange(selectedId, selectedMunicipality?.name || '')
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="state" className="block text-sm font-medium text-gray-200 mb-2">
          Estado {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id="state"
          value={selectedStateId || ''}
          onChange={handleStateChange}
          required={required}
          disabled={loadingStates || disabled}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="" className="bg-gray-900">
            {loadingStates ? 'Cargando estados...' : 'Selecciona un estado'}
          </option>
          {states.map((state) => (
            <option key={state.id} value={state.id} className="bg-gray-900">
              {state.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="municipality" className="block text-sm font-medium text-gray-200 mb-2">
          Municipio {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id="municipality"
          value={selectedMunicipalityId || ''}
          onChange={handleMunicipalityChange}
          required={required}
          disabled={!selectedStateId || loadingMunicipalities || disabled}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="" className="bg-gray-900">
            {!selectedStateId 
              ? 'Primero selecciona un estado' 
              : loadingMunicipalities 
              ? 'Cargando municipios...' 
              : 'Selecciona un municipio'}
          </option>
          {municipalities.map((municipality) => (
            <option key={municipality.id} value={municipality.id} className="bg-gray-900">
              {municipality.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-sm text-blue-300">
          📍 Selecciona tu ubicación base para que los clientes te encuentren en las búsquedas por zona
        </p>
      </div>
    </div>
  )
}

