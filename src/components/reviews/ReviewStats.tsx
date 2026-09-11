'use client';

import React from 'react';
import { ReviewStats as ReviewStatsType } from '@/types/review';
import StarRating from './StarRating';

interface ReviewStatsProps {
  stats: ReviewStatsType;
}

export default function ReviewStats({ stats }: ReviewStatsProps) {
  const ratingDistribution = [
    { stars: 5, count: stats.five_star_count },
    { stars: 4, count: stats.four_star_count },
    { stars: 3, count: stats.three_star_count },
    { stars: 2, count: stats.two_star_count },
    { stars: 1, count: stats.one_star_count }
  ];

  const maxCount = Math.max(...ratingDistribution.map(d => d.count));

  return (
    <div className="surface rounded-3xl p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-ink">
          Calificaciones y reseñas
        </h3>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Average Rating - DONUT STYLE */}
        <div className="flex flex-col items-center justify-center p-6 bg-black/[0.015] rounded-3xl border border-black/8">
          <div className="relative mb-4">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className="text-black/10"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                strokeDasharray={`${(stats.average_rating / 5) * 351.86} 351.86`}
                className="text-blue-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-extrabold text-ink">
                {stats.average_rating.toFixed(1)}
              </div>
              <div className="text-xs text-ink-2">de 5.0</div>
            </div>
          </div>
          <StarRating rating={stats.average_rating} size="lg" />
          <p className="text-ink-2 mt-3 font-semibold">
            {stats.total_reviews} {stats.total_reviews === 1 ? 'reseña' : 'reseñas'}
          </p>
        </div>

        {/* Rating Distribution - BARS */}
        <div className="space-y-3">
          {ratingDistribution.map(({ stars, count }) => {
            const percentage = stats.total_reviews > 0
              ? (count / stats.total_reviews) * 100
              : 0;

            return (
              <div key={stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-bold text-ink">{stars}</span>
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1 h-4 bg-black/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-700 ease-out rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-ink-2 w-10 text-right font-semibold">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Insights */}
      {stats.total_reviews > 0 && (
        <div className="mt-8 pt-8 border-t border-black/8">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
              <div className="text-3xl font-extrabold text-green-700">
                {Math.round(((stats.five_star_count + stats.four_star_count) / stats.total_reviews) * 100)}%
              </div>
              <div className="text-xs text-green-700 mt-2 font-semibold">Recomendado</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
              <div className="text-3xl font-extrabold text-blue-700">
                {stats.five_star_count}
              </div>
              <div className="text-xs text-blue-700 mt-2 font-semibold">5 estrellas</div>
            </div>
            <div className="bg-black/[0.02] border border-black/8 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold">
                {stats.average_rating >= 4.5 ? '🏆' : stats.average_rating >= 4.0 ? '⭐' : '👍'}
              </div>
              <div className="text-xs text-ink-2 mt-2 font-semibold">
                {stats.average_rating >= 4.5 ? 'Excelente' : stats.average_rating >= 4.0 ? 'Muy bueno' : 'Bueno'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




