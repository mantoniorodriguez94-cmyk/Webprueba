"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import Image from "next/image"

interface TopReview {
  id: string
  rating: number
  comment: string | null
  created_at: string
  business_id: string
  user_id: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
  businesses: {
    name: string
    logo_url: string | null
    category: string | null
  } | null
}

export default function TopRatedBusinesses() {
  const [reviews, setReviews] = useState<TopReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTopRated()
  }, [])

  const loadTopRated = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, business_id, user_id')
        .eq('rating', 5)
        .not('comment', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) {
        console.error('Error loading top reviews:', error)
        setReviews([])
        return
      }

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([])
        return
      }

      const userIds = [...new Set(reviewsData.map(r => r.user_id))]
      const businessIds = [...new Set(reviewsData.map(r => r.business_id))]

      const [{ data: profilesData }, { data: businessesData }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds),
        supabase.from('businesses').select('id, name, logo_url, category').in('id', businessIds)
      ])

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || [])
      const businessesMap = new Map(businessesData?.map(b => [b.id, b]) || [])

      const enrichedReviews = reviewsData.map(review => ({
        ...review,
        profiles: profilesMap.get(review.user_id) || null,
        businesses: businessesMap.get(review.business_id) || null
      }))

      setReviews(enrichedReviews)
    } catch (err) {
      console.error('Error loading top rated reviews:', err)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  const getUserInitials = (name: string | null) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name[0].toUpperCase()
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Hace un momento'
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)}h`
    if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)}d`
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-white/10 rounded animate-pulse" />
          <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-white/5 rounded-xl animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-white/10" />
                <div className="h-4 bg-white/10 rounded w-1/2" />
              </div>
              <div className="h-3 bg-white/10 rounded w-full mb-2" />
              <div className="h-3 bg-white/10 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Mejores Calificaciones
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">
            Aún no hay reseñas de 5 estrellas
          </p>
          <p className="text-xs text-gray-500 mt-2">
            ¡Sé el primero en dejar una excelente reseña!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl hover:border-white/20 transition-all duration-300">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Mejores Calificaciones
      </h3>

      <div className="space-y-3">
        {reviews.map((review) => {
          const userName = review.profiles?.full_name || 'Usuario'
          const businessName = review.businesses?.name || 'Negocio'
          const businessLogo = review.businesses?.logo_url
          const avatarUrl = review.profiles?.avatar_url

          return (
            <Link 
              key={review.id} 
              href={`/app/dashboard/negocios/${review.business_id}`}
              className="block"
            >
              <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 hover:border-yellow-400/50 hover:from-yellow-500/20 hover:to-orange-500/20 transition-all duration-300 group">
                {/* Header: Usuario + Negocio */}
                <div className="flex items-center gap-3 mb-3">
                  {/* Avatar del usuario */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 overflow-hidden flex-shrink-0">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={userName}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                        {getUserInitials(userName)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {userName}
                    </p>
                    <p className="text-xs text-yellow-300 truncate">
                      calificó a {businessName}
                    </p>
                  </div>

                  {/* Logo del negocio (pequeño) */}
                  {businessLogo && (
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                      <Image
                        src={businessLogo}
                        alt={businessName}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* 5 Estrellas */}
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg 
                      key={i} 
                      className="w-4 h-4 text-yellow-400" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-xs text-gray-400 ml-2">
                    {getTimeAgo(review.created_at)}
                  </span>
                </div>

                {/* Comentario */}
                {review.comment && (
                  <p className="text-sm text-gray-300 line-clamp-3 italic leading-relaxed">
                    "{review.comment}"
                  </p>
                )}

                {/* Arrow indicator */}
                <div className="flex items-center justify-end mt-2">
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-yellow-300 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

