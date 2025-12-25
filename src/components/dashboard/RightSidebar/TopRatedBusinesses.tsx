"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import Image from "next/image"

interface Business {
  id: string
  name: string
  category: string
  average_rating: number
  review_count: number
  logo_url?: string
}

export default function TopRatedBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTopRated()
  }, [])

  const loadTopRated = async () => {
    try {
      // Primero obtener los stats de reviews
      const { data: stats, error: statsError } = await supabase
        .from('business_review_stats')
        .select('business_id, average_rating, total_reviews')
        .gte('average_rating', 4)
        .order('average_rating', { ascending: false })
        .order('total_reviews', { ascending: false })
        .limit(3)

      if (statsError) {
        console.error('Error loading stats:', statsError)
        setBusinesses([])
        setLoading(false)
        return
      }

      if (!stats || stats.length === 0) {
        setBusinesses([])
        setLoading(false)
        return
      }

      // Obtener información de los negocios
      const businessIds = stats.map(s => s.business_id)
      const { data: businessesData, error: businessesError } = await supabase
        .from('businesses')
        .select('id, name, category, logo_url')
        .in('id', businessIds)

      if (businessesError) {
        console.error('Error loading businesses:', businessesError)
        setBusinesses([])
        setLoading(false)
        return
      }

      // Combinar datos
      const statsMap = new Map(stats.map(s => [s.business_id, s]))
      const combined = (businessesData || []).map(business => ({
        id: business.id,
        name: business.name,
        category: business.category || '',
        logo_url: business.logo_url,
        average_rating: statsMap.get(business.id)?.average_rating || 0,
        review_count: statsMap.get(business.id)?.total_reviews || 0
      })).sort((a, b) => {
        // Ordenar por rating y luego por review_count
        if (b.average_rating !== a.average_rating) {
          return b.average_rating - a.average_rating
        }
        return b.review_count - a.review_count
      })

      setBusinesses(combined)
    } catch (err) {
      console.error('Error loading top rated businesses:', err)
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600' // Oro
      case 2: return 'from-gray-300 to-gray-500' // Plata
      case 3: return 'from-orange-400 to-orange-600' // Bronce
      default: return 'from-blue-400 to-blue-600'
    }
  }

  const getMedalIcon = (rank: number) => {
    return (
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getMedalColor(rank)} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
        {rank}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-white/10 rounded animate-pulse" />
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl animate-pulse">
              <div className="w-8 h-8 rounded-full bg-white/10" />
              <div className="w-12 h-12 rounded-xl bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (businesses.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Mejores Calificados
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">
            Aún no hay negocios calificados
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
        Mejores Calificados
      </h3>

      <div className="space-y-2">
        {businesses.map((business, index) => (
          <Link 
            key={business.id} 
            href={`/app/dashboard/negocios/${business.id}`}
            className="block"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-200 group">
              {/* Medal/Ranking */}
              {getMedalIcon(index + 1)}

              {/* Logo */}
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex-shrink-0">
                {business.logo_url ? (
                  <Image
                    src={business.logo_url}
                    alt={business.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm truncate group-hover:text-blue-400 transition-colors">
                  {business.name}
                </h4>
                <p className="text-xs text-gray-400 truncate">
                  {business.category}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {/* Stars */}
                  {[...Array(5)].map((_, i) => (
                    <svg 
                      key={i} 
                      className={`w-3 h-3 ${i < Math.floor(business.average_rating) ? 'text-yellow-400' : 'text-gray-600'}`}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-xs text-gray-400 ml-1">
                    ({business.review_count})
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <svg className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

