// src/components/feed/BusinessFeedCard.tsx - REDISEÑO MOBILE PREMIUM
"use client"
import React, { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Business } from "@/types/business"
import type { User } from "@supabase/supabase-js"
import SendMessageModal from "@/components/messages/SendMessageModal"
import StarRating from "@/components/reviews/StarRating"
import BusinessLocation from "@/components/BusinessLocation"
import PremiumBadge, { PremiumBanner } from "@/components/ui/PremiumBadge"
import DistanceBadge from "@/components/ui/DistanceBadge"
import {
  trackBusinessInteraction,
  toggleBusinessSave,
  checkBusinessSaved,
} from "@/lib/analytics"
import { supabase } from "@/lib/supabaseClient"
import { tieneBordeDorado, tierVigenteDelDueno, viasDeContacto } from "@/lib/memberships/perks"
import { CORONA_POR_TIER } from "@/components/memberships/MembershipBadge"
import { Crown } from "lucide-react"
import { toast } from "sonner"
import { Dialog } from "@/components/ui/Overlay"
import { etiquetaDeCategoria } from "@/lib/categorias"

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMScgaGVpZ2h0PScxJyBmaWxsPSIjMTMxMzEzIiB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLz4="

interface BusinessFeedCardProps {
  business: Business
  currentUser?: User | null
  isAdmin?: boolean
  onDelete?: (id: string) => void
}

