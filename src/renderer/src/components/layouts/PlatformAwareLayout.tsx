import React, { useEffect, useState, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import { useTheme } from '@/contexts/ThemeContext'
import { DraggableTopBar } from '@/components/common/DraggableTopBar'

interface PlatformAwareLayoutProps {
  children: ReactNode
  className?: string
}

export const PlatformAwareLayout: React.FC<PlatformAwareLayoutProps> = ({ 
  children,
  className
}) => {
  const { isDarkMode, isHighContrastMode } = useTheme()
  const [platform, setPlatform] = useState<string>('unknown')
  
  // Phát hiện nền tảng hiện tại (Windows, macOS, Linux)
  useEffect(() => {
    if (window.navigator.userAgent.indexOf('Windows') !== -1) {
      setPlatform('win32')
    } else if (window.navigator.userAgent.indexOf('Mac') !== -1) {
      setPlatform('darwin')
    } else if (window.navigator.userAgent.indexOf('Linux') !== -1) {
      setPlatform('linux')
    }
  }, [])
  
  // Thêm class platform vào thẻ body
  useEffect(() => {
    if (platform !== 'unknown') {
      document.body.classList.add(`platform-${platform}`)
    }
    
    return () => {
      if (platform !== 'unknown') {
        document.body.classList.remove(`platform-${platform}`)
      }
    }
  }, [platform])
  
  // Tạo các class dựa trên nền tảng và theme
  const baseClasses = [
    'flex',
    'flex-col',
    'h-screen',
    'w-screen',
    'relative',
    platform !== 'unknown' ? `platform-${platform}` : '',
    isDarkMode ? 'dark' : 'light',
    isHighContrastMode ? 'high-contrast' : ''
  ]
  
  return (
    <main className={twMerge(baseClasses.join(' '), className)}>
      {/* TopBar điều chỉnh theo từng nền tảng */}
      <DraggableTopBar platform={platform} />
      
      {/* Main content với padding phù hợp cho titlebar */}
      <div className="flex-1 overflow-auto main-content">
        {children}
      </div>
    </main>
  )
}