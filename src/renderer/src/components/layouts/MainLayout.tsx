import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Power } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

interface MainLayoutProps {
  children: ReactNode
  className?: string
}

export const MainLayout = ({ children, className }: MainLayoutProps) => {
  const { logout, isAuthenticated } = useAuth()
  
  const handleLogout = () => {
    logout()
  }
  
  return (
    <main className={twMerge('flex flex-col h-screen w-screen relative', className)}>
      {/* Main content */}
      <div className="flex-1 overflow-auto">{children}</div>
      
      {/* Logout button - only show when authenticated */}
      {isAuthenticated && (
        <button
          onClick={handleLogout}
          className="absolute bottom-3 left-3 px-2 py-2 w-fit rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          title="Đăng xuất"
        >
          <Power size={20} />
        </button>
      )}
    </main>
  )
}