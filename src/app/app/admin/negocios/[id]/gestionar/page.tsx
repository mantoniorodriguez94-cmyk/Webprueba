"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import Image from "next/image"
import type { Business } from "@/types/business"

/**
 * Página de gestión completa del negocio para ADMIN
 * Permite al admin gestionar TODO del negocio como si fuera el dueño:
 * - Información básica
 * - Galería
 * - Horarios
 * - Promociones
 * - Eliminar negocio
 */

export default function AdminGestionarNegocioPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Estados del formulario
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")

  const loadBusiness = useCallback(async () => {
    if (!id) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      if (!data) throw new Error("Negocio no encontrado")

      setBusiness(data)
      setName(data.name || "")
      setDescription(data.description || "")
      setCategory(data.category || "")
      setAddress(data.address || "")
      setPhone(data.phone?.toString() || "")
      setWhatsapp(data.whatsapp?.toString() || "")
      setLatitude(data.latitude?.toString() || "")
      setLongitude(data.longitude?.toString() || "")
    } catch (err: any) {
      setError(err.message || "Error al cargar el negocio")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadBusiness()
  }, [loadBusiness])

  async function handleSave() {
    if (!business) return

    setSaving(true)
    setError("")

    try {
      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          name,
          description: description || null,
          category: category || null,
          address: address || null,
          phone: phone ? Number(phone) : null,
          whatsapp: whatsapp ? Number(whatsapp) : null,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null
        })
        .eq("id", id)

      if (updateError) throw updateError

      alert("✅ Negocio actualizado correctamente")
      loadBusiness() // Recargar datos
    } catch (err: any) {
      setError(err.message || "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!business) return

    setDeleting(true)
    setError("")

    try {
      // Eliminar el negocio
      const { error: deleteError } = await supabase
        .from("businesses")
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      alert("✅ Negocio eliminado correctamente")
      router.push("/app/admin/negocios")
    } catch (err: any) {
      setError(err.message || "Error al eliminar")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Cargando negocio...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Negocio no encontrado</p>
          <Link href="/app/admin/negocios" className="text-blue-400 hover:underline">
            Volver a la lista
          </Link>
        </div>
      </div>
    )
  }

  const galleryUrls = Array.isArray(business.gallery_urls) 
    ? business.gallery_urls 
    : business.gallery_urls 
      ? JSON.parse(business.gallery_urls || "[]")
      : []

  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-400 hover:text-blue-300 hover:underline mb-2 inline-flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
          <h1 className="text-3xl font-bold">Gestionar Negocio</h1>
          <p className="text-gray-400 mt-1">{business.name}</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Información Básica */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-bold mb-4">Información Básica</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Categoría</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Dirección</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Latitud</label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Longitud</label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>

        {/* Enlaces de gestión */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link
            href={`/app/dashboard/negocios/${id}/galeria`}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-blue-500 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold">Galería</h3>
            </div>
            <p className="text-sm text-gray-400">Gestionar fotos del negocio ({galleryUrls.length} fotos)</p>
          </Link>

          <Link
            href={`/app/dashboard/negocios/${id}/horarios`}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-blue-500 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold">Horarios</h3>
            </div>
            <p className="text-sm text-gray-400">Configurar horarios de atención</p>
          </Link>

          <Link
            href={`/app/dashboard/negocios/${id}/promociones`}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-blue-500 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold">Promociones</h3>
            </div>
            <p className="text-sm text-gray-400">Gestionar promociones activas</p>
          </Link>
        </div>

        {/* Zona de peligro - Eliminar negocio */}
        <div className="bg-red-500/10 backdrop-blur-md rounded-2xl p-6 border border-red-500/30">
          <h2 className="text-xl font-bold mb-4 text-red-400">Zona de Peligro</h2>
          <p className="text-gray-400 mb-4">
            Esta acción es permanente y no se puede deshacer. Se eliminará el negocio y todos sus datos asociados.
          </p>
          
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-colors"
            >
              Eliminar Negocio
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-red-300 font-medium">¿Estás seguro de que deseas eliminar este negocio?</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {deleting ? "Eliminando..." : "Sí, eliminar"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

