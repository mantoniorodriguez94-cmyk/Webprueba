/**
 * Componente: Badge Premium
 * Muestra un badge dorado/premium para negocios con suscripción activa
 */

interface PremiumBadgeProps {
  variant?: 'default' | 'small' | 'large'
  showText?: boolean
  className?: string
}

export default function PremiumBadge({ 
  variant = 'default', 
  showText = true,
  className = '' 
}: PremiumBadgeProps) {
  
  const sizes = {
    small: 'w-4 h-4',
    default: 'w-5 h-5',
    large: 'w-6 h-6',
  }

  const textSizes = {
    small: 'text-xs',
    default: 'text-sm',
    large: 'text-base',
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg 
        className={`${sizes[variant]} text-yellow-400`} 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {showText && (
        <span className={`font-semibold text-yellow-400 ${textSizes[variant]}`}>
          Premium
        </span>
      )}
    </div>
  )
}

/**
 * Variante: Border Premium
 * Agrega un borde dorado alrededor de un elemento
 */
export function PremiumBorder({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg opacity-75 blur-sm"></div>
      <div className="relative bg-gray-800 rounded-lg border-2 border-yellow-400/50">
        {children}
      </div>
    </div>
  )
}

/**
 * Variante: Banner Premium (para destacar el negocio completo)
 */
export function PremiumBanner() {
  return (
    <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-lg">
      ⭐ PREMIUM
    </div>
  )
}


