// src/components/feed/HighlightsSidebar.tsx
"use client"
import React from "react"
import Image from "next/image"
import type { Business } from "@/types/business"

interface HighlightsSidebarProps {
  featuredBusinesses?: Business[]
  events?: Event[]
}

interface Event {
  id: string
  title: string
  date: string
  location: string
  image?: string
}

export default function HighlightsSidebar({ 
  featuredBusinesses = [], 
  events = [] 
}: HighlightsSidebarProps) {
  // Datos de ejemplo para eventos si no hay datos reales
  const sampleEvents: Event[] = events.length > 0 ? events : [
    {
      id: "1",
      title: "Feria de Emprendedores",
      date: "2025-11-20",
      location: "Centro de Convenciones",
      image: undefined
    },
    {
      id: "2",
      title: "Networking Empresarial",
      date: "2025-11-25",
      location: "Hotel Plaza",
      image: undefined
    }
  ]

  return (
    <div className="hidden xl:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto space-y-6">
      {/* Eventos Destacados */}
      <div className="bg-white rounded-3xl shadow-xl p-6 animate-fadeIn">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Eventos Destacados
        </h3>
        <div className="space-y-3">
          {sampleEvents.map((event, idx) => (
            <div
              key={event.id}
              className="p-4 border-2 border-gray-100 rounded-2xl hover:border-[#0288D1] hover:bg-[#E3F2FD] transition-all duration-300 cursor-pointer group"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex gap-3">
                {/* Fecha decorativa */}
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#0288D1] to-[#0277BD] rounded-xl flex flex-col items-center justify-center text-white shadow-md">
                  <span className="text-xs font-semibold">
                    {new Date(event.date).toLocaleDateString('es', { month: 'short' }).toUpperCase()}
                  </span>
                  <span className="text-xl font-bold">
                    {new Date(event.date).getDate()}
                  </span>
                </div>
                
                {/* Info del evento */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm group-hover:text-[#0288D1] transition-colors line-clamp-2">
                    {event.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 text-[#0288D1] hover:text-[#0277BD] font-semibold text-sm py-2 hover:bg-[#E3F2FD] rounded-xl transition-all duration-300">
          Ver todos los eventos →
        </button>
      </div>

      {/* Negocios Destacados */}
      <div className="bg-white rounded-3xl shadow-xl p-6 animate-fadeIn" style={{ animationDelay: "200ms" }}>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Destacados
        </h3>
        {featuredBusinesses.length > 0 ? (
          <div className="space-y-3">
            {featuredBusinesses.slice(0, 5).map((business, idx) => (
              <div
                key={business.id}
                className="flex items-center gap-3 p-3 border-2 border-gray-100 rounded-2xl hover:border-[#0288D1] hover:bg-[#E3F2FD] transition-all duration-300 cursor-pointer group"
                style={{ animationDelay: `${(idx + 2) * 100}ms` }}
              >
                {/* Logo pequeño */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] flex-shrink-0">
                  {business.logo_url ? (
                    <Image
                      src={business.logo_url}
                      alt={business.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-900 truncate group-hover:text-[#0288D1] transition-colors">
                    {business.name}
                  </h4>
                  {business.category && (
                    <p className="text-xs text-gray-500 truncate">
                      {business.category}
                    </p>
                  )}
                </div>

                {/* Badge */}
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-sm text-gray-500">
              No hay negocios destacados aún
            </p>
          </div>
        )}
      </div>

      {/* Tips y Sugerencias */}
      <div className="bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] rounded-3xl shadow-xl p-6 animate-fadeIn" style={{ animationDelay: "400ms" }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
            <svg className="w-6 h-6 text-[#0288D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2">💡 Tip del día</h4>
            <p className="text-sm text-gray-700">
              Usa los filtros para encontrar negocios cerca de ti y descubrir nuevas oportunidades en tu zona.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}



