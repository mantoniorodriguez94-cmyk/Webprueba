"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import Image from "next/image"

interface Review {
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
  } | null
}

export default function CommunityFeed() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentReviews()
  }, [])

  const loadRecentReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, business_id, user_id')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Error loading reviews:', error)
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
        supabase.from('businesses').select('id, name').in('id', businessIds)
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
      console.error('Error loading community feed:', err)
      setReviews([])
    } finally {
      setLoading(false)
    }
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

  const getUserInitials = (name: string | null) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name[0].toUpperCase()
  }

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-white/10 rounded animate-pulse" />
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
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
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
          Actividad Reciente
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">
            Aún no hay actividad
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Sé el primero en dejar una reseña
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl hover:border-white/20 transition-all duration-300">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
        Actividad Reciente
      </h3>

      {/* Timeline */}
      <div className="relative space-y-4">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500/50 via-blue-500/50 to-purple-500/50" />

        {reviews.map((review, index) => {
          const userName = review.profiles?.full_name || 'Usuario'
          const businessName = review.businesses?.name || 'Negocio'
          const avatarUrl = review.profiles?.avatar_url

          return (
            <Link 
              key={review.id} 
              href={`/app/dashboard/negocios/${review.business_id}`}
              className="block"
            >
              <div className="relative flex gap-3 group">
                {/* Avatar */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-gradient-to-br from-blue-500 to-purple-500 overflow-hidden group-hover:border-white/40 transition-all">
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
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 p-3 rounded-xl bg-white/5 group-hover:bg-white/10 border border-white/5 group-hover:border-white/20 transition-all">
                  {/* User action */}
                  <div className="text-sm mb-2">
                    <span className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {userName}
                    </span>
                    <span className="text-gray-400"> calificó </span>
                    <span className="inline-flex items-center gap-0.5">
                      {[...Array(review.rating)].map((_, i) => (
                        <svg 
                          key={i} 
                          className="w-3 h-3 text-yellow-400 inline" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </span>
                    <span className="text-gray-400"> a </span>
                    <span className="font-medium text-green-400">
                      {businessName}
                    </span>
                  </div>

                  {/* Comment preview */}
                  {review.comment && (
                    <p className="text-xs text-gray-400 line-clamp-2 mb-2 italic">
                      "{review.comment}"
                    </p>
                  )}

                  {/* Time */}
                  <span className="text-xs text-gray-500">
                    {getTimeAgo(review.created_at)}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <Link 
        href="/app/dashboard?tab=recientes" 
        className="block mt-4 text-center text-sm text-green-400 hover:text-green-300 font-medium transition-colors"
      >
        Ver toda la actividad →
      </Link>
    </div>
  )
}

