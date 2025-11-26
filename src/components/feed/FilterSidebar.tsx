// src/components/feed/FilterSidebar.tsx - REDISEÑO MOBILE DARK THEME
"use client"
import React, { useState } from "react"

interface FilterSidebarProps {
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  searchTerm: string
  category: string
  location: string
  sortBy: "recent" | "name" | "popular"
}

const categories = [
  "Todos",
  "Restaurantes",
  "Tiendas",
  "Servicios",
  "Salud",
  "Educación",
  "Tecnología",
  "Entretenimiento",
  "Deportes",
  "Belleza",
  "Otros"
]

export default function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    category: "Todos",
    location: "",
    sortBy: "recent"
  })

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const resetFilters: FilterState = {
      searchTerm: "",
      category: "Todos",
      location: "",
      sortBy: "recent"
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  const hasActiveFilters = filters.category !== "Todos" || filters.location !== "" || filters.searchTerm !== ""

  return (
    <div className="bg-transparent/50 backdrop-blur-sm rounded-3xl border border-white/20 p-5 space-y-5 sticky top-20">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/20">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-semibold px-3 py-1.5 bg-gray-700 rounded-full hover:bg-gray-600"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Buscar
        </label>
        <input
          type="text"
          placeholder="Buscar negocios..."
          value={filters.searchTerm}
          onChange={(e) => updateFilter("searchTerm", e.target.value)}
          className="w-full bg-gray-700 border-2 border-gray-600 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-gray-700/80 transition-all"
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Ubicación
        </label>
        <input
          type="text"
          placeholder="Ciudad, dirección..."
          value={filters.location}
          onChange={(e) => updateFilter("location", e.target.value)}
          className="w-full bg-gray-700 border-2 border-gray-600 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-gray-700/80 transition-all"
        />
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Categoría
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => updateFilter("category", cat)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filters.category === cat
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sort by */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          Ordenar por
        </label>
        <div className="space-y-2">
          {[
            { value: "recent" as const, label: "Más recientes", icon: "🕐" },
            { value: "name" as const, label: "Nombre (A-Z)", icon: "🔤" },
            { value: "popular" as const, label: "Más populares", icon: "⭐" }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilter("sortBy", option.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                filters.sortBy === option.value
                  ? "bg-gray-700 border-2 border-blue-500 text-white"
                  : "bg-gray-700/50 text-gray-300 hover:bg-gray-700 border-2 border-gray-600"
              }`}
            >
              <span className="text-lg">{option.icon}</span>
              <span className="flex-1 text-left font-medium">{option.label}</span>
              {filters.sortBy === option.value && (
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Info card */}
      <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-xs text-gray-300 leading-relaxed">
              Usa los filtros para encontrar exactamente lo que buscas. Los resultados se actualizan automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
