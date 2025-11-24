// src/components/BusinessCard.tsx
"use client"
import React from "react"
import Link from "next/link"
import Image from "next/image"
import type { Business } from "@/types/business"
import StarRating from "@/components/reviews/StarRating"

type Props = {
  negocio: Business
  onDelete?: (id: string) => Promise<void>
  deleting?: boolean
}

export default function BusinessCard({ negocio, onDelete, deleting }: Props) {
  const hasReviews = negocio.total_reviews && negocio.total_reviews > 0
  
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded overflow-hidden bg-gray-100 flex-none flex items-center justify-center">
          {negocio.logo_url ? (
            <Image
              src={negocio.logo_url}
              alt={negocio.name}
              className="w-full h-full object-cover"
              width={80}
              height={80}
              unoptimized
            />
          ) : (
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{negocio.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{negocio.description || "Sin descripción"}</p>
          
          {/* Rating Section */}
          {hasReviews ? (
            <div className="flex items-center gap-2 mt-2">
              <StarRating 
                rating={negocio.average_rating || 0} 
                size="sm" 
                showNumber={true}
              />
              <span className="text-xs text-gray-500">
                ({negocio.total_reviews} {negocio.total_reviews === 1 ? 'reseña' : 'reseñas'})
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-1">
              {negocio.created_at ? new Date(negocio.created_at).toLocaleString() : ""}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link href={`/app/dashboard/negocios/${negocio.id}/editar`} className="px-3 py-1 border rounded text-sm">
          Editar
        </Link>
        <button
          disabled={deleting}
          onClick={async () => onDelete && await onDelete(negocio.id)}
          className="px-3 py-1 border rounded text-sm text-red-600 disabled:opacity-50"
        >
          {deleting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </div>
  )
}
