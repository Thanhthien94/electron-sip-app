import { Loader2 } from 'lucide-react'

interface LoaderProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Loader = ({ message = 'Đang tải...', size = 'md', className = '' }: LoaderProps) => {
  // Size mapping
  const sizeMap = {
    sm: {
      container: 'p-2',
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    md: {
      container: 'p-4',
      icon: 'w-8 h-8',
      text: 'text-sm'
    },
    lg: {
      container: 'p-6',
      icon: 'w-12 h-12',
      text: 'text-base'
    }
  }
  
  const { container, icon, text } = sizeMap[size]
  
  return (
    <div className={`flex flex-col items-center justify-center h-full w-full ${className}`}>
      <div className={`flex flex-col items-center ${container}`}>
        <Loader2 className={`${icon} text-orange-500 animate-spin mb-2`} />
        <p className={`${text} text-neutral-300`}>{message}</p>
      </div>
    </div>
  )
}