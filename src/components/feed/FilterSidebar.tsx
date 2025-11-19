// src/components/feed/FilterSidebar.tsx
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

  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>

      {/* Overlay para mobile */}
      {isExpanded && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:sticky 
          top-0 lg:top-24 
          left-0 
          h-screen lg:h-[calc(100vh-6rem)] 
          z-50
          bg-white/90 
          backdrop-blur-xl
          lg:rounded-3xl 
          shadow-2xl
          border-2 border-white/40 
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-full sm:w-96 lg:w-80
          flex flex-col
        `}
      >
        {/* Header - Fijo en la parte superior */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b-2 border-[#0288D1]/10 bg-white/60 backdrop-blur-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </h2>
          <button
            onClick={() => setIsExpanded(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">

          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => updateFilter("searchTerm", e.target.value)}
                placeholder="Nombre del negocio..."
                className="w-full px-4 py-2.5 sm:py-3 pr-10 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] focus:ring-4 focus:ring-[#E3F2FD] transition-all duration-300 text-gray-900 text-sm sm:text-base"
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Location Filter - PRIMERO */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ubicación
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.location}
                onChange={(e) => updateFilter("location", e.target.value)}
                placeholder="Ciudad o dirección..."
                className="w-full px-4 py-2.5 sm:py-3 pr-10 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#0288D1] focus:ring-4 focus:ring-[#E3F2FD] transition-all duration-300 text-gray-900 text-sm sm:text-base"
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          {/* Category Filter - SEGUNDO */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
              Categoría
            </label>
            <div className="space-y-1.5 sm:space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => updateFilter("category", cat)}
                  className={`
                    w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-300 text-sm sm:text-base
                    ${filters.category === cat
                      ? "bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white shadow-md"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <span className="font-medium">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
              Ordenar por
            </label>
            <div className="space-y-1.5 sm:space-y-2">
              <button
                onClick={() => updateFilter("sortBy", "recent")}
                className={`
                  w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 sm:gap-3 text-sm sm:text-base
                  ${filters.sortBy === "recent"
                    ? "bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Más recientes
              </button>
              <button
                onClick={() => updateFilter("sortBy", "name")}
                className={`
                  w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 sm:gap-3 text-sm sm:text-base
                  ${filters.sortBy === "name"
                    ? "bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Alfabético
              </button>
              <button
                onClick={() => updateFilter("sortBy", "popular")}
                className={`
                  w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 sm:gap-3 text-sm sm:text-base
                  ${filters.sortBy === "popular"
                    ? "bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Populares
              </button>
            </div>
          </div>
        </div>

        {/* Footer con botón Limpiar - Fijo en la parte inferior */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-t-2 border-[#0288D1]/10 bg-white/60 backdrop-blur-lg">
          <button
            onClick={() => {
              const defaultFilters: FilterState = {
                searchTerm: "",
                category: "Todos",
                location: "",
                sortBy: "recent"
              }
              setFilters(defaultFilters)
              onFilterChange(defaultFilters)
              setIsExpanded(false) // Cerrar el panel en móvil después de limpiar
            }}
            className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 sm:py-3 px-4 rounded-2xl transition-all duration-300 hover:shadow-md flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Limpiar filtros
          </button>
        </div>
      </div>
    </>
  )
}



