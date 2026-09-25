"use client"
import React, { useEffect, useState } from "react"
import SectionHeader from "@/components/ui/SectionHeader"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import useMembershipAccess from "@/hooks/useMembershipAccess"
import { getMaxPhotosForTier } from "@/lib/memberships/tiers"
import { normalizarWeb, normalizarRed } from "@/lib/negocios/enlaces"
import { topeDeFotos } from "@/lib/memberships/perks"
import Link from "next/link"
import Image from "next/image"
import type { Business } from "@/types/business"
import { CATEGORIAS, normalizarCategoria } from "@/lib/categorias"
import { toast } from "sonner"
import { Dialog } from "@/components/ui/Overlay"

// Simple ID generator
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export default function EditarNegocioPage() {
  const params = useParams()
  const id = (params as any)?.id as string
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const { effectiveTier } = useMembershipAccess()
  
  const [negocio, setNegocio] = useState<Business | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  // La web propia y las redes. En todos los planes, como el teléfono.
  const [website, setWebsite] = useState("")
  const [facebook, setFacebook] = useState("")
  const [instagram, setInstagram] = useState("")
  const [tiktok, setTiktok] = useState("")
  const [errorEnlaces, setErrorEnlaces] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [galleryError, setGalleryError] = useState("")

  // Verificar permisos
  const isOwner = user?.id === negocio?.owner_id
  const isAdmin = user?.user_metadata?.is_admin ?? false
  const canEdit = isOwner || isAdmin
  
  // El tope sale de la misma fuente que el resto de la app. Acá vivía una
  // escalera propia —3 gratis / 10 premium— que ya no coincidía con nada.
  const maxImages = negocio ? topeDeFotos(negocio, effectiveTier) : getMaxPhotosForTier(0)

  const getGalleryUrls = (): string[] =>
    // gallery_urls es text[] en la base. Antes esto tenía además una rama
    // JSON.parse porque la columna era TEXT con un array serializado.
    negocio?.gallery_urls ?? []

  const galleryUrls = getGalleryUrls()

  useEffect(() => {
    if (!id || !user) return
    
    const fetchNegocio = async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', id)
          .single()
          
        if (error) throw error

        // Verificar permisos
        const hasPermission = data.owner_id === user.id || user.user_metadata?.is_admin
        if (!hasPermission) {
          toast.error("No tienes permiso para editar este negocio")
          router.push("/app/dashboard")
          return
        }

        setNegocio(data)
        setName(data.name)
        setDescription(data.description ?? "")
        setCategory(normalizarCategoria(data.category) ?? "")
        setAddress(data.address ?? "")
        setPhone(data.phone ? String(data.phone) : "")
        setWhatsapp(data.whatsapp ? String(data.whatsapp) : "")
        setWebsite(data.website ?? "")
        setFacebook(data.facebook ?? "")
        setInstagram(data.instagram ?? "")
        setTiktok(data.tiktok ?? "")
      } catch (err: any) {
        console.error("Error cargando negocio:", err)
        toast.error("No se pudo cargar el negocio. Intenta de nuevo.")
        router.push("/app/dashboard")
      } finally {
        setLoading(false)
      }
    }
    
    fetchNegocio()
  }, [id, user, router])

  const uploadFile = async (file: File, folder: string) => {
    const idd = generateId()
    const ext = file.name.split('.').pop()
    const path = `${folder}/${idd}.${ext}`
    
    const { error: uploadError } = await supabase.storage
      .from(folder)
      .upload(path, file, { cacheControl: '3600', upsert: false })
      
    if (uploadError) throw uploadError
    
    const { data } = supabase.storage.from(folder).getPublicUrl(path)
    return data.publicUrl
  }

  // Manejador de cambio de galería con validación
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    setGalleryError("")
    
    if (files && files.length > 0) {
      // Calcular total: imágenes existentes + nuevas
      const currentImageCount = galleryUrls.length
      const totalImages = currentImageCount + files.length
      
      if (totalImages > maxImages) {
        setGalleryError(
          `⚠️ Tu plan permite ${maxImages} fotos. Ya tienes ${currentImageCount}, puedes agregar ${Math.max(0, maxImages - currentImageCount)} más.`
        )
        e.target.value = "" // Limpiar selección
        setGalleryFiles(null)
      } else {
        setGalleryFiles(files)
      }
    } else {
      setGalleryFiles(null)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!negocio) return
    
    setError("")
    
    /* Sigue haciendo falta al menos una forma de encontrar el negocio: una
       dirección escrita o un punto en el mapa. Lo que cambia es de dónde sale
       el segundo dato — del negocio ya guardado, no de este formulario, que
       dejó de editar coordenadas. El punto en el mapa se pone desde "Mi
       negocio", así que alguien que ya lo tenga puesto puede dejar la
       dirección en blanco sin que esto lo frene. */
    const tieneDireccion = address.trim().length > 0
    const tieneUbicacionEnMapa = negocio.latitude != null && negocio.longitude != null

    if (!tieneDireccion && !tieneUbicacionEnMapa) {
      setError("⚠️ Escribe una dirección, o activa la ubicación en el mapa desde «Mi negocio».")
      return
    }
    
    setSaving(true)
    
    try {
      /* Se normaliza ANTES de subir nada: si un enlace está mal escrito, es
         mejor decirlo antes de que el usuario espere a que suban las fotos.
         Un campo con texto que no se puede normalizar es un ERROR, no un null
         silencioso: borrarle el enlace sin avisar es peor que rechazarlo. */
      const enlaces = {
        website: normalizarWeb(website),
        facebook: normalizarRed("facebook", facebook),
        instagram: normalizarRed("instagram", instagram),
        tiktok: normalizarRed("tiktok", tiktok),
      }
      const malEscritos = (
        [
          ["Sitio web", website, enlaces.website],
          ["Facebook", facebook, enlaces.facebook],
          ["Instagram", instagram, enlaces.instagram],
          ["TikTok", tiktok, enlaces.tiktok],
        ] as const
      )
        .filter(([, escrito, normalizado]) => escrito.trim() && !normalizado)
        .map(([etiqueta]) => etiqueta)

      if (malEscritos.length > 0) {
        setErrorEnlaces(
          `Revisá ${malEscritos.join(", ")}: poné la dirección completa del perfil, o sólo el usuario.`
        )
        setLoading(false)
        return
      }
      setErrorEnlaces(null)

      let logoUrl = negocio.logo_url ?? null
      const gallery = [...galleryUrls]

      if (logoFile) {
        logoUrl = await uploadFile(logoFile, "logos")
      }

      if (galleryFiles && galleryFiles.length > 0) {
        for (let i = 0; i < galleryFiles.length; i++) {
          const f = galleryFiles[i]
          const url = await uploadFile(f, "business-gallery")
          gallery.push(url)
        }
      }

      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          name,
          description: description || null,
          category: category || null,
          address: address || null,
          phone: phone ? Number(phone) : null,
          whatsapp: whatsapp ? Number(whatsapp) : null,
          ...enlaces,
          logo_url: logoUrl,
          gallery_urls: gallery.length > 0 ? gallery : null,
          /* Sin latitude/longitude a propósito. Esta pantalla ya no las edita,
             y mandarlas desde un estado que siempre está vacío BORRARÍA la
             ubicación cada vez que alguien tocara cualquier otro campo. Una
             consulta sólo debe escribir lo que su pantalla gobierna. */
        })
        .eq('id', negocio.id)

      if (updateError) throw updateError

      // Show success overlay, refresh server cache, then navigate
      setSaveSuccess(true)
      toast.success("¡Negocio actualizado con éxito!", {
        description: "Los cambios ya son visibles para todos.",
        duration: 4000,
      })
      router.refresh()
      setTimeout(() => {
        router.push(`/app/dashboard/negocios/${negocio.id}`)
      }, 1600)
    } catch (err: any) {
      const msg = err?.message || "Error al guardar los cambios"
      setError(msg)
      toast.error("Hubo un problema al actualizar los datos.", {
        description: "Inténtalo de nuevo.",
      })
      console.error("[editar negocio] Error:", err)
    } finally {
      setSaving(false)
    }
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center surface-elevated rounded-3xl p-12 animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-ink-2 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!negocio || !canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center surface-elevated rounded-3xl p-12 animate-fadeIn">
          <h2 className="text-2xl font-bold text-ink mb-4">Acceso denegado</h2>
          <p className="text-ink-2 mb-6">No tienes permiso para editar este negocio</p>
          <Link 
            href="/app/dashboard"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full transition-all"
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
      <SectionHeader
        titulo="Editar negocio"
        subtitulo={negocio?.name}
        ancho="7xl"
        onVolver={() => router.back()}
        icono={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        }
      />

      {/* Contenido */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form Card */}
        <div className="surface rounded-3xl shadow-sm p-6 sm:p-8 lg:p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-ink mb-2">
                Nombre del negocio *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-ink mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500 resize-none sm:pb-3"
                disabled={loading}
              />
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-ink mb-2">
                Categoría
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
                disabled={loading}
              >
                <option value="">Elige una categoría</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dirección escrita. El punto en el mapa se pone desde "Mi
                negocio": es opcional, y al registrarse casi nadie está dentro
                de su local. */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="font-bold text-ink">Dirección</h3>
              </div>
              <p className="text-xs text-ink-2 mb-2">
                Cómo llegar a tu negocio, en palabras. Para que además se vea a
                qué distancia estás de quien te busca, activa la ubicación desde
                «Mi negocio».
              </p>

              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-ink mb-2">
                  📍 Dirección
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Calle Principal #123, Ciudad"
                  className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
                  disabled={loading}
                />
                {address && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Dirección completada
                  </p>
                )}
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-ink mb-2">
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 3001234567"
                className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-semibold text-ink mb-2">
                WhatsApp
              </label>
              <input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ej: 3001234567"
                className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            {/* ── La web propia y las redes ──────────────────────────────
                En todos los planes, como el teléfono. App Encuentra no viene
                a reemplazar el sitio de nadie: a quien ya tiene presencia le
                deja enlazarla para no perder la audiencia que ya se ganó. */}
            <div className="sm:col-span-2 pt-2 border-t border-black/8">
              <h3 className="text-sm font-semibold text-ink">Tu web y tus redes</h3>
              <p className="mt-1 text-xs text-ink-2">
                Opcional. Si ya tenés sitio o perfiles, enlazalos acá y
                aparecerán como botones en tu ficha. Podés escribir sólo tu
                usuario — por ejemplo <span className="font-mono">@minegocio</span>.
              </p>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-semibold text-ink mb-2">
                Sitio web
              </label>
              <input
                id="website"
                type="url"
                inputMode="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="minegocio.com"
                className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="facebook" className="block text-sm font-semibold text-ink mb-2">
                Facebook
              </label>
              <input
                id="facebook"
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="@minegocio"
                className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="instagram" className="block text-sm font-semibold text-ink mb-2">
                Instagram
              </label>
              <input
                id="instagram"
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@minegocio"
                className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="tiktok" className="block text-sm font-semibold text-ink mb-2">
                TikTok
              </label>
              <input
                id="tiktok"
                type="text"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="@minegocio"
                className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            {errorEnlaces && (
              <p className="sm:col-span-2 text-sm text-red-600">{errorEnlaces}</p>
            )}

            {/* Logo actual */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                Logo actual
              </label>
              {negocio.logo_url ? (
                <Image 
                  src={negocio.logo_url}
                  alt="Logo actual" 
                  className="w-32 h-32 object-cover rounded-2xl mb-3 border-2 border-black/10"
                  width={128}
                  height={128}
                />
              ) : (
                <div className="w-32 h-32 bg-black/5 rounded-2xl mb-3 flex items-center justify-center border-2 border-black/10">
                  <span className="text-ink-2 text-sm">Sin logo</span>
                </div>
              )}
              <label htmlFor="logo" className="block text-sm font-semibold text-ink mb-2">
                Subir nuevo logo (opcional)
              </label>
              <input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                className="w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                disabled={loading}
              />
            </div>

            {/* Galería */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                Galería actual
              </label>
              {galleryUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {galleryUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden rounded-xl border-2 border-black/10">
                      <Image 
                        src={url} 
                        alt={`Imagen ${idx + 1}`} 
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-2/70 mb-3">No hay imágenes en la galería</p>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-700">
                    <strong>Tip:</strong> Para gestionar tu galería completa (agregar/eliminar fotos), usa la sección{" "}
                    <Link href={`/app/dashboard/negocios/${negocio.id}/galeria`} className="underline font-semibold hover:text-blue-800">
                      Gestionar Galería
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href={`/app/dashboard/negocios/${negocio.id}`}
                className="flex-1 text-center border-2 border-black/15 text-ink-2 font-semibold py-3 px-6 rounded-2xl hover:bg-black/5 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Success Overlay — transitorio, navega solo tras ~1.6s ─────────── */}
      <Dialog
        open={saveSuccess}
        onClose={() => {}}
        closeOnBackdropClick={false}
        aria-label="Cambios guardados"
        panelClassName="flex flex-col items-center gap-5 bg-white border border-black/10 rounded-3xl px-10 py-10 shadow-2xl mx-4 max-w-sm w-full"
      >
        {/* Animated checkmark circle */}
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          {/* Outer pulse ring */}
          <span className="absolute w-20 h-20 rounded-full border-2 border-green-300 animate-ping opacity-40" />
        </div>

        <div className="text-center">
          <h3 className="text-xl font-bold text-ink mb-1">
            ¡Cambios guardados!
          </h3>
          <p className="text-sm text-ink-2">
            Tu negocio ha sido actualizado con éxito.
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{ animation: "progress-bar 1.5s linear forwards" }}
          />
        </div>

        <style>{`
          @keyframes progress-bar {
            from { width: 0% }
            to   { width: 100% }
          }
        `}</style>
      </Dialog>

    </div>
  )
}
