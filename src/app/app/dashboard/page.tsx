// src/app/dashboard/page.tsx - REDISEÑO MOBILE-FIRST MODERNO
"use client"
import React, { useEffect, useState, useCallback, useRef } from "react"
import PromotionsSpotlight from "@/components/dashboard/PromotionsSpotlight"
import AuthGate from "@/components/auth/AuthGate"
import Image from "next/image"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import useUser from "@/hooks/useUser"
import useMembershipAccess from "@/hooks/useMembershipAccess"
import Link from "next/link"
import dynamic from "next/dynamic"
import type { Business } from "@/types/business"
import BusinessFeedCard from "@/components/feed/BusinessFeedCard"
import type { FilterState } from "@/components/feed/FilterSidebar"
import { containsText, normalizeText } from "@/lib/searchHelpers"
import SectionHeader from "@/components/ui/SectionHeader"
import MembershipBadge from "@/components/memberships/MembershipBadge"
import { getBadgeTypeForTier, getLabelForTier, isTierActive, type MembershipTier } from "@/lib/memberships/tiers"
import ConfirmationModal from "@/components/ui/ConfirmationModal"
import { Sheet, Dialog, Popover } from "@/components/ui/Overlay"
import { destinosPrincipales } from "@/lib/navegacion"
import { toast } from "sonner"

/* ── Por qué acá dice `*` y no una lista de columnas ───────────────────────
   Se intentó pedir sólo las columnas que la tarjeta usa, y dejó el feed vacío
   en producción. El motivo: varios campos que el tipo `Business` declara
   —total_reviews, average_rating, views_count, saved_count, shared_count,
   search_priority_boost, has_gold_border— NO son columnas de `businesses`.
   Llegan de la vista business_review_stats y de consultas aparte, y se
   fusionan más abajo. Pedirlos en el select hace que PostgREST rechace la
   consulta ENTERA, y el catch de abajo la convierte en lista vacía: ningún
   negocio, sin error visible.

   Si se vuelve a intentar, hay que sacar la lista del esquema real de la base
   —no del tipo de TypeScript, que mezcla columnas con campos fusionados— y
   probarla contra datos reales antes de subirla. El ahorro era del 25-30%; el
   techo de abajo es lo que de verdad protege. */
const COLUMNAS_FEED = "*"

/* Techo de seguridad, NO paginación.

   El filtrado, el orden y las pestañas se resuelven en memoria sobre la lista
   completa, así que la lista completa tiene que llegar. Esto sólo evita que el
   día que el catálogo crezca, cada apertura del dashboard se descargue la
   tabla entera sin que nadie se entere.

   Cuando se alcance el techo el feed dejaría de mostrar negocios en silencio,
   así que se avisa por consola. Esa advertencia es la señal de que toca
   paginar de verdad en el servidor, con los filtros como parámetros. */
const TECHO_FEED = 300

// Lazy-load de componentes pesados para mejorar performance
const FilterSidebar = dynamic(
  () => import("@/components/feed/FilterSidebar"),
  {
    ssr: false,
    loading: () => (
      <div className="surface rounded-3xl p-6 animate-pulse">
        <div className="h-6 w-24 bg-black/5 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-black/5 rounded-2xl" />
          ))}
        </div>
      </div>
    ),
  }
)

