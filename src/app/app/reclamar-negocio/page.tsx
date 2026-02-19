"use client"

import { useEffect, useState } from "react"
import ClaimBusinessForm from "@/components/business/ClaimBusinessForm"
import Link from "next/link"
import useUser from "@/hooks/useUser"

export default function ReclamarNegocioPage() {
  const { user, loading: userLoading } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  useEffect(() => {
    const loadAdminFlag = async () => {
      if (!user) {
        setIsAdmin(false)
        setCheckingAdmin(false)
        return
      }

      try {
        const response = await fetch("/api/user/is-admin", { cache: "no-store" })
        const data = await response.json()
        setIsAdmin(data.isAdmin === true)
      } catch {
        setIsAdmin(false)
      } finally {
        setCheckingAdmin(false)
      }
    }

    loadAdminFlag()
  }, [user])

  if (userLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-gray-400">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="max-w-md mx-auto px-4 py-8 bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-white/10 text-center">
          <h1 className="text-2xl font-bold mb-3">Acceso restringido</h1>
          <p className="text-gray-400 mb-6">
            La funcionalidad de reclamar negocios está disponible solo para administradores.
          </p>
          <Link
            href="/app/dashboard"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Dashboard
          </Link>
        </div>
      </div>
    )
  }

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

        {/* Formulario solo visible para admin */}
        <ClaimBusinessForm />
      </div>
    </div>
  )
}

