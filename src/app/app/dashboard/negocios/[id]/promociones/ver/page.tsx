// src/app/dashboard/negocios/[id]/promociones/ver/page.tsx
"use client"
import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import Image from "next/image"
import type { Business } from "@/types/business"

type Promotion = {
  id: string
  business_id: string
  name: string
  image_url: string | null
  price: number | null
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export default function VerPromocionesPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [business, setBusiness] = useState<Business | null>(null)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const businessId = params?.id as string

  // Determinar el estado de cada promoción
  const getPromotionStatus = (promo: Promotion) => {
    const today = new Date()
    const start = new Date(promo.start_date)
    const end = new Date(promo.end_date)

    if (!promo.is_active) return { label: "Inactiva", color: "gray" }
    if (start > today) return { label: "Próximamente", color: "blue" }
    if (end < today) return { label: "Expirada", color: "red" }
    return { label: "Activa", color: "green" }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!businessId || userLoading) return

      setLoading(true)

      try {
        // Cargar negocio
        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", businessId)
          .single()

        if (businessError) throw businessError
        setBusiness(businessData)

        // Cargar todas las promociones activas (públicas)
        const { data: promotionsData, error: promotionsError } = await supabase
          .from("promotions")
          .select("*")
          .eq("business_id", businessId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })

        if (promotionsError) throw promotionsError
        setPromotions(promotionsData || [])
      } catch (error) {
        console.error("Error cargando datos:", error)
        alert("Error cargando las promociones")
        router.push("/app/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [businessId, userLoading, router])

  // Filtrar promociones por estado
  const activePromotions = promotions.filter(p => {
    const status = getPromotionStatus(p)
    return status.label === "Activa"
  })

  const upcomingPromotions = promotions.filter(p => {
    const status = getPromotionStatus(p)
    return status.label === "Próximamente"
  })

  const expiredPromotions = promotions.filter(p => {
    const status = getPromotionStatus(p)
    return status.label === "Expirada"
  })

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-transparent/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/20/40 p-12 animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Cargando promociones...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-transparent/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/20/40 p-12 animate-fadeIn">
          <h2 className="text-2xl font-bold text-white mb-4">Negocio no encontrado</h2>
          <Link 
            href="/app/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white px-6 py-3 rounded-full hover:shadow-xl transition-all"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white/85 backdrop-blur-xl sticky top-0 z-30 shadow-lg border-b-2 border-[#0288D1]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/app/dashboard/negocios/${business.id}`}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Volver"
              >
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  <svg className="w-7 h-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  Promociones
                </h1>
                <p className="text-sm text-gray-300 mt-1">
                  {business.name} • {activePromotions.length} activa{activePromotions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Info del negocio */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 backdrop-blur-md rounded-3xl shadow-xl border-2 border-pink-200/40 p-6 mb-8">
          <div className="flex items-center gap-4">
            {business.logo_url && (
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-pink-300">
                <Image src={business.logo_url} alt={business.name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{business.name}</h2>
              <p className="text-sm text-gray-300">
                Descubre las mejores ofertas y promociones especiales
              </p>
            </div>
          </div>
        </div>

        {/* Sin promociones */}
        {promotions.length === 0 && (
          <div className="bg-transparent/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-white/20/40 p-12 text-center">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No hay promociones disponibles</h3>
            <p className="text-gray-300 mb-6">
              Este negocio aún no ha publicado promociones. Vuelve pronto para descubrir nuevas ofertas.
            </p>
            <Link
              href={`/app/dashboard/negocios/${business.id}`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0288D1] to-[#0277BD] text-white px-6 py-3 rounded-full hover:shadow-xl transition-all font-semibold"
            >
              Volver al Negocio
            </Link>
          </div>
        )}

        {/* Promociones Activas */}
        {activePromotions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              Promociones Activas ({activePromotions.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePromotions.map((promo) => (
                <div key={promo.id} className="bg-transparent/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-green-200/40 overflow-hidden hover:shadow-2xl transition-all group">
                  {/* Imagen */}
                  {promo.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={promo.image_url}
                        alt={promo.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        ✓ Activa
                      </div>
                    </div>
                  )}
                  
                  {/* Contenido */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{promo.name}</h3>
                    
                    {promo.price && (
                      <p className="text-3xl font-bold text-pink-600 mb-3">
                        ${promo.price.toFixed(2)}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Inicio: {new Date(promo.start_date).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Válida hasta: {new Date(promo.end_date).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próximamente */}
        {upcomingPromotions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Próximamente ({upcomingPromotions.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingPromotions.map((promo) => (
                <div key={promo.id} className="bg-transparent/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-blue-200/40 overflow-hidden opacity-75">
                  {promo.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={promo.image_url}
                        alt={promo.name}
                        fill
                        className="object-cover grayscale"
                      />
                      <div className="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Próximamente
                      </div>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{promo.name}</h3>
                    {promo.price && (
                      <p className="text-3xl font-bold text-gray-400 mb-3">
                        ${promo.price.toFixed(2)}
                      </p>
                    )}
                    <div className="text-sm text-gray-300">
                      <p className="font-semibold">
                        Disponible desde: {new Date(promo.start_date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expiradas */}
        {expiredPromotions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Promociones Anteriores ({expiredPromotions.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {expiredPromotions.map((promo) => (
                <div key={promo.id} className="bg-transparent/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-gray-200/40 overflow-hidden opacity-50">
                  {promo.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={promo.image_url}
                        alt={promo.name}
                        fill
                        className="object-cover grayscale"
                      />
                      <div className="absolute top-3 right-3 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Expirada
                      </div>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{promo.name}</h3>
                    {promo.price && (
                      <p className="text-3xl font-bold text-gray-400 mb-3">
                        ${promo.price.toFixed(2)}
                      </p>
                    )}
                    <div className="text-sm text-gray-300">
                      <p>Expiró: {new Date(promo.end_date).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

