import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'

// Extend the Window interface to include _sipLoopCount
declare global {
  interface Window {
    _sipLoopCount?: number;
  }
}
import axios from 'axios'
import { toast } from 'react-toastify'
import { AUTH_URL } from '@/lib/config'
import { getItem, saveItem, clearLocalStorage, validateStoredSIPData } from '@/lib/storage'
import { toastOptions } from '@/lib/toast'
import { User, SIPConfig } from '@/types/auth.types'

// Biến để theo dõi trạng thái giữa các lần render
let isFetchingSipGlobal = false;

// Cấu hình retry
const RETRY_DELAYS = [2000, 4000, 8000, 16000]; // Exponential backoff (2s, 4s, 8s, 16s)

interface AuthContextType {
  user: User | null
  sipConfig: SIPConfig | null
  isAuthenticated: boolean
  isLoading: boolean
  isConnecting: boolean // Thêm trạng thái đang kết nối
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  setIsOnline: (status: boolean) => void
  isOnline: boolean
  fetchSIPConfig: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [sipConfig, setSipConfig] = useState<SIPConfig | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isOnline, setIsOnline] = useState<boolean>(false)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  
  // Refs để theo dõi trạng thái
  const hasFetchedSip = useRef<boolean>(false)
  const isLoggingIn = useRef<boolean>(false)
  const fetchSIPRetryCount = useRef<number>(0)
  const fetchSIPRetryTimeout = useRef<any>(null)

  // Kiểm tra xác thực khi khởi tạo
  useEffect(() => {
    const checkAuth = async () => {
      const token = getItem('TOKEN')
      if (token) {
        try {
          // Kiểm tra tính hợp lệ của dữ liệu SIP trong localStorage
          const isValidSIPData = validateStoredSIPData();
          
          // Khôi phục thông tin người dùng từ localStorage
          const userData = {
            username: getItem('USERNAME'),
            firstname: getItem('FIRSTNAME'),
            lastname: getItem('LASTNAME'),
            email: getItem('EMAIL'),
            phone: getItem('PHONE'),
            refreshToken: getItem('RETOKEN'),
            token: getItem('TOKEN')
          }
          
          // Kiểm tra dữ liệu người dùng đầy đủ
          if (!userData.username || !userData.token) {
            throw new Error('Thiếu thông tin người dùng')
          }
          
          setUser(userData)
          setIsAuthenticated(true)
          
          console.log('Đã khôi phục phiên đăng nhập từ localStorage:', userData.username)
          
          // Nếu dữ liệu SIP không hợp lệ, xóa và lấy lại
          if (!isValidSIPData) {
            console.log('Dữ liệu SIP không hợp lệ, cần lấy lại');
            hasFetchedSip.current = false;
            // Chờ một chút trước khi lấy lại để tránh race condition
            setTimeout(() => {
              fetchSIPConfig();
            }, 1000);
          } else {
            // Thử lấy cấu hình SIP
            await fetchSIPConfig()
          }
        } catch (error) {
          console.error('Lỗi khôi phục phiên:', error)
          clearLocalStorage()
          setIsAuthenticated(false)
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  // Hàm lấy cấu hình SIP từ server với retry tốt hơn
  const fetchSIPConfig = async (): Promise<boolean> => {
    // Kiểm tra có đủ thông tin cần thiết không
    if (!getItem('SIPID') || !getItem('TOKEN')) {
      console.log('Không có SIPID hoặc TOKEN, không thể lấy cấu hình SIP')
      return false
    }
    
    // Tránh nhiều yêu cầu đồng thời bằng biến toàn cục
    if (isFetchingSipGlobal) {
      console.log('Đang lấy cấu hình SIP (global), bỏ qua yêu cầu mới')
      return false
    }
    
    // Nếu đã lấy thành công trước đó và vẫn còn cấu hình
    if (hasFetchedSip.current && sipConfig) {
      console.log('Đã lấy cấu hình SIP trước đó, sử dụng lại')
      
      // Reset bộ đếm loop nếu đã có sẵn cấu hình
      if (typeof window !== 'undefined' && window._sipLoopCount !== undefined) {
        window._sipLoopCount = 0;
      }
      
      return true
    }
    
    // Đánh dấu đang trong quá trình lấy cấu hình
    isFetchingSipGlobal = true
    setIsConnecting(true); // Hiển thị trạng thái đang kết nối
    console.log('Đang lấy cấu hình SIP từ server...')
    
    try {
      const config = {
        method: 'get',
        url: `${AUTH_URL}/user/sip?_id=${getItem('SIPID')}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getItem('TOKEN')}`
        },
        // Thêm timeout để không đợi quá lâu
        timeout: 10000
      }
      
      const res = await axios.request(config)
      const data = res.data.data
      
      if (data && data.length > 0) {
        // Trích xuất thông tin cấu hình từ phản hồi API
        const newSipConfig: SIPConfig = {
          extension: data[0]?.extension,
          password: data[0]?.password,
          sipServer: data[0]?.pbx?.host,
          wsHost: data[0]?.pbx?.WsHost,
          displayName: `${getItem('FIRSTNAME')} ${getItem('LASTNAME')}`
        }
        
        // Kiểm tra tính đầy đủ của cấu hình
        if (!newSipConfig.extension || !newSipConfig.password || 
            !newSipConfig.sipServer || !newSipConfig.wsHost) {
          console.error('Thiếu thông tin cấu hình SIP từ server:', newSipConfig)
          toast.error('Cấu hình SIP không đầy đủ', toastOptions)
          return false
        }
        
        // Cập nhật state với cấu hình mới
        setSipConfig(newSipConfig)
        setIsOnline(true)
        hasFetchedSip.current = true
        fetchSIPRetryCount.current = 0
        console.log('Lấy cấu hình SIP thành công:', newSipConfig.extension)
        
        // Reset bộ đếm loop
        if (typeof window !== 'undefined' && window._sipLoopCount !== undefined) {
          window._sipLoopCount = 0;
        }
        
        // Hủy mọi timeout retry nếu đang có
        if (fetchSIPRetryTimeout.current) {
          clearTimeout(fetchSIPRetryTimeout.current);
          fetchSIPRetryTimeout.current = null;
        }
        
        return true
      } else {
        console.warn('Không có dữ liệu SIP được trả về từ server')
        toast.error('Không tìm thấy cấu hình SIP từ server', toastOptions)
        
        // Thử lại sau 1 khoảng thời gian
        scheduleRetry();
        return false
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error.message || 'Lỗi không xác định'
      console.error('Lỗi khi lấy cấu hình SIP:', errorMsg)
      
      // Xử lý các trường hợp lỗi cụ thể
      if (error?.response?.status === 403) {
        clearLocalStorage()
        setIsAuthenticated(false)
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', toastOptions)
      } else {
        // Schedule retry với exponential backoff
        scheduleRetry();
      }
      
      return false
    } finally {
      // Đợi một chút để đảm bảo state được cập nhật
      setTimeout(() => {
        isFetchingSipGlobal = false;
        setIsConnecting(false); // Ẩn trạng thái kết nối
      }, 1000);
    }
  }
  
  // Hàm thử lại với exponential backoff
  const scheduleRetry = () => {
    // Hủy mọi timeout cũ nếu có
    if (fetchSIPRetryTimeout.current) {
      clearTimeout(fetchSIPRetryTimeout.current);
    }
    
    // Nếu đã vượt quá số lần retry cho phép
    if (fetchSIPRetryCount.current >= RETRY_DELAYS.length) {
      console.log('Đã vượt quá số lần thử lại tối đa');
      toast.error('Không thể kết nối đến máy chủ SIP sau nhiều lần thử', toastOptions);
      fetchSIPRetryCount.current = 0; // Reset counter
      setIsConnecting(false);
      return;
    }
    
    // Lấy thời gian chờ cho lần retry này
    const delay = RETRY_DELAYS[fetchSIPRetryCount.current];
    console.log(`Thử lại lấy cấu hình SIP sau ${delay/1000}s (lần ${fetchSIPRetryCount.current + 1})`);
    
    // Hiển thị thông báo thân thiện hơn cho người dùng
    if (fetchSIPRetryCount.current === 0) {
      toast.info('Đang kết nối đến máy chủ SIP...', toastOptions);
    } else {
      toast.info(`Thử kết nối lại lần ${fetchSIPRetryCount.current + 1}...`, toastOptions);
    }
    
    // Lên lịch thử lại
    fetchSIPRetryTimeout.current = setTimeout(() => {
      fetchSIPRetryCount.current++;
      isFetchingSipGlobal = false; // Đảm bảo có thể gọi lại
      fetchSIPConfig();
    }, delay);
  }

  // Hàm đăng nhập với các cải tiến về xử lý lỗi
  const login = async (username: string, password: string): Promise<void> => {
    // Tránh nhiều yêu cầu đăng nhập đồng thời
    if (isLoggingIn.current) {
      console.log('Đang trong quá trình đăng nhập, bỏ qua yêu cầu mới')
      return
    }
    
    isLoggingIn.current = true
    setIsLoading(true)
    
    try {
      // Kiểm tra tham số đầu vào
      if (!username.trim() || !password) {
        throw new Error('Tên đăng nhập và mật khẩu không được để trống')
      }
      
      // Gửi yêu cầu đăng nhập
      const response = await axios.post(`${AUTH_URL}/login`, { username, password })
      const data = response.data.data
      
      // Kiểm tra dữ liệu phản hồi
      if (!data || !data.token) {
        throw new Error('Dữ liệu đăng nhập không hợp lệ')
      }
      
      // Cập nhật state và lưu thông tin vào localStorage
      setUser(data)
      setIsAuthenticated(true)
      
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
        ROLE: data.role?.map((item: any) => item.name) || ''
      })
      
      // Hiển thị thông báo thành công
      toast.success(response.data.message || 'Đăng nhập thành công', toastOptions)
      
      // Reset trạng thái và lấy cấu hình SIP
      hasFetchedSip.current = false
      fetchSIPRetryCount.current = 0
      
      // Reset bộ đếm loop
      if (typeof window !== 'undefined') {
        window._sipLoopCount = 0;
      }
      
      // Fetch SIP config after login
      await fetchSIPConfig()
    } catch (error: any) {
      console.error('Lỗi đăng nhập:', error)
      
      // Xử lý thông báo lỗi từ server nếu có
      if (error.response?.data?.message) {
        toast.error(error.response.data.message, toastOptions)
      } else {
        toast.error(error.message || 'Đăng nhập thất bại', toastOptions)
      }
      
      // Đảm bảo xóa dữ liệu nếu đăng nhập thất bại
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
      isLoggingIn.current = false
    }
  }

  // Cải tiến hàm đăng xuất để xử lý dọn dẹp tốt hơn
  const logout = () => {
    // Hủy mọi timeout retry nếu đang có
    if (fetchSIPRetryTimeout.current) {
      clearTimeout(fetchSIPRetryTimeout.current);
      fetchSIPRetryTimeout.current = null;
    }
    
    // Đặt các giá trị về null trước
    setUser(null)
    setSipConfig(null)
    setIsAuthenticated(false)
    
    // Reset các trạng thái theo dõi
    hasFetchedSip.current = false
    fetchSIPRetryCount.current = 0
    
    // Reset bộ đếm loop
    if (typeof window !== 'undefined') {
      window._sipLoopCount = 0;
    }
    
    // Xóa dữ liệu trong localStorage
    clearLocalStorage()
    
    // Gửi thông báo logout đến electron main process
    try {
      window.electron.ipcRenderer.send('logout')
    } catch (error) {
      console.error('Lỗi khi gửi thông báo logout:', error)
    }
    
    // Thông báo đăng xuất thành công
    toast.info('Đã đăng xuất', toastOptions)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        sipConfig,
        isAuthenticated,
        isLoading,
        isConnecting,
        login,
        logout,
        isOnline,
        setIsOnline,
        fetchSIPConfig
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