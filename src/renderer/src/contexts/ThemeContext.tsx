import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Định nghĩa các theme có sẵn
export type ThemeType = 'system' | 'light' | 'dark' | 'high-contrast'

// Context data type
interface ThemeContextType {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
  isDarkMode: boolean
  isHighContrastMode: boolean
  systemTheme: 'light' | 'dark'
}

// Khởi tạo context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Đọc theme từ localStorage hoặc dùng system là mặc định
  const [theme, setThemeState] = useState<ThemeType>(
    () => (localStorage.getItem('theme') as ThemeType) || 'system'
  )
  
  // Theo dõi chế độ hệ thống
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )
  
  // Thực theme được áp dụng dựa trên setting và system theme
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>(
    theme === 'system' ? systemTheme : (theme === 'high-contrast' ? 'dark' : theme)
  )
  
  // Kiểm tra xem có đang ở dark mode không
  const isDarkMode = activeTheme === 'dark'
  
  // Kiểm tra xem có đang ở high contrast mode không
  const isHighContrastMode = theme === 'high-contrast'

  // Lắng nghe thay đổi chế độ hệ thống
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])
  
  // Cập nhật active theme khi theme hoặc system theme thay đổi
  useEffect(() => {
    if (theme === 'system') {
      setActiveTheme(systemTheme)
    } else if (theme === 'high-contrast') {
      setActiveTheme('dark') // High contrast được xây dựng trên nền dark theme
    } else {
      setActiveTheme(theme)
    }
  }, [theme, systemTheme])
  
  // Cập nhật CSS classes trên document
  useEffect(() => {
    // Xóa tất cả theme classes cũ
    document.documentElement.classList.remove('light', 'dark', 'high-contrast')
    
    // Thêm class cho active theme
    document.documentElement.classList.add(activeTheme)
    
    // Thêm class riêng cho high contrast nếu cần
    if (isHighContrastMode) {
      document.documentElement.classList.add('high-contrast')
    }
    
    // Cập nhật meta theme-color cho mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        isDarkMode ? '#1B1B1F' : '#FFFFFF'
      )
    }
  }, [activeTheme, isHighContrastMode, isDarkMode])
  
  // Hàm cập nhật theme
  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }
  
  // Giá trị context
  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    isDarkMode,
    isHighContrastMode,
    systemTheme
  }
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

// Hook để sử dụng theme
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}