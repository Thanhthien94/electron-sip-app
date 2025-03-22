import './assets/main.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { CallProvider } from './contexts/CallContext'
import { UIProvider } from './contexts/UIContext'

// Wrap the app in all necessary providers
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <div className="min-h-[100vh]">
      {/* Toast notifications */}
      <ToastContainer 
        theme="colored" 
        position="bottom-left" 
        stacked 
        autoClose={5000}
      />
      
      {/* Auth context - user authentication */}
      <AuthProvider>
        {/* Call context - SIP calls management */}
        <CallProvider>
          {/* UI context - UI state management */}
          <UIProvider>
            <App />
          </UIProvider>
        </CallProvider>
      </AuthProvider>
    </div>
  </React.StrictMode>
)