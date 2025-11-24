'use client';

import React from 'react';

interface StarRatingProps {
  rating: number; // 0-5
  totalStars?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showNumber?: boolean;
}

export default function StarRating({
  rating,
  totalStars = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  showNumber = false
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState<number>(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const handleClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (interactive) {
      setHoverRating(index + 1);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: totalStars }, (_, index) => {
          const isFilled = index < Math.floor(displayRating);
          const isPartial = index === Math.floor(displayRating) && displayRating % 1 !== 0;
          const partialPercentage = isPartial ? (displayRating % 1) * 100 : 0;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(index)}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
              className={`relative ${sizeClasses[size]} ${
                interactive 
                  ? 'cursor-pointer hover:scale-125 active:scale-95 transition-all duration-200' 
                  : 'cursor-default'
              } ${isFilled || isPartial ? 'drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]' : ''}`}
              aria-label={`${index + 1} ${index === 0 ? 'estrella' : 'estrellas'}`}
            >
              {/* Star background (empty) */}
              <svg
                className="absolute inset-0 text-gray-600"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>

              {/* Star foreground (filled with neon gold) */}
              <div
                className="absolute inset-0 overflow-hidden transition-all duration-300"
                style={{ 
                  width: isPartial ? `${partialPercentage}%` : isFilled ? '100%' : '0%'
                }}
              >
                <svg
                  className="text-neon-gold animate-glow"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>

              {/* Hover effect for interactive stars */}
              {interactive && hoverRating > 0 && index < hoverRating && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-full bg-neon-gold/20 rounded-full blur-sm animate-pulse-glow" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {showNumber && (
        <span className={`ml-1 font-semibold text-neon-gold ${textSizeClasses[size]}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
