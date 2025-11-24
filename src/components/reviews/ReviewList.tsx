'use client';

import React from 'react';
import { Review } from '@/types/review';
import StarRating from './StarRating';

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
}

export default function ReviewList({ reviews, loading = false }: ReviewListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-800/50 rounded-3xl p-6 border border-gray-700">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-700 rounded-full w-1/4"></div>
                <div className="h-3 bg-gray-700 rounded-full w-1/3"></div>
                <div className="h-20 bg-gray-700 rounded-2xl w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700">
        <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Aún no hay reseñas
        </h3>
        <p className="text-gray-400">
          Sé el primero en compartir tu experiencia con este negocio
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMinutes < 1) return 'Justo ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffWeeks < 4) return `Hace ${diffWeeks} ${diffWeeks === 1 ? 'semana' : 'semanas'}`;
    if (diffMonths < 12) return `Hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`;
    return `Hace ${diffYears} ${diffYears === 1 ? 'año' : 'años'}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = review.user_name || 'Usuario';

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-6 border border-gray-700 hover:border-blue-500/50 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
          {getInitials(userName)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h4 className="font-bold text-white text-lg">{userName}</h4>
              <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(review.created_at)}
              </p>
            </div>
            <StarRating rating={review.rating} size="sm" />
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-900/30 rounded-2xl p-4 border border-gray-700/50">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

