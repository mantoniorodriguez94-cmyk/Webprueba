'use client';

import React from 'react';

interface NeonLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'pink' | 'blue' | 'purple' | 'gradient';
  text?: string;
}

export default function NeonLoader({ 
  size = 'md', 
  variant = 'gradient',
  text 
}: NeonLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const colorClasses = {
    pink: 'border-neon-pink',
    blue: 'border-cyber-blue',
    purple: 'border-deep-purple',
    gradient: 'border-neon-pink'
  };

  const glowClasses = {
    pink: 'shadow-neon-pink',
    blue: 'shadow-neon-blue',
    purple: 'shadow-neon-purple',
    gradient: 'shadow-glow-medium'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      {/* Spinner */}
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} ${colorClasses[variant]} ${glowClasses[variant]} rounded-full border-4 border-t-transparent animate-spin`} />
        
        {/* Inner glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-2/3 h-2/3 rounded-full ${
            variant === 'gradient' 
              ? 'bg-gradient-neon' 
              : variant === 'pink'
              ? 'bg-neon-pink'
              : variant === 'blue'
              ? 'bg-cyber-blue'
              : 'bg-deep-purple'
          } opacity-30 blur-lg animate-pulse-glow`} />
        </div>
      </div>

      {/* Loading text */}
      {text && (
        <p className="text-sm font-medium text-gray-300 animate-glow">
          {text}
        </p>
      )}
    </div>
  );
}

// Skeleton loader component
export function NeonSkeleton({ 
  className = '' 
}: { 
  className?: string 
}) {
  return (
    <div className={`glass rounded-2xl animate-pulse ${className}`}>
      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

// Pulse loader (3 dots)
export function PulseLoader({ 
  variant = 'gradient' 
}: { 
  variant?: 'pink' | 'blue' | 'purple' | 'gradient' 
}) {
  const dotColor = {
    pink: 'bg-neon-pink',
    blue: 'bg-cyber-blue',
    purple: 'bg-deep-purple',
    gradient: 'bg-gradient-neon'
  };

  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`w-3 h-3 rounded-full ${dotColor[variant]} animate-bounce`}
          style={{ animationDelay: `${index * 0.15}s` }}
        />
      ))}
    </div>
  );
}



