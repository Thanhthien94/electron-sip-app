import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AUTH_URL } from '@/lib/config'
import { getItem, saveItem, clearLocalStorage } from '@/lib/storage'
import { toastOptions } from '@/lib/toast'
import { User, SIPConfig } from '@/types/auth.types'

interface AuthContextType {
  user: User | null
  sipConfig: SIPConfig | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  setIsOnline: (status: boolean) => void
  isOnline: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [sipConfig, setSipConfig] = useState<SIPConfig | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isOnline, setIsOnline] = useState<boolean>(false)

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = getItem('TOKEN')
      if (token) {
        try {
          setUser({
            username: getItem('USERNAME'),
            firstname: getItem('FIRSTNAME'),
            lastname: getItem('LASTNAME'),
            email: getItem('EMAIL'),
            phone: getItem('PHONE'),
            refreshToken: getItem('RETOKEN'),
            token: getItem('TOKEN')
          })
          setIsAuthenticated(true)
          await fetchSIPConfig()
        } catch (error) {
          console.error('Error restoring session:', error)
          clearLocalStorage()
          setIsAuthenticated(false)
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  // Fetch SIP configuration
  const fetchSIPConfig = async () => {
    if (!getItem('SIPID')) return

    const config = {
      method: 'get',
      url: `${AUTH_URL}/user/sip?_id=${getItem('SIPID')}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getItem('TOKEN')}`
      }
    }

    try {
      const res = await axios.request(config)
      const data = res.data.data
      
      if (data && data.length > 0) {
        setSipConfig({
          extension: data[0]?.extension,
          password: data[0]?.password,
          sipServer: data[0]?.pbx?.host,
          wsHost: data[0]?.pbx?.WsHost,
          displayName: `${getItem('FIRSTNAME')} ${getItem('LASTNAME')}`
        })
        setIsOnline(true)
      }
    } catch (error: any) {
      console.error('Error fetching SIP config:', error)
      
      if (error?.response?.status === 403) {
        clearLocalStorage()
        setIsAuthenticated(false)
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', toastOptions)
      }
      setIsOnline(false)
    }
  }

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true)
    
    try {
      const response = await axios.post(`${AUTH_URL}/login`, { username, password })
      const data = response.data.data
      
      // Save user data
      setUser(data)
      setIsAuthenticated(true)
      
      // Store in localStorage
      saveItem({
        USERNAME: data.username || '',
        USERID: data._id || '',
        SIPID: data.sip || '',
        TOKEN: data.token || '',
        RETOKEN: data.refreshToken || '',
        PHONE: data.phone || '',
        EMAIL: data.email || '',
        FIRSTNAME: data.firstname || '',
        LASTNAME: data.lastname || '',
        ROLE: data.role.map((item: any) => item.name) || ''
      })
      
      toast.success(response.data.message, toastOptions)
      
      // Fetch SIP config after login
      await fetchSIPConfig()
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.response?.data.message || 'Đăng nhập thất bại', toastOptions)
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    setSipConfig(null)
    setIsAuthenticated(false)
    clearLocalStorage()
    window.electron.ipcRenderer.send('logout')
    toast.info('Đã đăng xuất', toastOptions)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        sipConfig,
        isAuthenticated,
        isLoading,
        login,
        logout,
        isOnline,
        setIsOnline
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}