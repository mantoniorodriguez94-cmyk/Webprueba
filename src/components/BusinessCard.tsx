// src/components/BusinessCard.tsx
"use client"
import React from "react"
import Link from "next/link"
import Image from "next/image"
type Props = {
  negocio: {
    id: string
    nombre: string
    description?: string
    logo_url?: string | null
    created_at?: string
  }
  onDelete?: (id: string) => Promise<void>
  deleting?: boolean
}

export default function BusinessCard({ negocio, onDelete, deleting }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded overflow-hidden bg-gray-100 flex-none flex items-center justify-center">
          <Image
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${negocio.logo_url}`}
            alt={negocio.nombre}
            className="w-full h-full object-cover"
            width={100}
            height={100}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{negocio.nombre}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{negocio.description}</p>
          <p className="text-xs text-gray-400 mt-1">{negocio.created_at ? new Date(negocio.created_at).toLocaleString() : ""}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link href={`/dashboard/negocios/${negocio.id}/editar`} className="px-3 py-1 border rounded text-sm">
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
