// src/app/dashboard/negocios/[id]/gestionar/page.tsx
"use client"
import React, { useEffect, useState } from "react"
import GestionEnlaces from "@/components/business/GestionEnlaces"
import SectionHeader from "@/components/ui/SectionHeader"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import useMembershipAccess from "@/hooks/useMembershipAccess"
import Link from "next/link"
import Image from "next/image"
import type { Business } from "@/types/business"
import { topeDeFotos, tienePromociones } from "@/lib/memberships/perks"
import { alertModal } from "@/lib/alertModal"
import { Popover } from "@/components/ui/Overlay"
import ConfirmationModal from "@/components/ui/ConfirmationModal"
import { MoreVertical, Trash2 } from "lucide-react"
import UbicacionModal from "@/components/business/UbicacionModal"
import { etiquetaDeCategoria } from "@/lib/categorias"

type Promotion = {
  id: string
  is_active: boolean
  start_date: string
  end_date: string
}

export default function GestionarNegocioPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [business, setBusiness] = useState<Business | null>(null)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Eliminar vivía en la lista de negocios como un botón rojo a todo el ancho,
  // a un solo toque. Borrar el único negocio de una cuenta es irreversible, así
  // que acá queda detrás de un menú y de una confirmación.
  /* La ubicación en el mapa se pone desde acá y no desde el alta, a propósito:
     es opcional, y al registrarse casi nadie está dentro de su local. Ofrecerla
     como un interruptor en el perfil del negocio deja que cada uno la active
     cuando le convenga —y que la corrija si se muda. */
  const [modalUbicacion, setModalUbicacion] = useState(false)

  const [menuAbierto, setMenuAbierto] = useState(false)
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)
  const [borrando, setBorrando] = useState(false)

  const eliminarNegocio = async () => {
    if (!business) return
    setBorrando(true)
    const { error } = await supabase.from("businesses").delete().eq("id", business.id)
    setBorrando(false)
    setConfirmarBorrado(false)
    if (error) {
      alertModal.error("No se pudo eliminar", { description: error.message })
      return
    }
    router.push("/app/dashboard/mis-negocios")
  }
  const businessId = params?.id as string

  const { effectiveTier, loading: tierLoading } = useMembershipAccess()

  const getGalleryUrls = (): string[] =>
    // gallery_urls es text[] en la base. Antes esto tenía además una rama
    // JSON.parse porque la columna era TEXT con un array serializado.
    business?.gallery_urls ?? []

  const galleryUrls = getGalleryUrls()

  // Contar promociones activas
  const activePromotionsCount = promotions.filter(p => {
    if (!p.is_active) return false
    const today = new Date()
    const start = new Date(p.start_date)
    const end = new Date(p.end_date)
    return start <= today && end >= today
  }).length

  // Cargar datos del negocio
  useEffect(() => {
    const fetchBusiness = async () => {
      if (!businessId || !user) return

      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", businessId)
          .single()

        if (error) throw error

        // Verificar que el usuario es el dueño
        if (data.owner_id !== user.id) {
          alertModal.warning("No tienes permiso para gestionar este negocio")
          // replace y no push: una pantalla que te rechaza no debe quedar en el
          // historial, o el "atrás" la monta de nuevo y te vuelve a rechazar.
          router.replace("/app/dashboard")
          return
        }

        setBusiness(data)

        // Cargar promociones
        const { data: promotionsData, error: promotionsError } = await supabase
          .from("promotions")
          .select("id, is_active, start_date, end_date")
          .eq("business_id", businessId)

        if (!promotionsError && promotionsData) {
          setPromotions(promotionsData)
        }

        // Cargar mensajes no leídos
        const { data: conversations, error: convError } = await supabase
          .from("conversations")
          .select("id")
          .eq("business_id", businessId)

        if (!convError && conversations && conversations.length > 0) {
          const conversationIds = conversations.map(c => c.id)
          const { data: unreadMessages, error: msgError } = await supabase
            .from("messages")
            .select("id")
            .in("conversation_id", conversationIds)
            .eq("is_read", false)
            .neq("sender_id", user.id) // No contar mensajes propios

          if (!msgError && unreadMessages) {
            setUnreadMessagesCount(unreadMessages.length)
          }
        }
      } catch (error) {
        console.error("Error cargando negocio:", error)
        alertModal.error("Error cargando el negocio")
        router.replace("/app/dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [businessId, user, router])

  const guardarUbicacion = async (latitud: number, longitud: number) => {
    if (!business) return

    const { error } = await supabase
      .from("businesses")
      .update({ latitude: latitud, longitude: longitud })
      .eq("id", business.id)

    if (error) throw error

    // Se refresca en memoria en vez de recargar la página: el botón tiene que
    // pasar de "Activar" a "Editar" en el momento, sin parpadeo.
    setBusiness({ ...business, latitude: latitud, longitude: longitud })
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

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center surface-elevated rounded-3xl p-12 animate-fadeIn">
          <h2 className="text-2xl font-bold text-ink mb-4">Negocio no encontrado</h2>
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

  /* Hacen falta las DOS. Una sola no ubica nada, y guardar media coordenada
     dejaría al negocio contando como "ubicado" sin salir nunca en el mapa. */
  const tieneUbicacion = business.latitude != null && business.longitude != null

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      {/* Desde que "Mi negocio" de la barra inferior enlaza directo acá, esta
          pantalla dejó de ser anidada y pasó a ser un destino más. Usa el
          mismo encabezado que el resto: antes tenía título más grande, otro
          desenfoque, sombra y un borde azul de 2px, así que se veía distinta
          de todas las demás. */}
      <SectionHeader
        onVolver={() => router.back()}
        volverSoloEscritorio
        titulo="Gestionar negocio"
        subtitulo={business.name}
        ancho="7xl"
        icono={
          <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        acciones={
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label="Más opciones"
              aria-haspopup="menu"
              aria-expanded={menuAbierto}
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-ink-2" />
            </button>

            <Popover open={menuAbierto} onClose={() => setMenuAbierto(false)} align="right">
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false)
                  setConfirmarBorrado(true)
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar negocio
              </button>
            </Popover>
          </div>
        }
      />

      {/* Oculto del directorio: el dueño sigue viendo su ficha —la política de
          la base lo exceptúa a propósito— precisamente para poder leer el
          motivo y corregir. Sin este aviso, su negocio desaparecería del
          directorio y él no tendría forma de saber por qué. */}
      {(business as { hidden_at?: string | null }).hidden_at && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-4 flex items-start gap-3">
            <svg className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            <div>
              <h3 className="font-bold text-orange-700">Tu negocio no aparece en el directorio</h3>
              <p className="text-sm text-orange-700/90 mt-1">
                {(business as { hidden_reason?: string | null }).hidden_reason ||
                  "Nuestro equipo lo retiró temporalmente."}
              </p>
              <p className="text-xs text-orange-700/80 mt-2">
                Sigues viendo y pudiendo editar tu ficha. Cuando corrijas lo
                indicado, escríbenos desde <a href="/soporte" className="font-semibold underline">Soporte</a> para revisarlo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banner de infracción (visible para el dueño) */}
      {business.infraction_status && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-bold text-red-700">Aviso importante</h3>
              <p className="text-sm text-red-700/90 mt-1">
                {business.infraction_reason || "Tu negocio tiene una observación del equipo. Por favor corrige lo indicado o contacta soporte."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info del Negocio - Card Principal */}
        <div className="surface rounded-3xl shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-blue-50 flex-shrink-0 ring-4 ring-black/5 shadow-sm">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-3xl">
                  {business.name[0]}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-ink mb-2">{business.name}</h2>
              {business.category && (
                <p className="text-ink-2 flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {etiquetaDeCategoria(business.category)}
                </p>
              )}
              {business.address && (
                <p className="group text-ink-2 flex items-center gap-2">
                  <svg className="w-5 h-5 group-hover:animate-pin-drop" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {business.address}
                </p>
              )}

              {/* Ubicación en el mapa: interruptor, no campo de formulario.
                  Mientras no esté puesta, el negocio no sale en las búsquedas
                  por cercanía —que es la función que distingue a la app—, así
                  que el aviso dice qué se está perdiendo en vez de limitarse a
                  ofrecer un botón sin contexto. Una vez puesta, el botón no
                  desaparece: cambia a "Editar", porque los negocios se mudan. */}
              {tieneUbicacion ? (
                <button
                  type="button"
                  onClick={() => setModalUbicacion(true)}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ink-2 hover:text-ink transition-colors"
                >
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Apareces en el mapa
                  <span className="text-blue-600 underline underline-offset-2">Editar ubicación</span>
                </button>
              ) : (
                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-ink mb-1">
                    Tu negocio todavía no aparece en el mapa
                  </p>
                  <p className="text-sm text-ink-2 mb-3">
                    Al activarla, quien vea tu negocio sabrá a qué distancia
                    está de ti. Puedes hacerlo ahora o cuando quieras.
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalUbicacion(true)}
                    className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-full transition-all font-semibold text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Activar ubicación
                  </button>
                </div>
              )}
            </div>

            {/* Botón Editar */}
            <Link
              href={`/app/dashboard/negocios/${business.id}/editar`}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full transition-all font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar Información
            </Link>
          </div>
        </div>

        {/* Grid de Funcionalidades */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          
          {/* Galería de Fotos */}
          {/* Tu web y tus redes.
              Ocupa las dos columnas porque no es una tarjeta que lleve a otra
              pantalla como las de abajo: se configura acá mismo, botón por
              botón. Los cuatro se ven siempre —los vacíos, apagados y con
              "Añadir"— para que se sepa que existen. En la ficha pública sólo
              salen los que estén puestos. */}
          <div className="surface rounded-3xl shadow-sm p-6 md:col-span-2">
            <h3 className="text-lg font-bold text-ink">Tu web y tus redes</h3>
            <p className="text-sm text-ink-2 mt-1 mb-4">
              Si ya tenés sitio o perfiles, enlazalos y aparecerán como botones
              en tu ficha. Tocá cualquiera para configurarlo.
            </p>
            <GestionEnlaces
              businessId={business.id}
              valores={{
                website: (business as any).website ?? null,
                facebook: (business as any).facebook ?? null,
                instagram: (business as any).instagram ?? null,
                tiktok: (business as any).tiktok ?? null,
              }}
              alGuardar={(clave, url) =>
                setBusiness((anterior) =>
                  anterior ? ({ ...anterior, [clave]: url } as Business) : anterior
                )
              }
            />
          </div>

          <div className="surface rounded-3xl shadow-sm p-6 hover:shadow-md hover:border-black/15 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">Galería de Fotos</h3>
                {/* El tope va junto al conteo: sin él, nadie sabe cuánto le
                    queda ni que su plan da más que el de al lado. */}
                <p className="text-sm text-ink-2">
                  {tierLoading
                    ? `${galleryUrls.length} foto${galleryUrls.length !== 1 ? "s" : ""}`
                    : `${galleryUrls.length} de ${topeDeFotos(business, effectiveTier)} fotos`}
                </p>
              </div>
            </div>
            <p className="text-ink-2 text-sm mb-4">
              Gestiona las imágenes de tu negocio. Puedes agregar, eliminar o reordenar fotos.
            </p>
            <Link
              href={`/app/dashboard/negocios/${business.id}/galeria`}
              className="block w-full text-center bg-purple-50 text-purple-700 px-4 py-2 rounded-xl hover:bg-purple-100 transition-colors font-semibold text-sm"
            >
              Gestionar Galería
            </Link>
          </div>

          {/* Mensajes/Chats */}
          <Link
            href={`/app/dashboard/negocios/${business.id}/mensajes`}
            className="block surface rounded-3xl shadow-sm p-6 hover:shadow-md hover:border-black/15 transition-all relative"
          >
            {unreadMessagesCount > 0 && (
              <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold min-w-[24px] h-6 px-2 rounded-full flex items-center justify-center animate-pulse">
                {unreadMessagesCount}
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">Mensajes</h3>
                <p className="text-sm text-ink-2">
                  {unreadMessagesCount > 0 
                    ? `${unreadMessagesCount} sin leer` 
                    : "Sistema activo"
                  }
                </p>
              </div>
            </div>
            <p className="text-ink-2 text-sm mb-4">
              Responde a las consultas de tus clientes y mantén la comunicación activa.
            </p>
            <div className="w-full bg-green-50 text-green-700 px-4 py-2 rounded-xl hover:bg-green-100 transition-colors font-semibold text-sm text-center">
              Ver Mensajes
            </div>
          </Link>

          {/* Estadísticas */}
          <Link
            href={`/app/dashboard/negocios/${business.id}/estadisticas`}
            className="block surface rounded-3xl shadow-sm p-6 hover:shadow-md hover:border-black/15 transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">Estadísticas</h3>
                <p className="text-sm text-ink-2">Análisis</p>
              </div>
            </div>
            <p className="text-ink-2 text-sm mb-4">
              Visualiza el rendimiento de tu negocio, visitas y más métricas importantes.
            </p>
            <div className="w-full text-center bg-blue-50 text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors font-semibold text-sm">
              Ver Estadísticas
            </div>
          </Link>

          {/* Horarios */}
          <div className="surface rounded-3xl shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">Horarios</h3>
                <p className="text-sm text-ink-2">Disponibilidad</p>
              </div>
            </div>
            <p className="text-ink-2 text-sm mb-4">
              Configura los días y horarios de atención de tu negocio.
            </p>
            <Link
              href={`/app/dashboard/negocios/${business.id}/horarios`}
              className="block w-full text-center bg-orange-50 text-orange-700 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors font-semibold text-sm"
            >
              Configurar Horarios
            </Link>
          </div>

          {/* Promociones */}
          <div className="surface rounded-3xl shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">Promociones</h3>
                <p className="text-sm text-ink-2">{activePromotionsCount} activa{activePromotionsCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <p className="text-ink-2 text-sm mb-3">
              Crea ofertas especiales y promociones para atraer más clientes.
            </p>
            {!tierLoading && (
              <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2.5 text-sm">
                {tienePromociones(business, effectiveTier) ? (
                  <p className="text-purple-700">
                    Tus promociones salen en la sección Promociones del inicio.
                  </p>
                ) : effectiveTier > 0 ? (
                  <p className="text-ink-2">
                    Tus promociones se ven en tu perfil. Con{" "}
                    <strong className="text-purple-700">Patrocina</strong> además salen
                    en la sección Promociones del inicio.
                  </p>
                ) : (
                  <p className="text-ink-2">
                    Necesitas un plan de pago para crear promociones.
                  </p>
                )}
              </div>
            )}
            <Link
              href={`/app/dashboard/negocios/${business.id}/promociones`}
              className="block w-full text-center bg-pink-50 text-pink-700 px-4 py-2 rounded-xl hover:bg-pink-100 transition-colors font-semibold text-sm"
            >
              Gestionar Promociones
            </Link>
          </div>

          {/* Configuración */}
          <div className="surface rounded-3xl shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">Configuración</h3>
                <p className="text-sm text-ink-2">General</p>
              </div>
            </div>
            <p className="text-ink-2 text-sm mb-4">
              Ajusta las configuraciones generales y preferencias de tu negocio.
            </p>
            <Link
              href={`/app/dashboard/negocios/${business.id}/editar`}
              className="block w-full text-center bg-gray-50 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors font-semibold text-sm"
            >
              Ir a Configuración
            </Link>
          </div>

        </div>
      </div>

      <UbicacionModal
        open={modalUbicacion}
        onClose={() => setModalUbicacion(false)}
        latitudInicial={business.latitude}
        longitudInicial={business.longitude}
        onGuardar={guardarUbicacion}
      />

      <ConfirmationModal
        open={confirmarBorrado}
        title="¿Eliminar este negocio?"
        description={`Esta acción es permanente y borra toda la información, galería y estadísticas de "${business.name}".`}
        loading={borrando}
        onClose={() => {
          if (borrando) return
          setConfirmarBorrado(false)
        }}
        onConfirm={() => {
          if (borrando) return
          void eliminarNegocio()
        }}
        confirmLabel="Eliminar definitivamente"
        cancelLabel="Cancelar"
      />
    </div>
  )
}
