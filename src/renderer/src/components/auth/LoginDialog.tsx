import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, LogIn, User } from 'lucide-react'

export const LoginDialog = () => {
  const { login, isLoading } = useAuth()
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  
  // Handle login form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập')
      return
    }
    
    if (!password) {
      setError('Vui lòng nhập mật khẩu')
      return
    }
    
    try {
      await login(username, password)
    } catch (err) {
      setError('Đăng nhập thất bại')
    }
  }
  
  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && username && password) {
      handleSubmit(e)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-neutral-900/90 p-8 rounded-lg border border-neutral-700 shadow-xl w-[360px] backdrop-blur">
        <div className="flex flex-col items-center mb-6">
          <div className="rounded-full bg-orange-400/10 p-3 mb-2">
            <User size={32} className="text-orange-400" />
          </div>
          <h2 className="text-xl font-medium text-white">Đăng nhập SIP App</h2>
          <p className="text-neutral-400 text-sm mt-1">
            Nhập thông tin đăng nhập để tiếp tục
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm text-neutral-300">
              Tên đăng nhập
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Nhập tên đăng nhập hoặc email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-neutral-800 border-neutral-700 focus:border-orange-500 transition-colors"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-neutral-300">
              Mật khẩu
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-neutral-800 border-neutral-700 focus:border-orange-500 transition-colors"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 transition-colors mt-4 flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              <>
                <LogIn size={16} />
                Đăng nhập
              </>
            )}
          </Button>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-neutral-500 text-xs">
            © 2024 Onestar SIP. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}