import './assets/main.css'
import './assets/responsive.css'
import './assets/themes.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { CallProvider } from './contexts/CallContext'
import { UIProvider } from './contexts/UIContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { UpdateProvider } from './contexts/UpdateContext'

/**
 * Cấu trúc ứng dụng:
 * - ThemeProvider: Quản lý theme và responsive styling
 * - UpdateProvider: Quản lý cập nhật ứng dụng
 * - AuthProvider: Xác thực người dùng, quản lý phiên đăng nhập
 * - CallProvider: Quản lý cuộc gọi SIP
 * - UIProvider: Quản lý trạng thái UI, chuyển tab
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <div className="min-h-[100vh]">
        {/* Toast notifications - cấu hình toàn cục */}
        <ToastContainer 
          theme="colored" 
          position="bottom-left" 
          stacked 
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          pauseOnFocusLoss
        />
        
        {/* Providers */}
        <UpdateProvider>
          <AuthProvider>
            <CallProvider>
              <UIProvider>
                <App />
              </UIProvider>
            </CallProvider>
          </AuthProvider>
        </UpdateProvider>
      </div>
    </ThemeProvider>
  </React.StrictMode>
)