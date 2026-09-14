'use client';

import React from 'react';
import { ReviewStats as ReviewStatsType } from '@/types/review';

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

  return (
    /* Sólo el reparto de notas.
       Acá había además un titular propio, un círculo enorme con la nota media,
       las estrellas, el total de reseñas y tres baldosas con porcentaje,
       recuento de cinco estrellas y un trofeo. Con una sola reseña, ese hecho
       se repetía seis veces y ocupaba la pantalla entera: el 5.0 salía en el
       círculo, en las estrellas y en el encabezado de la sección; el 1 salía
       en "1 reseña", en la barra y en la baldosa.

       El reparto es lo único que el encabezado no dice ya. */
    <div className="surface rounded-2xl px-5 py-4 shadow-sm">
      <div className="space-y-2">
        {ratingDistribution.map(({ stars, count }) => {
          const percentage = stats.total_reviews > 0
            ? (count / stats.total_reviews) * 100
            : 0;

          return (
            <div key={stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-10 flex-shrink-0">
                <span className="text-xs font-semibold text-ink tabular-nums">{stars}</span>
                <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-ink-2 w-6 text-right tabular-nums">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
