import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

const LoadingSpinner = ({ 
  size = 'md', 
  className = '', 
  text = 'Laden...' 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 
          className={`animate-spin text-primary ${sizeClasses[size]}`}
        />
        {text && (
          <p className="text-sm text-neutral-600 animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

// Full page loading spinner
export const PageLoader = ({ text = 'Pagina laden...' }: { text?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-neutral-50">
    <LoadingSpinner size="lg" text={text} />
  </div>
)

// Card loading skeleton
export const CardSkeleton = () => (
  <div className="card p-6 animate-pulse">
    <div className="space-y-4">
      <div className="h-4 bg-neutral-200 rounded animate-skeleton"></div>
      <div className="space-y-2">
        <div className="h-3 bg-neutral-200 rounded animate-skeleton"></div>
        <div className="h-3 bg-neutral-200 rounded w-5/6 animate-skeleton"></div>
      </div>
      <div className="h-8 bg-neutral-200 rounded animate-skeleton"></div>
    </div>
  </div>
)

export default LoadingSpinner 