// src/app/dashboard/negocios/[id]/promociones/page.tsx
"use client"
import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import Link from "next/link"
import type { Business } from "@/types/business"
import Image from "next/image"

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

export default function PromocionesPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [business, setBusiness] = useState<Business | null>(null)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const businessId = params?.id as string

  // Verificar permisos
  const isOwner = user?.id === business?.owner_id
  const isAdmin = user?.user_metadata?.is_admin ?? false
  const canManage = isOwner || isAdmin

  // Cargar datos del negocio y promociones
  useEffect(() => {
    const fetchData = async () => {
      if (!businessId || !user) return

      try {
        // Cargar negocio
        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", businessId)
          .single()

        if (businessError) throw businessError

        // Verificar permisos
        const hasPermission = businessData.owner_id === user.id || user.user_metadata?.is_admin
        if (!hasPermission) {
          alert("No tienes permiso para gestionar las promociones de este negocio")
          router.push("/app/dashboard")
          return
        }

        setBusiness(businessData)

        // Cargar promociones
        const { data: promotionsData, error: promotionsError } = await supabase
          .from("promotions")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })

        if (promotionsError) throw promotionsError
        setPromotions(promotionsData || [])
      } catch (error) {
        console.error("Error cargando datos:", error)
        alert("Error cargando datos")
        router.push("/app/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [businessId, user, router])

  // Eliminar promoción
  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta promoción?")) return

    try {
      const { error } = await supabase
        .from("promotions")
        .delete()
        .eq("id", id)

      if (error) throw error

      setPromotions(promotions.filter(p => p.id !== id))
      alert("✅ Promoción eliminada exitosamente")
    } catch (error: any) {
      console.error("Error eliminando promoción:", error)
      alert("❌ Error al eliminar la promoción")
    }
  }

  // Alternar estado activo/inactivo
  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("promotions")
        .update({ is_active: !currentState })
        .eq("id", id)

      if (error) throw error

      setPromotions(promotions.map(p => 
        p.id === id ? { ...p, is_active: !currentState } : p
      ))
    } catch (error: any) {
      console.error("Error actualizando promoción:", error)
      alert("❌ Error al actualizar la promoción")
    }
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/40 p-12 animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0288D1] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!business || !canManage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/40 p-12 animate-fadeIn">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso denegado</h2>
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

  const activePromotions = promotions.filter(p => p.is_active)

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
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-7 h-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  Promociones
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {business.name} • {activePromotions.length} activa{activePromotions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-full hover:shadow-xl transition-all font-semibold hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Nueva Promoción</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Lista de Promociones */}
        {promotions.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-white/40 p-12 text-center">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No hay promociones creadas</h3>
            <p className="text-gray-600 mb-6">Comienza creando promociones para atraer más clientes</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-full hover:shadow-xl transition-all font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Primera Promoción
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promotion) => (
              <PromotionCard
                key={promotion.id}
                promotion={promotion}
                onDelete={handleDelete}
                onToggleActive={toggleActive}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear Promoción */}
      {showCreateModal && (
        <CreatePromotionModal
          businessId={businessId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newPromotion) => {
            setPromotions([newPromotion, ...promotions])
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}

// Componente de Tarjeta de Promoción
function PromotionCard({ 
  promotion, 
  onDelete, 
  onToggleActive 
}: { 
  promotion: Promotion
  onDelete: (id: string) => void
  onToggleActive: (id: string, currentState: boolean) => void
}) {
  const isExpired = new Date(promotion.end_date) < new Date()
  const isUpcoming = new Date(promotion.start_date) > new Date()

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-2 border-white/40 overflow-hidden hover:shadow-2xl transition-all group">
      {/* Imagen */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-pink-100 to-pink-200">
        {promotion.image_url ? (
          <Image
            src={promotion.image_url}
            alt={promotion.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        )}
        
        {/* Badge de Estado */}
        <div className="absolute top-3 right-3">
          {isExpired ? (
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Expirada
            </span>
          ) : isUpcoming ? (
            <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Próximamente
            </span>
          ) : promotion.is_active ? (
            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Activa
            </span>
          ) : (
            <span className="bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Inactiva
            </span>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{promotion.name}</h3>
        
        {promotion.price && (
          <p className="text-2xl font-bold text-pink-600 mb-3">
            ${promotion.price.toFixed(2)}
          </p>
        )}

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <p className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              {new Date(promotion.start_date).toLocaleDateString('es-ES')} - {new Date(promotion.end_date).toLocaleDateString('es-ES')}
            </span>
          </p>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          {!isExpired && (
            <button
              onClick={() => onToggleActive(promotion.id, promotion.is_active)}
              className={`flex-1 px-4 py-2 rounded-xl transition-colors font-semibold text-sm ${
                promotion.is_active
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {promotion.is_active ? 'Desactivar' : 'Activar'}
            </button>
          )}
          <button
            onClick={() => onDelete(promotion.id)}
            className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-semibold text-sm"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

// Componente Modal de Crear Promoción
function CreatePromotionModal({ 
  businessId, 
  onClose, 
  onSuccess 
}: { 
  businessId: string
  onClose: () => void
  onSuccess: (promotion: Promotion) => void
}) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no debe superar los 5MB")
      return
    }

    if (!file.type.startsWith('image/')) {
      alert("Solo se permiten archivos de imagen")
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert("Por favor ingresa un nombre para la promoción")
      return
    }

    if (!startDate || !endDate) {
      alert("Por favor selecciona las fechas de la promoción")
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      alert("La fecha de fin debe ser posterior a la fecha de inicio")
      return
    }

    setCreating(true)

    try {
      let imageUrl = null

      // Subir imagen si existe
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${businessId}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('promotions-images')
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('promotions-images')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      // Crear promoción
      const { data, error } = await supabase
        .from("promotions")
        .insert({
          business_id: businessId,
          name: name.trim(),
          price: price ? parseFloat(price) : null,
          start_date: startDate,
          end_date: endDate,
          image_url: imageUrl,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      alert("✅ Promoción creada exitosamente")
      onSuccess(data)
    } catch (error: any) {
      console.error("Error creando promoción:", error)
      alert("❌ Error al crear la promoción: " + (error.message || "Error desconocido"))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border-2 border-white/40 w-full sm:max-w-2xl sm:m-4 max-h-[90vh] sm:max-h-[80vh] flex flex-col animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-6 text-white rounded-t-3xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Nueva Promoción</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre de la Promoción *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: 2x1 en pizzas"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
              required
            />
          </div>

          {/* Precio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Precio (Opcional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha de Fin *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Imagen de la Promoción
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-pink-500 transition-colors">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-xl" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 font-medium mb-1">Haz clic para subir una imagen</p>
                  <p className="text-sm text-gray-500">Máximo 5MB • JPG, PNG, GIF, WebP</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 bg-gray-50 rounded-b-3xl flex gap-4 flex-shrink-0 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-100 transition-colors font-semibold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={creating}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-2xl hover:shadow-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Crear Promoción
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

