'use client';

import React, { useState } from 'react';
import { Review } from '@/types/review';
import StarRating from './StarRating';
import ReportReviewModal from '@/components/reports/ReportReviewModal';
import { Popover } from '@/components/ui/Overlay';
import { MoreVertical, Flag } from 'lucide-react';

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
  /**
   * Quién está mirando. Sin esto la tarjeta no podía distinguir a nadie:
   * ofrecía "Reportar reseña" al propio autor —reportarse a sí mismo— y a
   * visitantes sin sesión, a los que el modal rechaza al comprobar la cuenta.
   */
  currentUserId?: string | null;
}

export default function ReviewList({ reviews, loading = false, currentUserId = null }: ReviewListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse surface rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-black/5 rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-black/5 rounded-full w-1/4"></div>
                <div className="h-3 bg-black/5 rounded-full w-1/3"></div>
                <div className="h-20 bg-black/5 rounded-2xl w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Compacto a propósito: antes eran 16 de padding vertical y un icono de
  // 80px para decir que no hay nada. Un vacío no merece más espacio que el
  // contenido que sustituye, y ocupando media pantalla parecía un error de
  // carga en vez de un estado normal.
  if (reviews.length === 0) {
    return (
      <div className="surface rounded-2xl px-5 py-6 text-center">
        <p className="text-sm font-semibold text-ink">Aún no hay reseñas</p>
        <p className="mt-1 text-sm text-ink-2">
          Sé el primero en compartir tu experiencia con este negocio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} currentUserId={currentUserId} />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  currentUserId,
}: {
  review: Review
  currentUserId?: string | null
}) {
  const [showReportModal, setShowReportModal] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)

  /* Reportar es una acción excepcional: va detrás de un menú y en color
     neutro. En rojo y siempre visible competía con la reseña por la atención
     y sugería peligro; el rojo tiene sentido dentro de la confirmación, que
     es cuando ya se decidió hacerlo.

     No lo ve quien no tiene sesión —el modal la exige y fallaría— ni el autor
     de la reseña, que no tiene a quién reportar. */
  const puedeReportar = Boolean(currentUserId) && currentUserId !== review.user_id
  
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
    <div className="surface rounded-2xl px-5 py-4 hover:border-blue-300 hover:shadow-md transition-all duration-300">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {getInitials(userName)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-ink">{userName}</h4>
                {/* La app no ve la compra —ocurre en el local—, así que esto
                    dice lo único comprobable: que esta persona contactó al
                    negocio antes de opinar. Lo sella un trigger al escribir;
                    nadie puede ponérselo a sí mismo. */}
                {review.cliente_verificado && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[11px] font-semibold text-green-700"
                    title="Esta persona contactó al negocio antes de dejar su reseña"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Cliente verificado
                  </span>
                )}
              </div>
              {/* Sin icono de reloj: "Justo ahora" ya se lee como una fecha
                  y el reloj sólo añadía peso a una línea secundaria. */}
              <p className="text-xs text-ink-2 mt-0.5">{formatDate(review.created_at)}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <StarRating rating={review.rating} size="sm" />
              {puedeReportar && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuAbierto((v) => !v)}
                    aria-label="Opciones de la reseña"
                    aria-haspopup="menu"
                    aria-expanded={menuAbierto}
                    className="p-1.5 rounded-full text-ink-2 hover:bg-black/5 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <Popover
                    open={menuAbierto}
                    onClose={() => setMenuAbierto(false)}
                    align="right"
                    panelClassName="w-48 rounded-2xl border border-black/10 bg-white p-1 shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setMenuAbierto(false)
                        setShowReportModal(true)
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-ink hover:bg-black/5 transition-colors"
                    >
                      <Flag className="w-4 h-4 text-ink-2" />
                      Reportar reseña
                    </button>
                  </Popover>
                </div>
              )}
            </div>
          </div>

          {/* El comentario, sin caja propia: era una tarjeta dentro de otra
              para envolver una línea de texto. */}
          {review.comment && (
            <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-wrap">
              {review.comment}
            </p>
          )}

        </div>
      </div>

      {/* Modal de Reportar Reseña */}
      {showReportModal && (
        <ReportReviewModal
          reviewId={review.id}
          reviewComment={review.comment}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

