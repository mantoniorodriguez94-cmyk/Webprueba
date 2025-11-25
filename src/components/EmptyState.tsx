'use client';

import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  variant?: 'default' | 'search' | 'error' | 'success';
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  variant = 'default'
}: EmptyStateProps) {
  const defaultIcons = {
    default: (
      <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
    search: (
      <svg className="w-16 h-16 text-cyber-blue drop-shadow-cyber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    error: (
      <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-16 h-16 text-cyber-green drop-shadow-[0_0_10px_rgba(0,255,148,0.7)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  const displayIcon = icon || defaultIcons[variant];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      {/* Icon container with glow effect */}
      <div className="relative mb-6">
        <div className="animate-float">
          {displayIcon}
        </div>
        {/* Glow orb */}
        <div className={`absolute inset-0 -z-10 blur-2xl opacity-30 ${
          variant === 'search' 
            ? 'bg-cyber-blue' 
            : variant === 'error'
            ? 'bg-red-500'
            : variant === 'success'
            ? 'bg-cyber-green'
            : 'bg-deep-purple'
        } rounded-full animate-pulse-glow`} />
      </div>

      {/* Title */}
      <h3 className={`text-xl sm:text-2xl font-bold mb-2 text-center ${
        variant === 'search'
          ? 'text-glow-blue'
          : variant === 'error'
          ? 'text-red-400'
          : variant === 'success'
          ? 'text-cyber-green'
          : 'text-white'
      }`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-gray-400 text-center max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {/* Action button */}
      {(actionLabel && (actionHref || onAction)) && (
        <div className="mt-4">
          {actionHref ? (
            <Link href={actionHref}>
              <button className="btn-cyber">
                {actionLabel}
              </button>
            </Link>
          ) : (
            <button 
              onClick={onAction}
              className="btn-neon"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Specialized empty states
export function EmptyBusinesses() {
  return (
    <EmptyState
      variant="search"
      title="No hay negocios disponibles"
      description="Parece que aún no hay negocios registrados. ¡Sé el primero en publicar!"
      actionLabel="Crear mi negocio"
      actionHref="/app/dashboard/negocios/nuevo"
    />
  );
}

export function EmptySearchResults() {
  return (
    <EmptyState
      variant="search"
      title="Sin resultados"
      description="No encontramos negocios que coincidan con tu búsqueda. Intenta con otros términos."
    />
  );
}

export function EmptyMessages() {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16 text-neon-pink drop-shadow-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      }
      title="Sin mensajes"
      description="Aún no tienes conversaciones. Comienza a contactar negocios para que aparezcan aquí."
    />
  );
}









