"use client"

import ClaimBusinessForm from "@/components/business/ClaimBusinessForm"
import Link from "next/link"

export default function ReclamarNegocioPage() {
  return (
    <div className="min-h-screen pb-12 text-white">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href="/app/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">Reclamar Mi Negocio</h1>
          <p className="text-gray-400">
            Si recibiste un código de invitación, ingrésalo aquí para reclamar tu negocio
          </p>
        </div>

        {/* Formulario */}
        <ClaimBusinessForm />
      </div>
    </div>
  )
}