export default function BusinessFeedCard({ 
  business, 
  currentUser, 
  isAdmin = false,
  onDelete 
}: BusinessFeedCardProps) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  /** Healed tier/vencimiento cuando owner_id existe pero el join no trajo perfil */
  const [healedTier, setHealedTier] = useState<number | null>(null)
  const [healedEndDate, setHealedEndDate] = useState<string | null>(null)

  // Verificar si el negocio ya está guardado
  useEffect(() => {
    const checkSaved = async () => {
      if (currentUser && business.id) {
        const isSaved = await checkBusinessSaved(business.id, currentUser.id)
        setSaved(isSaved)
      }
    }
    checkSaved()
  }, [currentUser, business.id])
  
  const getGalleryUrls = (): string[] =>
    // gallery_urls es text[] en la base. Antes esto tenía además una rama
    // JSON.parse porque la columna era TEXT con un array serializado.
    business?.gallery_urls ?? []
  
  const gallery = getGalleryUrls()
  const isOwner = currentUser?.id === business.owner_id
  const canEdit = isOwner || isAdmin
  const canDelete = isOwner || isAdmin
  
  /* El corazón se quitó: prometía recordar y no recordaba. Su estado nacía en
     false y no se cargaba de ningún sitio, así que al recargar la página
     volvía a estar vacío — y estaba justo al lado del marcador de guardar,
     que sí persiste. Dos botones idénticos en peso, uno real y otro
     decorativo. Guardar ya cubre la misma intención, esa sí de verdad. */

  const handleSave = async () => {
    if (!currentUser) {
      toast.error("Debes iniciar sesión para guardar negocios")
      return
    }
    
    if (!business.id) return
    
    const newSavedState = await toggleBusinessSave(business.id, currentUser.id)
    setSaved(newSavedState)
  }
  
  const handleShare = async () => {
    if (business.id) {
      await trackBusinessInteraction(business.id, 'share', currentUser?.id)
    }
    
    // Copiar URL pública al portapapeles o compartir nativo (SEO-friendly)
    const url = `${window.location.origin}/negocio/${business.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: business.name,
          text: business.description || `Mira ${business.name} en App Encuentra`,
          url: url
        })
      } catch {
        // Usuario canceló o share no disponible
      }
    } else {
      // Fallback: copiar al portapapeles
      try {
        await navigator.clipboard.writeText(url)
        toast.success("Enlace copiado al portapapeles")
      } catch (err) {
        console.error("Error copiando enlace:", err)
        toast.error("No se pudo copiar el enlace")
      }
    }
  }
  
  const handleWhatsApp = () => {
    if (business.id) {
      trackBusinessInteraction(business.id, 'whatsapp', currentUser?.id)
    }
  }
  
  const handlePhone = () => {
    if (business.id) {
      trackBusinessInteraction(business.id, 'phone', currentUser?.id)
    }
  }
  
  const handleMessage = () => {
    if (!currentUser) {
      router.push("/app/auth/login")
      return
    }

    if (business.id) {
      trackBusinessInteraction(business.id, 'message', currentUser?.id)
    }
    setShowMessageModal(true)
  }
  
  const handleGalleryView = () => {
    if (business.id) {
      trackBusinessInteraction(business.id, 'gallery_view', currentUser?.id)
    }
    setShowGallery(true)
  }

  // Verificar si el negocio es premium activo
  const isPremiumActive = business.is_premium === true && 
                         business.premium_until && 
                         new Date(business.premium_until) > new Date()

  // ── Owner tier: profiles table is the SINGLE SOURCE OF TRUTH ────────────────
  // Prefer the batch-fetched `profiles` join; fall back to `owner` alias; then healed value.
  const businessTier =
    business?.profiles?.subscription_tier ??
    business?.owner?.subscription_tier ??
    0
  const businessEndDate =
    business?.profiles?.subscription_end_date ??
    business?.owner?.subscription_end_date ??
    null
  const rawOwnerTier = healedTier ?? businessTier
  const rawOwnerEndDate = healedTier != null ? healedEndDate : businessEndDate

  // ── El tier crudo puede estar vencido: no basta con leerlo ─────────────────
  // Encontrado en producción: una cuenta con subscription_tier=3 pero
  // subscription_end_date de hace cinco meses seguía mostrando el borde
  // dorado, el badge de Patrocinador y el contacto completo en el feed — los
  // mismos beneficios que un pago vigente. El resto de la app resuelve esto
  // con `effectiveTier` (useMembershipAccess.ts, "arquitectónicamente
  // imposible" dar acceso con un tier vencido), pero esta tarjeta leía el
  // valor crudo de la columna y nunca lo pasaba por esa comprobación.
  // tierVigenteDelDueno es la misma función que usa el resto del sistema: un
  // subscription_end_date null cuenta como vigencia indefinida (útil para
  // overrides manuales del panel), cualquier fecha pasada no.
  const ownerTier = tierVigenteDelDueno(rawOwnerTier, rawOwnerEndDate)

  // ── Borde dorado: plan Patrocina, o concesión manual vigente ──────────────
  // Un admin puede otorgarlo suelto por unos meses desde el panel, sin que la
  // cuenta tenga Patrocina. La regla suma, nunca resta: ver lib/memberships/perks.
  const ownerHasGoldenBorder = tieneBordeDorado(business, ownerTier)

  /* La escalera de contacto vive en lib/memberships/perks, no acá. Estaba
     escrita también en la ficha del dashboard y en la página pública, y el
     chat se quedó abierto para negocios sin plan justamente porque se corrigió
     en esta tarjeta y no en las otras dos.

     Se piden las tres vías juntas: pedirlas sueltas es lo que permitía tocar
     el chat y olvidarse de WhatsApp en el mismo archivo. */
  const contacto = viasDeContacto(rawOwnerTier, rawOwnerEndDate)
  const ownerHasWhatsApp = contacto.whatsapp
  const ownerHasChat = contacto.chat

  const isTier2 = ownerTier >= 2

  // ── Heal: lazy profile fetch when join data was absent ────────────────────
  // This covers edge cases where the batch join hadn't populated yet (e.g., new card).
  const healAttemptedForOwner = useRef<string | null>(null)
  useEffect(() => {
    if (!business.owner_id) return
    const hasTierFromData =
      business.profiles?.subscription_tier != null ||
      business.owner?.subscription_tier != null
    if (hasTierFromData) return
    if (healAttemptedForOwner.current === business.owner_id) return
    healAttemptedForOwner.current = business.owner_id
    let cancelled = false
    supabase
      .from("profiles")
      .select("subscription_tier, subscription_end_date")
      .eq("id", business.owner_id)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setHealedTier((data as any)?.subscription_tier ?? 0)
          setHealedEndDate((data as any)?.subscription_end_date ?? null)
        }
      })
    return () => { cancelled = true }
  }, [business.owner_id, business.profiles?.subscription_tier, business.owner?.subscription_tier])

  // ── Card border / glow style derived from authoritative profiles data ───────
  // Tarjeta blanca siempre — el tier se marca con borde/glow, nunca con un
  // campo de color grande. El magenta (Patrocina) es la única puntuación de
  // marca que aparece acá.
  const getTierStyles = () => {
    if (ownerHasGoldenBorder) {
      // Tier 3 (Patrocina) — dorado, igual que la tarjeta del plan
      return 'border-2 tier-patrocina-glow bg-white dark:bg-paper-2'
    } else if (isTier2) {
      // Tier 2: Silver border + custom silver glow class
      return 'border-2 tier-silver-glow bg-white dark:bg-paper-2'
    } else if (isPremiumActive) {
      // Legacy is_premium flag on the business row (may lag the profile)
      return 'border-2 border-amber-300 dark:border-amber-400/40 hover:border-amber-400 shadow-md shadow-amber-500/10 bg-white dark:bg-paper-2'
    } else {
      return 'border border-black/8 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 bg-white dark:bg-paper-2'
    }
  }

  return (
    <div className={`rounded-3xl overflow-hidden transition-all duration-300 animate-fade-in relative shadow-sm ${getTierStyles()}`}>
      {/* Banner Premium */}
      {isPremiumActive && <PremiumBanner />}
      
      {/* Header del negocio */}
      <div className="p-4">
        {/* flex-wrap: en un teléfono el nombre competía por el ancho con
            "Nuevo", "Admin" y los botones de editar y eliminar, que no
            encogen, y quedaba en "Pru...". Al envolver, las etiquetas bajan a
            su propia fila y el nombre recupera el ancho completo. En pantallas
            anchas caben todas en la misma línea y nada cambia. */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Logo del negocio */}
          <Link href={`/app/dashboard/negocios/${business.id}`} className="flex-shrink-0">
            <div className={`relative w-14 h-14 rounded-2xl overflow-hidden ${
              isPremiumActive
                ? 'bg-amber-50 border-2 border-amber-300 shadow-sm'
                : 'bg-blue-50 border-2 border-black/10'
            }`}>
              {business.logo_url && !imageError ? (
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  sizes="56px"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
            </div>
          </Link>

          {/* Info del negocio */}
          <div className="flex-1 min-w-0">
            <Link href={`/app/dashboard/negocios/${business.id}`}>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-ink truncate hover:text-blue-600 transition-colors">
                  {business.name}
                </h3>
                {/* Solo la corona dorada (Patrocina, tier 3). Bronce
                    (Conecta) y plata (Destaca) se ocultan a propósito: con
                    los tres tiers marcados, la corona dejaba de leerse como
                    un nivel especial y pasaba a ser ruido en casi cada
                    tarjeta del feed. */}
                {ownerTier === 3 && CORONA_POR_TIER[ownerTier] && (
                  <div
                    className={`flex items-center justify-center w-5 h-5 flex-shrink-0 rounded-full text-white ${CORONA_POR_TIER[ownerTier].solido}`}
                    title={CORONA_POR_TIER[ownerTier].etiqueta}
                    aria-label={`Plan ${CORONA_POR_TIER[ownerTier].etiqueta}`}
                  >
                    <Crown className="w-3 h-3" />
                  </div>
                )}
                {isPremiumActive && <PremiumBadge variant="small" showText={false} />}
              </div>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              {business.category && (
                <span className="text-sm text-ink-2 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {etiquetaDeCategoria(business.category)}
                </span>
              )}
              {/* El paréntesis importa. Escrito como `total_reviews && ...`,
                  con cero reseñas el && cortaba devolviendo 0 —no false— y
                  React pinta el número: era el "0" suelto que salía junto a
                  la categoría en todas las tarjetas sin reseñas. */}
              {(business.total_reviews ?? 0) > 0 && (
                <>
                  {business.category && <span className="text-black/20">•</span>}
                  <div className="flex items-center gap-1">
                    <StarRating rating={business.average_rating || 0} size="sm" />
                    <span className="text-sm text-ink-2 font-semibold">
                      {business.average_rating?.toFixed(1)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Etiquetas y acciones. En móvil ocupan su propia fila completa,
              alineadas a la derecha; en escritorio vuelven junto al nombre. */}
          <div className="flex items-center gap-2 w-full justify-end sm:w-auto">
          {business.created_at && isRecent(business.created_at) && (
            <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
              Nuevo
            </span>
          )}

          {/* Botones de Admin/Dueño */}
          {canEdit && (
            <div className="flex items-center gap-1">
              {isAdmin && !isOwner && (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                  Admin
                </span>
              )}
              <Link
                href={`/app/dashboard/negocios/${business.id}/editar`}
                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-all"
                title="Editar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>
              {canDelete && onDelete && (
                <button
                  onClick={() => onDelete(business.id)}
                  className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition-all"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Galería de imágenes - Scroll horizontal */}
      {gallery.length > 0 && (
        <div className="px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            {gallery.map((url: string, idx: number) => (
              <div
                key={idx}
                className="relative flex-shrink-0 w-32 h-32 overflow-hidden rounded-xl cursor-pointer group snap-start"
                onClick={handleGalleryView}
              >
                <Image
                  src={url}
                  alt={`${business.name} - imagen ${idx + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
            {gallery.length > 3 && (
              <div className="flex-shrink-0 w-32 h-32 bg-black/5 rounded-xl flex items-center justify-center">
                <button
                  onClick={handleGalleryView}
                  className="text-ink text-center"
                >
                  <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold">Ver todas</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Descripción */}
      {business.description && (
        <div className="px-4 py-3">
          <p className={`text-ink-2 leading-relaxed text-sm ${showFullDescription ? '' : 'line-clamp-3'}`}>
            {business.description}
          </p>
          {business.description.length > 150 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-blue-600 hover:text-blue-700 text-sm font-semibold mt-2 transition-colors"
            >
              {showFullDescription ? "Ver menos" : "Ver más"}
            </button>
          )}
        </div>
      )}

      {/* Información de contacto */}
      <div className="px-4 py-3 space-y-2 border-t border-black/8">
        {/* Ubicación con lógica inteligente */}
        {(business.address || (business.latitude && business.longitude)) && (
          <div className="flex items-center gap-2 flex-wrap">
            <BusinessLocation
              address={business.address}
              latitude={business.latitude}
              longitude={business.longitude}
              showIcon={true}
              variant="default"
            />
            {/* Badge de distancia */}
            {business.latitude && business.longitude && (
              <DistanceBadge
                latitude={business.latitude}
                longitude={business.longitude}
              />
            )}
          </div>
        )}

        {contacto.telefono && (business.phone || business.whatsapp) && (
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-ink-2">{business.phone || business.whatsapp}</span>
          </div>
        )}
      </div>

      {/* Barra de Acciones */}
      <div className="px-4 py-3 border-t border-black/8 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Mensaje */}
          {currentUser && !isOwner && ownerHasChat && (
            <button
              onClick={handleMessage}
              className="p-2 rounded-full transition-all text-ink-2 hover:bg-black/5 hover:text-blue-600"
              title="Enviar mensaje"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          )}

          {/* Compartir */}
          <button onClick={handleShare} className="p-2 rounded-full text-ink-2 hover:bg-black/5 hover:text-green-600 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>

        {/* Guardar */}
        <button
          onClick={handleSave}
          className={`p-2 rounded-full transition-all ${
            saved ? "bg-blue-50 text-blue-600" : "text-ink-2 hover:bg-black/5"
          }`}
        >
          <svg
            className={`w-6 h-6 transition-all ${saved ? "fill-current scale-110" : ""}`}
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
      </div>

      {/* Llamar lo tiene todo el mundo; WhatsApp desde Conecta.

          Acá había tres botones del mismo peso —los tres flex-1, los tres en
          negrita— y dos de ellos con el fondo lleno de color: un degradado
          verde con shadow-lg y el azul de marca con shadow-md. Eso rompía la
          regla cardinal de tailwind.config: un solo color saturado en
          pantalla, el azul, y reservado a la acción principal. El verde es
          semántico —activo, verificado, en línea— y como campo grande es un
          error declarado ahí mismo.

          Ahora hay una sola acción principal (Llamar, la única que existe en
          todas las fichas porque el teléfono no depende del plan), WhatsApp
          como acento verde tintado —se reconoce igual, sin ser una losa— y
          "Ver más" en neutro debajo.

          Lo de abajo además arregla que "Ver más" se partiera en dos líneas:
          con tres botones a un tercio del ancho no cabía, y la fila entera
          crecía y quedaba desigual. */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        <div className="flex gap-2">
        {ownerHasWhatsApp && business.whatsapp && (
          <a
            href={`https://wa.me/${business.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsApp}
            className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-semibold text-sm py-2.5 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp
          </a>
        )}
        {contacto.telefono && business.phone && (
          <a
            href={`tel:${business.phone}`}
            onClick={handlePhone}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm py-2.5 px-4 rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Llamar
          </a>
        )}
        </div>
        <Link
          href={`/app/dashboard/negocios/${business.id}`}
          className="w-full bg-black/[0.04] hover:bg-black/[0.07] text-ink-2 hover:text-ink font-semibold text-sm py-2.5 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
        >
          Ver más
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Modal de enviar mensaje — el negocio es quien paga el chat. */}
      {showMessageModal && currentUser && ownerHasChat && (
        <SendMessageModal
          business={business}
          currentUserId={currentUser.id}
          onClose={() => setShowMessageModal(false)}
          onSuccess={(businessId) => {
            router.push(`/app/dashboard/chat`)
          }}
        />
      )}

      {/* Modal de galería completa */}
      <Dialog
        open={showGallery && gallery.length > 0}
        onClose={() => setShowGallery(false)}
        aria-label={`Galería de ${business.name}`}
        panelClassName="max-w-4xl w-full max-h-[85vh] overflow-y-auto bg-black/95 border border-white/10 rounded-3xl p-4 sm:p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            Galería de {business.name}
          </h3>
          <button
            onClick={() => setShowGallery(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Grid de imágenes */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {gallery.map((url: string, idx: number) => (
            <div key={idx} className="relative aspect-square overflow-hidden rounded-lg bg-ink-3">
              <Image
                src={url}
                alt={`${business.name} - imagen ${idx + 1}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                unoptimized
              />
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  )
}

// Helper function to check if business is recent (within last 7 days)
function isRecent(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - created.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}
