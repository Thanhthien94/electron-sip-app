import './assets/main.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { CallProvider } from './contexts/CallContext'
import { UIProvider } from './contexts/UIContext'

/**
 * Cấu trúc ứng dụng:
 * - AuthProvider: Xác thực người dùng, quản lý phiên đăng nhập
 * - CallProvider: Quản lý cuộc gọi SIP
 * - UIProvider: Quản lý trạng thái UI, chuyển tab
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
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
      <AuthProvider>
        <CallProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </CallProvider>
      </AuthProvider>
    </div>
  </React.StrictMode>
)