const RightSidebar = dynamic(
  () => import("@/components/dashboard/RightSidebar"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="surface rounded-2xl p-5 shadow-sm animate-pulse">
            <div className="h-6 w-32 bg-black/5 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black/5 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-black/5 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-black/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  }
)

export default function DashboardPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParamsInitial = useSearchParams()
  const { user, loading: userLoading } = useUser()
  const { effectiveTier, loading: tierLoading } = useMembershipAccess()
  const currentBadgeType = getBadgeTypeForTier(effectiveTier as MembershipTier)
  
  // Leer parámetros de URL para filtros de ubicación
  const stateIdParam = searchParamsInitial.get("state_id") ? parseInt(searchParamsInitial.get("state_id")!) : null
  const municipalityIdParam = searchParamsInitial.get("municipality_id") ? parseInt(searchParamsInitial.get("municipality_id")!) : null
  
  const [negocios, setNegocios] = useState<Business[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const deleteTimeoutRef = useRef<number | null>(null)
  const pendingUndoBusinessRef = useRef<Business | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: searchParamsInitial.get("search") || "",
    category: searchParamsInitial.get("category") || "Todos",
    location: "", // Deprecated, mantener para compatibilidad
    state_id: stateIdParam,
    municipality_id: municipalityIdParam,
    sortBy: (searchParamsInitial.get("sortBy") as "recent" | "name" | "popular") || "recent"
  })
  const [activeTab, setActiveTab] = useState<"feed" | "destacados" | "recientes">("feed")
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showBusinessMenu, setShowBusinessMenu] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)

  // La barra inferior enlaza acá con ?buscar=1 para abrir el buscador: es un
  // destino de navegación, no un botón local, así que tiene que viajar en la
  // URL. Se limpia el parámetro para que recargar o compartir el enlace no
  // reabra el modal.
  useEffect(() => {
    if (searchParamsInitial?.get("buscar") === "1") {
      setShowSearchModal(true)
      window.history.replaceState({}, "", "/app/dashboard")
    }
  }, [searchParamsInitial])
  const [showFilters, setShowFilters] = useState(false)
  const [unreadMessagesByBusiness, setUnreadMessagesByBusiness] = useState<Record<string, number>>({})
  const [unreadMessagesPersonCount, setUnreadMessagesPersonCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Scroll infinito
  const ITEMS_PER_PAGE = 10 // Cargar 10 más cada vez
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE) // Mostrar 10 negocios inicialmente
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  // Resetear contador cuando cambia la pestaña
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE)
  }, [activeTab])
  
  // Calcular el límite de negocios permitidos y rol del usuario
  const userRole = user?.user_metadata?.role ?? "person"
  const isCompany = userRole === "company"
  const allowedBusinesses = isCompany 
    ? (isAdmin ? 999 : (user?.user_metadata?.allowed_businesses ?? 5))
    : 0
  const canCreateMore = isCompany && (isAdmin || negocios.length < allowedBusinesses)

  // Menú del avatar: los MISMOS destinos que la barra inferior.
  // En escritorio la barra está oculta (`lg:hidden`), así que este menú es la
  // navegación principal y tiene que ofrecer lo mismo. La lista sale de
  // src/lib/navegacion.ts, compartida con la barra, para que agregar un
  // destino en un sitio no deje al otro desactualizado.
  const totalNoLeidos =
    unreadMessagesPersonCount +
    Object.values(unreadMessagesByBusiness).reduce((suma, n) => suma + n, 0)

  const destinosMenu = destinosPrincipales({
    isCompany,
    pathname,
    unreadCount: totalNoLeidos,
    // Un dueño entra a la bandeja de su negocio, no a la suya como cliente.
    messagesHref: isCompany ? "/app/dashboard/chat?tab=negocio" : "/app/dashboard/chat",
    miNegocioHref: negocios[0]?.id
      ? `/app/dashboard/negocios/${negocios[0].id}/gestionar`
      : undefined,
  })

  // ============================================================
  // 🔥 DETECTAR SI EL USUARIO ES ADMIN (desde tabla profiles)
  // ============================================================
  // ⚠️ IMPORTANTE: Usamos API route para leer is_admin desde profiles
  // NO desde user_metadata que puede estar desincronizado
  useEffect(() => {
    const loadAdminFlag = async () => {
      if (!user) {
        setIsAdmin(false)
        return
      }

      try {
        // Usar API route del servidor para leer is_admin desde profiles
        // ⚠️ IMPORTANTE: Usar ruta relativa (no URL absoluta) para que funcione en local y producción
        const response = await fetch('/api/user/is-admin', {
          cache: 'no-store' // Evitar cache
        })
        const data = await response.json()
        
        if (data.isAdmin === true) {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
          if (data.error) {
            console.warn('⚠️ Error verificando admin:', data.error)
          }
        }
      } catch (error) {
        console.error('❌ Error verificando admin en dashboard:', error)
        setIsAdmin(false)
      }
    }

    loadAdminFlag()
  }, [user])
  
  const fetchNegocios = useCallback(async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setNegocios(data ?? [])
      
      if (data && data.length > 0) {
        await fetchUnreadMessages(data.map(b => b.id))
      }
    } catch (err: any) {
      console.error("Error fetching user businesses:", err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])
  
  const fetchUnreadMessages = useCallback(async (businessIds: string[]) => {
    if (!user || businessIds.length === 0) return
    
    try {
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("id, business_id")
        .in("business_id", businessIds)
      
      if (convError) throw convError
      if (!conversations || conversations.length === 0) return
      
      const conversationIds = conversations.map(c => c.id)
      const { data: unreadMessages, error: msgError } = await supabase
        .from("messages")
        .select("id, conversation_id")
        .in("conversation_id", conversationIds)
        .eq("is_read", false)
        .neq("sender_id", user.id)
      
      if (msgError) throw msgError
      
      const unreadCounts: Record<string, number> = {}
      conversations.forEach(conv => {
        const count = unreadMessages?.filter(msg => msg.conversation_id === conv.id).length || 0
        if (count > 0) {
          unreadCounts[conv.business_id] = (unreadCounts[conv.business_id] || 0) + count
        }
      })
      
      setUnreadMessagesByBusiness(unreadCounts)
    } catch (err: any) {
      console.error("Error fetching unread messages:", err)
    }
  }, [user])
  
  const fetchUnreadMessagesForPerson = useCallback(async () => {
    if (!user) return
    
    try {
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
      
      if (convError) throw convError
      if (!conversations || conversations.length === 0) {
        setUnreadMessagesPersonCount(0)
        return
      }
      
      const conversationIds = conversations.map(c => c.id)
      const { data: unreadMessages, error: msgError } = await supabase
        .from("messages")
        .select("id")
        .in("conversation_id", conversationIds)
        .eq("is_read", false)
        .neq("sender_id", user.id)
      
      if (msgError) throw msgError
      
      setUnreadMessagesPersonCount(unreadMessages?.length || 0)
    } catch (err: any) {
      console.error("Error fetching unread messages for person:", err)
    }
  }, [user])

  const fetchAllBusinesses = useCallback(async (stateId?: number | null, municipalityId?: number | null) => {
    setLoading(true)
    type OwnerProfile = {
      subscription_tier: number | null
      /** null = concesión indefinida de admin; si no, debe estar en el futuro */
      subscription_end_date: string | null
    }
    type Row = Record<string, unknown> & {
      owner_id?: string | null
      owner?: { subscription_tier?: number | null } | null
      profiles?: Partial<OwnerProfile> | null
    }
    let rawRows: Row[] | null = null

    try {
      // Fetch businesses directly (no join — more reliable)
      let query = supabase.from("businesses").select(COLUMNAS_FEED)
      if (stateId) query = query.eq("state_id", stateId)
      if (municipalityId) query = query.eq("municipality_id", municipalityId)

      const { data: businesses, error: businessError } = await query
        .order("created_at", { ascending: false })
        .limit(TECHO_FEED)

      if (businessError) {
        // Un fallo acá se veía EXACTAMENTE igual que "no hay negocios": lista
        // vacía y un mensaje en una consola que nadie mira. Así pasó
        // desapercibido que el feed estaba caído mientras los negocios existían
        // y se veían en el panel. Ahora se dice en pantalla.
        console.error("[feed] La consulta de negocios falló:", businessError)
        toast.error("No se pudieron cargar los negocios. Recarga la página.")
        rawRows = []
      } else {
        // Con una lista de columnas en cadena, Supabase no puede inferir la
        // forma de la fila, así que el casteo pasa por unknown.
        rawRows = (businesses ?? null) as unknown as Row[] | null

        // El techo recorta en silencio: sin este aviso, el día que el catálogo
        // lo alcance simplemente dejarían de aparecer negocios y nadie sabría
        // por qué. Es la señal de que toca paginar en el servidor.
        if (rawRows && rawRows.length >= TECHO_FEED) {
          console.warn(
            `[feed] Se alcanzó el techo de ${TECHO_FEED} negocios. ` +
            `Hay negocios que no se están mostrando: toca paginar en el servidor.`
          )
        }
      }

    const rows = rawRows ?? []
    // Batch-fetch owner profiles — profiles table is the SINGLE SOURCE OF TRUTH
    // for the account subscription tier and its expiry.
    const ownerIds = [...new Set(rows.map(b => b.owner_id).filter(Boolean) as string[])]
    const profilesMap = new Map<string, OwnerProfile>()
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, subscription_tier, subscription_end_date")
        .in("id", ownerIds)
      profiles?.forEach(p => profilesMap.set(p.id, {
        subscription_tier: (p as any).subscription_tier ?? null,
        subscription_end_date: (p as any).subscription_end_date ?? null,
      }))
    }

    const defaultProfile: OwnerProfile = {
      subscription_tier: 0,
      subscription_end_date: null,
    }

    const normalizedBusinesses: Business[] = rows.map(business => {
      const hasOwner = Boolean(business.owner_id)
      const ownerProfile = hasOwner ? (profilesMap.get(business.owner_id!) ?? defaultProfile) : null
      return {
        ...business,
        // `profiles` carries the authoritative tier — components should read from here
        profiles: ownerProfile,
        // `owner` is a lighter alias kept for backward compat
        owner: ownerProfile
          ? {
              subscription_tier: ownerProfile.subscription_tier,
              subscription_end_date: ownerProfile.subscription_end_date,
            }
          : null,
      } as Business
    })

      try {
        // Obtener estadísticas de reviews
        // Sólo las tres columnas que se usan, y el mismo techo: esta vista
        // tiene una fila por negocio con reseñas, así que crece igual que el
        // feed.
        const { data: stats, error: statsError } = await supabase
          .from("business_review_stats")
          .select("business_id, total_reviews, average_rating")
          .limit(TECHO_FEED)
        
        // Obtener conteo de visitas por negocio
        // Solo intentar si el usuario está autenticado
        let viewsData = null
        let savesData = null
        let sharesData = null
        
        if (user) {
          try {
            const viewsResponse = await supabase
              .from("business_views")
              .select("business_id")
            
            if (!viewsResponse.error) {
              viewsData = viewsResponse.data
            } else {
              console.warn("No se pudieron obtener vistas (puede ser por permisos):", viewsResponse.error.message)
            }
          } catch (err) {
            console.warn("Error obteniendo vistas:", err)
          }
          
          try {
            const savesResponse = await supabase
              .from("business_saves")
              .select("business_id")
            
            if (!savesResponse.error) {
              savesData = savesResponse.data
            } else {
              console.warn("No se pudieron obtener guardados:", savesResponse.error.message)
            }
          } catch (err) {
            console.warn("Error obteniendo guardados:", err)
          }
          
          try {
            const sharesResponse = await supabase
              .from("business_interactions")
              .select("business_id")
              .eq("interaction_type", "share")
            
            if (!sharesResponse.error) {
              sharesData = sharesResponse.data
            } else {
              console.warn("No se pudieron obtener compartidos:", sharesResponse.error.message)
            }
          } catch (err) {
            console.warn("Error obteniendo compartidos:", err)
          }
        }
        
        // Crear mapas de conteos (manejar casos donde los datos son null)
        const viewsMap = new Map<string, number>()
        if (viewsData) {
          viewsData.forEach(v => {
            viewsMap.set(v.business_id, (viewsMap.get(v.business_id) || 0) + 1)
          })
        }
        
        const savesMap = new Map<string, number>()
        if (savesData) {
          savesData.forEach(s => {
            savesMap.set(s.business_id, (savesMap.get(s.business_id) || 0) + 1)
          })
        }
        
        const sharesMap = new Map<string, number>()
        if (sharesData) {
          sharesData.forEach(sh => {
            sharesMap.set(sh.business_id, (sharesMap.get(sh.business_id) || 0) + 1)
          })
        }
        
        const statsMap = new Map(stats?.map(s => [s.business_id, s]) || [])
        
        const businessesWithStats = normalizedBusinesses.map(business => ({
          ...business,
          total_reviews: statsMap.get(business.id)?.total_reviews || 0,
          average_rating: statsMap.get(business.id)?.average_rating || 0,
          views_count: viewsMap.get(business.id) || 0,
          saved_count: savesMap.get(business.id) || 0,
          shared_count: sharesMap.get(business.id) || 0
        }))
        
        // Ordenar: Prioridad búsqueda (admin) > tier dueño > premium > fecha
        const sortedBusinesses = businessesWithStats.sort((a, b) => {
          const now = new Date()
          const aIsPremium = a.is_premium && (!a.premium_until || new Date(a.premium_until) > now)
          const bIsPremium = b.is_premium && (!b.premium_until || new Date(b.premium_until) > now)
          const aBoost = a.search_priority_boost === true
          const bBoost = b.search_priority_boost === true
          if (aBoost && !bBoost) return -1
          if (!aBoost && bBoost) return 1
          // Mismo bug que el borde dorado de la tarjeta: el tier crudo puede
          // estar vencido. Sin isTierActive, una cuenta que dejó de pagar
          // hace meses seguía ordenándose por encima de un negocio con un
          // plan menor pero VIGENTE, por el solo hecho de que el número
          // guardado era más alto.
          const rawTierA = (a.owner?.subscription_tier ?? a.profiles?.subscription_tier) ?? 0
          const rawTierB = (b.owner?.subscription_tier ?? b.profiles?.subscription_tier) ?? 0
          const endA = a.owner?.subscription_end_date ?? a.profiles?.subscription_end_date ?? null
          const endB = b.owner?.subscription_end_date ?? b.profiles?.subscription_end_date ?? null
          const tierA = isTierActive(rawTierA, endA) ? rawTierA : 0
          const tierB = isTierActive(rawTierB, endB) ? rawTierB : 0
          if (tierA !== tierB) return tierB - tierA
          if (aIsPremium && !bIsPremium) return -1
          if (!aIsPremium && bIsPremium) return 1
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        })
        
        setAllBusinesses(sortedBusinesses)
        setFilteredBusinesses(sortedBusinesses)
      } catch {
        const businessesWithDefaults = normalizedBusinesses.map((business: Business) => ({
          ...business,
          total_reviews: 0,
          average_rating: 0,
          views_count: 0,
          saved_count: 0,
          shared_count: 0
        }))
        
        const sortedBusinesses = businessesWithDefaults.sort((a: Business, b: Business) => {
          const now = new Date()
          const aIsPremium = a.is_premium && (!a.premium_until || new Date(a.premium_until) > now)
          const bIsPremium = b.is_premium && (!b.premium_until || new Date(b.premium_until) > now)
          const aBoost = a.search_priority_boost === true
          const bBoost = b.search_priority_boost === true
          if (aBoost && !bBoost) return -1
          if (!aBoost && bBoost) return 1
          if (aIsPremium && !bIsPremium) return -1
          if (!aIsPremium && bIsPremium) return 1
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        })
        
      setAllBusinesses(sortedBusinesses)
      setFilteredBusinesses(sortedBusinesses)
    }
  } catch (err: unknown) {
    console.error("[CRITICAL DEBUG]", err)
    if (err instanceof Error) console.error("[dashboard] Stack trace:", err.stack)
    console.error("[dashboard] Error details:", JSON.stringify(err, null, 2))
    
    // Asegurar que siempre hay un array, incluso en caso de error
    setAllBusinesses([])
    setFilteredBusinesses([])
  } finally {
    setLoading(false)
  }
}, [user])

  useEffect(() => {
    if (user) {
      if (isCompany) {
        fetchNegocios()
      } else {
        fetchUnreadMessagesForPerson()
      }
      fetchAllBusinesses(stateIdParam, municipalityIdParam)
    }
  }, [user, isCompany, fetchNegocios, fetchAllBusinesses, fetchUnreadMessagesForPerson, stateIdParam, municipalityIdParam])
  
  // Recargar negocios cuando la página recibe foco (útil después de crear un negocio)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchAllBusinesses(stateIdParam, municipalityIdParam)
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, fetchAllBusinesses, stateIdParam, municipalityIdParam])
  
  useEffect(() => {
    if (!user || !isCompany || negocios.length === 0) return
    
    const interval = setInterval(() => {
      fetchUnreadMessages(negocios.map(b => b.id))
    }, 30000)
    
    return () => clearInterval(interval)
  }, [user, isCompany, negocios, fetchUnreadMessages])
  
  useEffect(() => {
    if (!user || isCompany) return
    
    const interval = setInterval(() => {
      fetchUnreadMessagesForPerson()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [user, isCompany, fetchUnreadMessagesForPerson])

  useEffect(() => {
    let filtered = [...allBusinesses]

    if (filters.searchTerm) {
      filtered = filtered.filter(b => {
        const searchableTexts = [
          b.name || "",
          b.description || "",
          b.address || "",
          b.category || ""
        ]
        
        return searchableTexts.some(text => 
          containsText(text, filters.searchTerm)
        )
      })
    }

    if (filters.category && filters.category !== "Todos") {
      filtered = filtered.filter(b =>
        normalizeText(b.category || "") === normalizeText(filters.category)
      )
    }

    // Nota: Los filtros de state_id y municipality_id ya se aplican en fetchAllBusinesses
    // Solo mantener el filtro de location (texto) para compatibilidad si existe
    if (filters.location) {
      filtered = filtered.filter(b =>
        containsText(b.address || "", filters.location)
      )
    }

    // Helper para verificar si un negocio tiene premium activo
    const isPremiumActive = (business: Business) => {
      const now = new Date()
      return business.is_premium && (!business.premium_until || new Date(business.premium_until) > now)
    }

    // Ordenar según el criterio seleccionado, pero siempre con premium primero
    filtered.sort((a, b) => {
      // Premium siempre primero
      const aIsPremium = isPremiumActive(a)
      const bIsPremium = isPremiumActive(b)
      
      if (aIsPremium && !bIsPremium) return -1
      if (!aIsPremium && bIsPremium) return 1
      
      // Dentro del mismo grupo (premium o no), aplicar el orden seleccionado
      switch (filters.sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "popular":
        case "recent":
        default:
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          return dateB - dateA
      }
    })

    setFilteredBusinesses(filtered)
    // Resetear contador cuando cambian los filtros
    setVisibleCount(ITEMS_PER_PAGE)
  }, [filters, allBusinesses, ITEMS_PER_PAGE])

  // Intersection Observer para scroll infinito (debe estar antes de los early returns)
  useEffect(() => {
    // Calcular displayedBusinesses aquí para el useEffect
    const displayedBusinesses = 
      activeTab === "destacados" ? allBusinesses.filter((business) => {
        const isFeatured = business.is_featured === true
        const now = new Date()
        const featuredUntil = business.featured_until 
          ? new Date(business.featured_until) 
          : null
        return isFeatured && (featuredUntil === null || featuredUntil > now)
      }) :
      activeTab === "recientes" ? allBusinesses.filter((business) => {
        if (!business.created_at) return false
        const created = new Date(business.created_at)
        const now = new Date()
        const diffTime = now.getTime() - created.getTime()
        const diffDays = diffTime / (1000 * 60 * 60 * 24)
        return diffDays >= 0 && diffDays < 7
      }) :
      filteredBusinesses

    const hasMore = visibleCount < displayedBusinesses.length

    if (!loadMoreRef.current || !hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true)
          // Simular carga con un pequeño delay para mejor UX
          setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, displayedBusinesses.length))
            setIsLoadingMore(false)
          }, 300)
        }
      },
      { threshold: 0.1, rootMargin: '100px' } // Cargar 100px antes de llegar al final
    )
    
    observer.observe(loadMoreRef.current)
    
    return () => observer.disconnect()
  }, [isLoadingMore, visibleCount, activeTab, allBusinesses, filteredBusinesses, ITEMS_PER_PAGE])

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  // Eliminación real en Supabase (se llama solo después de la ventana de deshacer)
  const performDelete = async (id: string) => {
    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", id)

    if (error) throw error
  }

  const scheduleDeleteWithUndo = (businessId: string) => {
    const business = allBusinesses.find((b) => b.id === businessId)
    if (!business) {
      return
    }

    pendingUndoBusinessRef.current = business

    // Eliminación optimista en la UI
    setNegocios((prev) => prev.filter((x) => x.id !== businessId))
    setAllBusinesses((prev) => prev.filter((x) => x.id !== businessId))
    setFilteredBusinesses((prev) => prev.filter((x) => x.id !== businessId))

    const UNDO_DURATION = 6000

    const timeoutId = window.setTimeout(async () => {
      deleteTimeoutRef.current = null
      setDeletingId(businessId)
      try {
        await performDelete(businessId)
        toast.success("Negocio eliminado definitivamente")
      } catch (err: any) {
        console.error("[Dashboard] Error eliminando negocio:", err)
        // Restaurar el negocio si la eliminación final falla
        if (pendingUndoBusinessRef.current) {
          const restored = pendingUndoBusinessRef.current
          setNegocios((prev) => [restored, ...prev])
          setAllBusinesses((prev) => [restored, ...prev])
          setFilteredBusinesses((prev) => [restored, ...prev])
        }
        toast.error("Error eliminando el negocio", {
          description: err?.message ?? String(err),
        })
      } finally {
        setDeletingId(null)
        pendingUndoBusinessRef.current = null
      }
    }, UNDO_DURATION)

    deleteTimeoutRef.current = timeoutId

    toast("Negocio eliminado", {
      description: "Tienes 6 segundos para deshacer esta acción antes de que sea permanente.",
      duration: UNDO_DURATION,
      action: {
        label: "DESHACER",
        onClick: () => {
          if (deleteTimeoutRef.current !== null) {
            window.clearTimeout(deleteTimeoutRef.current)
            deleteTimeoutRef.current = null
          }

          if (pendingUndoBusinessRef.current) {
            const restored = pendingUndoBusinessRef.current
            setNegocios((prev) => [restored, ...prev])
            setAllBusinesses((prev) => [restored, ...prev])
            setFilteredBusinesses((prev) => [restored, ...prev])
            pendingUndoBusinessRef.current = null
          }

          toast.success("Eliminación cancelada. El negocio se ha mantenido intacto.")
        },
      },
    })
  }

  // Recibir petición de borrado desde la tarjeta: solo abre el modal de confirmación
  const handleDelete = (id: string) => {
    const business = allBusinesses.find((b) => b.id === id)
    if (!business) return
    setPendingDelete({ id: business.id, name: business.name || "Negocio" })
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-ink-2 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthGate accion="ver los negocios" />
  }

  // DESTACADOS: Negocios con interacciones reales O premium activo
  // DESTACADOS: Solo negocios manualmente destacados por administrador
  // - is_featured = true Y featured_until > now
  // - NO incluir negocios premium (solo destacados manualmente)
  const featuredBusinesses = allBusinesses
    .filter((business) => {
      // Verificar si está destacado manualmente
      const isFeatured = business.is_featured === true
      
      // Verificar que la fecha de destacado no haya expirado
      const now = new Date()
      const featuredUntil = business.featured_until 
        ? new Date(business.featured_until) 
        : null
      
      const isFeaturedActive = isFeatured && 
        (featuredUntil === null || featuredUntil > now)
      
      // SOLO incluir si está destacado y activo
      // EXCLUIR completamente los premium de esta sección
      return isFeaturedActive
    })
    .sort((a, b) => {
      // Ordenar por fecha de creación (más recientes primero)
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
  
  // RECIENTES: Negocios creados en los últimos 7 días
  const recentBusinesses = allBusinesses
    .filter((business) => {
      if (!business.created_at) return false
      const created = new Date(business.created_at)
      const now = new Date()
      const diffTime = now.getTime() - created.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)
      return diffDays >= 0 && diffDays < 7
    })
    .sort((a, b) => {
      // Ordenar por fecha de creación: más recientes primero
      return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
    })
  
  const businessesByCategory = allBusinesses.reduce((acc, business) => {
    const category = business.category || "Otros"
    if (!acc[category]) acc[category] = []
    acc[category].push(business)
    return acc
  }, {} as Record<string, Business[]>)

  const topCategories = Object.entries(businessesByCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 4)

  const displayedBusinesses = 
    activeTab === "destacados" ? featuredBusinesses :
    activeTab === "recientes" ? recentBusinesses :
    filteredBusinesses

  // Negocios visibles para scroll infinito
  const visibleBusinesses = displayedBusinesses.slice(0, visibleCount)
  const hasMore = visibleCount < displayedBusinesses.length

  // ========== NUEVO UI MOBILE-FIRST ==========
  return (
    <div className="min-h-screen lg:pb-0">

      {/* Inicio dejó de ser la excepción.
          Tenía el bloque de marca de las pantallas de registro —logo grande,
          título centrado, píldora "Portal Encuentra"—, que en móvil se veía
          bien pero en escritorio hacía que el panel pareciera una landing: el
          bloque centrado se comía el alto de la pantalla y la fila de acciones
          se estiraba de borde a borde, desalineada del feed.
          Ahora usa el mismo encabezado que las otras doce secciones. El conteo
          de negocios pasa a subtítulo y buscar/avatar a las acciones, que es
          donde viven en el resto de la app. */}
      <SectionHeader
        onVolver={() => router.back()}
        volverSoloEscritorio
        titulo="App Encuentra"
        subtitulo={`${allBusinesses.length} ${allBusinesses.length === 1 ? 'negocio disponible' : 'negocios disponibles'}`}
        ancho="feed"
        /* La marca en vez de un ícono de sección, igual que en el encabezado de
           la landing: mismo archivo, mismo tamaño. Inicio es la portada de la
           app, así que acá la marca identifica mejor que la palabra "Inicio"
           —que además ya está en la barra inferior—.
           El logo mide 40px, exactamente el alto del bloque título+subtítulo,
           así que la barra conserva el mismo alto que las demás secciones. */
        icono={
          <Image
            src="/brand/encuentra-mark.svg"
            alt="Logo App Encuentra"
            width={44}
            height={44}
            className="w-10 h-10"
            unoptimized
          />
        }
        acciones={
          <>
              {/* Botón de Búsqueda — visible también en móvil: antes era
                  desktop-only y dejaba a los usuarios móviles sin forma de
                  buscar desde el dashboard. */}
              <button
                onClick={() => setShowSearchModal(true)}
                aria-label="Buscar"
                className="flex p-2.5 bg-black/5 hover:bg-black/10 border border-black/8 rounded-full text-ink-2 hover:text-ink transition-all duration-200 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Menú de Usuario — Popover anclado al avatar */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105"
                >
                  {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </button>

                <Popover
                  open={showUserMenu}
                  onClose={() => setShowUserMenu(false)}
                  align="right"
                  panelClassName="w-80 surface-elevated rounded-3xl overflow-hidden"
                >
                  {/* Header del perfil */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                        {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-lg leading-tight truncate">
                              {user?.user_metadata?.full_name || "Usuario"}
                            </h3>
                            {user?.email && (
                              <p className="text-xs text-blue-100/90 break-all">
                                {user.email}
                              </p>
                            )}
                          </div>
                          {!tierLoading && effectiveTier > 0 && (
                            <MembershipBadge type={currentBadgeType} className="shrink-0" />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-white/80">
                          {userRole === "company" ? "Cuenta Empresa" : "Cuenta Personal"}
                          {" · "}
                          {tierLoading ? (
                            <span className="opacity-40">…</span>
                          ) : (
                            <span className={effectiveTier > 0 ? "font-semibold text-white" : "opacity-70"}>
                              {getLabelForTier(effectiveTier as MembershipTier)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Opciones — los mismos destinos que la barra inferior.
                      En escritorio la barra está oculta, así que este menú es
                      LA navegación, no un atajo. La lista viene de
                      src/lib/navegacion.ts, compartida con la barra. */}
                  <div className="p-4 space-y-1">
                    {destinosMenu.map(({ href, label, Icono, activo, badge }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setShowUserMenu(false)}
                        aria-current={activo ? "page" : undefined}
                        className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                          activo ? "bg-blue-50" : "hover:bg-black/5"
                        }`}
                      >
                        <Icono
                          className={`w-5 h-5 flex-shrink-0 ${activo ? "text-blue-600" : "text-ink-2"}`}
                          strokeWidth={activo ? 2.2 : 1.8}
                        />
                        <span className={`flex-1 font-semibold ${activo ? "text-blue-700" : "text-ink"}`}>
                          {label}
                        </span>
                        {Boolean(badge && badge > 0) && (
                          <span className="bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 px-2 rounded-full flex items-center justify-center">
                            {badge}
                          </span>
                        )}
                        <svg className="w-4 h-4 flex-shrink-0 text-ink-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>

                  {/* Logout */}
                  <div className="p-4 border-t border-black/8">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-2xl transition-all font-semibold"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Cerrar Sesión
                    </button>
                  </div>
                </Popover>
              </div>
          </>
        }
      />

      {/* Pestañas de categorías: salen de la barra y se alinean con el feed,
          con el mismo ancho y padding que las tarjetas de abajo. */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 pt-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setActiveTab("feed")}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === "feed"
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20 scale-105"
                  : "bg-black/5 hover:bg-black/10 text-ink-2 hover:text-ink border border-black/8"
              }`}
            >
              Todos {filteredBusinesses.length > 0 && `(${filteredBusinesses.length})`}
            </button>
            <button
              onClick={() => setActiveTab("recientes")}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === "recientes"
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20 scale-105"
                  : "bg-black/5 hover:bg-black/10 text-ink-2 hover:text-ink border border-black/8"
              }`}
            >
              Recientes {recentBusinesses.length > 0 && `(${recentBusinesses.length})`}
            </button>
            <button
              onClick={() => setActiveTab("destacados")}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === "destacados"
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20 scale-105"
                  : "bg-black/5 hover:bg-black/10 text-ink-2 hover:text-ink border border-black/8"
              }`}
            >
              ⭐ Destacados
            </button>
          </div>
        </div>

      {/* Main Content */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
          {/* Sidebar Izquierdo (Desktop Only) */}
          <div className="hidden lg:block">
            <FilterSidebar onFilterChange={handleFilterChange} />
          </div>

          {/* Feed Central */}
          <div className="space-y-4">
            {/* Categorías Destacadas (Solo en Tab Feed) */}
            {activeTab === "feed" && topCategories.length > 0 && (
              <div className="surface rounded-3xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-ink mb-5 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                    <svg className="w-[18px] h-[18px] text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  Categorías Populares
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {topCategories.map(([category, businesses]) => (
                    <button
                      key={category}
                      onClick={() => handleFilterChange({ ...filters, category })}
                      className="group relative p-5 bg-black/[0.02] rounded-2xl hover:bg-blue-50 border border-black/8 hover:border-blue-200 transition-all duration-300 hover:scale-105"
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                          {category === "Restaurantes" && "🍽️"}
                          {category === "Tiendas" && "🛍️"}
                          {category === "Servicios" && "🔧"}
                          {category === "Salud" && "⚕️"}
                          {category === "Educación" && "📚"}
                          {category === "Tecnología" && "💻"}
                          {category === "Entretenimiento" && "🎭"}
                          {category === "Deportes" && "⚽"}
                          {category === "Belleza" && "💄"}
                          {!["Restaurantes", "Tiendas", "Servicios", "Salud", "Educación", "Tecnología", "Entretenimiento", "Deportes", "Belleza"].includes(category) && "📦"}
                        </div>
                        <p className="font-semibold text-sm text-ink truncate group-hover:text-blue-700 transition-colors">
                          {category}
                        </p>
                        <p className="text-xs text-ink-2 mt-1.5 transition-colors">
                          {businesses.length} {businesses.length === 1 ? 'negocio' : 'negocios'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Promociones de patrocinadores.
                Es la contraprestación del "Módulo de Promociones" que vende el
                plan Patrocina, que hasta ahora se cobraba sin entregarse: el
                componente existía pero ningún archivo lo importaba.

                Va acá, arriba del listado y visible en móvil, porque el
                beneficio comprado es visibilidad frente a compradores. Si no
                hay ninguna promoción de patrocinador, no renderiza nada. */}
            <PromotionsSpotlight />

            {/* Botón de Filtros Colapsable (Solo Mobile) */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full surface hover:bg-blue-50 hover:border-blue-200 rounded-2xl px-4 py-3 flex items-center justify-between transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <span className="text-ink font-semibold">Filtra tu búsqueda</span>
                  {(filters.category !== "Todos" || filters.location || filters.searchTerm) && (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <svg
                  className={`w-5 h-5 text-ink-2 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Panel de Filtros Desplegable */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  showFilters ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="surface rounded-2xl p-5 shadow-sm">
                  <FilterSidebar onFilterChange={handleFilterChange} />
                </div>
              </div>
            </div>

            {/* Lista de Negocios */}
            {loading ? (
              <div className="text-center py-16">
                <div className="relative w-16 h-16 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/15"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                </div>
                <p className="text-ink-2 font-medium">Cargando negocios...</p>
              </div>
            ) : displayedBusinesses.length === 0 ? (
              <div className="surface rounded-3xl p-16 text-center shadow-sm">
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                  <svg className="h-10 w-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-bold text-ink">
                  {activeTab === "recientes"
                    ? "No hay negocios recientes"
                    : activeTab === "destacados"
                    ? "Aún no hay negocios destacados"
                    : "No se encontraron negocios"}
                </h3>
                <p className="mt-3 text-ink-2 max-w-md mx-auto">
                  {activeTab === "recientes"
                    ? "No se han agregado negocios nuevos en los últimos 7 días"
                    : activeTab === "destacados"
                    ? "Los negocios destacados son asignados manualmente por los administradores"
                    : "Intenta ajustar los filtros de búsqueda"}
                </p>
              </div>
            ) : (
              <>
                {/* Layout: 1 columna en desktop (lg y xl), 2 en tablet (md), 1 en móvil */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 gap-6 lg:gap-8">
                  {visibleBusinesses.map((business, index) => (
                    <div 
                      key={business.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                    >
                      <BusinessFeedCard 
                        business={business}
                        currentUser={user}
                        isAdmin={isAdmin}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}
                </div>

                {/* Trigger para scroll infinito */}
                {hasMore && (
                  <div 
                    ref={loadMoreRef}
                    className="h-20 flex items-center justify-center"
                  >
                    {isLoadingMore && (
                      <div className="flex items-center gap-3 text-ink-2">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Cargando más negocios...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Indicador de fin de lista */}
                {!hasMore && displayedBusinesses.length > 0 && (
                  <div className="text-center py-8 text-ink-2 text-sm">
                    <p>Has visto todos los negocios disponibles</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar Derecho (Desktop Only) - Nuevo diseño modular */}
          <div className="hidden lg:block space-y-4">
            <RightSidebar />
          </div>
        </div>
      </div>

      {/* Filtros (Móvil) — Sheet: hoja inferior con animación de entrada/salida */}
      <Sheet
        open={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        aria-label="Filtros"
        panelClassName="w-full max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl lg:hidden"
      >
        <div className="pb-4 border-b border-black/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">Filtros</h3>
          <button
            onClick={() => setShowFilterModal(false)}
            className="p-2 rounded-full hover:bg-black/5 text-ink-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="pt-4">
          <FilterSidebar onFilterChange={(newFilters) => {
            handleFilterChange(newFilters)
            setShowFilterModal(false)
          }} />
        </div>
      </Sheet>

      {/* Búsqueda — Dialog */}
      <Dialog
        open={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        aria-label="Buscar"
        panelClassName="max-w-2xl w-full bg-white border border-black/8 rounded-3xl p-4 shadow-2xl"
      >
        <input
          type="text"
          placeholder="Buscar negocios, categorías, ubicación..."
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange({ ...filters, searchTerm: e.target.value })}
          className="w-full bg-transparent text-ink px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-ink-2/60"
          autoFocus
        />
      </Dialog>

      {/* Bottom Navigation (Móvil) */}
      {/* Modal de confirmación para eliminar negocio desde el feed */}
      <ConfirmationModal
        open={!!pendingDelete}
        title="¿Eliminar este negocio permanentemente?"
        description={
          pendingDelete
            ? `Esta acción es irreversible una vez pase el tiempo de recuperación. Se eliminará "${pendingDelete.name}" de App Encuentra.`
            : ""
        }
        loading={!!deletingId}
        onClose={() => {
          if (deletingId) return
          setPendingDelete(null)
        }}
        onConfirm={() => {
          if (!pendingDelete || deletingId) return
          scheduleDeleteWithUndo(pendingDelete.id)
          setPendingDelete(null)
        }}
        confirmLabel="Sí, eliminar definitivamente"
        cancelLabel="No, mantener negocio"
      />

    </div>
  )
}
