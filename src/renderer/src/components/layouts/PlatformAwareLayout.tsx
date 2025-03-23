import React, { useEffect, useState, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import { useTheme } from '@/contexts/ThemeContext'
import { DraggableTopBar } from '@/components/common/DraggableTopBar'
import { Settings as SettingsIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsMenu } from '@/components/settings/SettingsMenu'

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
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  
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

  // Đóng settings menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isSettingsOpen && !target.closest('.settings-button') && !target.closest('.settings-menu')) {
        setIsSettingsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSettingsOpen])
  
  // Tạo các class dựa trên nền tảng và theme
  const baseClasses = [
    'flex',
    'flex-col',
    'h-screen',
    'w-screen',
    'relative',
    'overflow-hidden', // Ngăn scroll dọc
    platform !== 'unknown' ? `platform-${platform}` : '',
    isDarkMode ? 'dark' : 'light',
    isHighContrastMode ? 'high-contrast' : ''
  ]
  
  return (
    <main className={twMerge(baseClasses.join(' '), className)}>
      {/* Controls Layer - luôn ở trên cùng */}
      <div className="fixed inset-0 pointer-events-none z-[9999]">
        {/* TopBar điều chỉnh theo từng nền tảng */}
        <div className="w-full h-10">
          <DraggableTopBar />
        </div>
        
        {/* Controls area - để đặt các nút điều khiển */}
        <div className="absolute top-0 right-0 flex items-center h-10 pr-4 pointer-events-auto">
          {/* Settings Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full hover:bg-neutral-700/50 transition-colors settings-button mr-2"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            aria-label="Cài đặt"
          >
            <SettingsIcon size={16} className="text-neutral-400" />
          </Button>
          
          {/* Ở đây có thể thêm các nút điều khiển khác */}
        </div>

        {/* Settings Menu - cho phép pointer-events khi hiển thị */}
        {isSettingsOpen && (
          <div className="pointer-events-auto settings-menu">
            <SettingsMenu isVisible={true} onClose={() => setIsSettingsOpen(false)} />
          </div>
        )}
      </div>
      
      {/* Main content container */}
      <div className="flex-1 overflow-hidden mt-[var(--platform-titlebar-height)] z-10">
        {children}
      </div>
    </main>
  )
}