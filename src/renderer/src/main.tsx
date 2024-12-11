import './assets/main.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Toast from '@/lib/toast/Toast'
import { AuthProvider } from './components/ContextProvider'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Toast>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Toast>
  </React.StrictMode>
)
