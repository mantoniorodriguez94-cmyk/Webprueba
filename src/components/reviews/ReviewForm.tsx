'use client';

import React, { useState } from 'react';
import StarRating from './StarRating';
import { ReviewFormData } from '@/types/review';

interface ReviewFormProps {
  businessId: string;
  businessName: string;
  existingReview?: {
    rating: number;
    comment: string | null;
  };
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel?: () => void;
}

export default function ReviewForm({
  businessId,
  businessName,
  existingReview,
  onSubmit,
  onCancel
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(existingReview?.rating || 0);
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Por favor selecciona una calificación');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Tu comentario debe tener al menos 10 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ rating, comment: comment.trim() });
      // Reset form if it's a new review
      if (!existingReview) {
        setRating(0);
        setComment('');
      }
    } catch (err: any) {
      setError(err.message || 'Error al enviar la reseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingDescriptions = [
    '', // 0
    'Muy malo',
    'Malo',
    'Regular',
    'Bueno',
    'Excelente'
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        {existingReview ? 'Editar tu reseña' : '¿Qué te pareció este negocio?'}
      </h3>

      <p className="text-gray-600 mb-6">
        Comparte tu experiencia con <span className="font-semibold">{businessName}</span>
      </p>

      {/* Rating Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Calificación
        </label>
        <div className="flex items-center gap-4">
          <StarRating
            rating={rating}
            size="xl"
            interactive={true}
            onRatingChange={setRating}
          />
          {rating > 0 && (
            <span className="text-lg font-semibold text-teal-600">
              {ratingDescriptions[rating]}
            </span>
          )}
        </div>
      </div>

      {/* Comment Input */}
      <div className="mb-6">
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Tu experiencia
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Cuéntanos sobre tu experiencia con este negocio. ¿Qué te gustó? ¿Qué podría mejorar?"
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          disabled={isSubmitting}
        />
        <p className="mt-1 text-sm text-gray-500">
          Mínimo 10 caracteres ({comment.length}/500)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
          className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Enviando...
            </span>
          ) : (
            existingReview ? 'Actualizar reseña' : 'Publicar reseña'
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}




