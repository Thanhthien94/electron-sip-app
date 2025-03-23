import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import fs from 'fs'

// Hàm chuẩn bị biến môi trường
const prepareEnv = (mode: string) => {
  // Load các biến từ file .env
  const env = loadEnv(mode, process.cwd(), '')
  
  // Nếu không có file .env, tạo biến mặc định
  if (!fs.existsSync(resolve('.env'))) {
    console.log('No .env file found, using default values')
  }
  
  // Xác định môi trường
  const isDevelopment = mode === 'development'
  
  // Chuẩn bị biến môi trường dựa trên môi trường
  const envPrefix = isDevelopment ? 'DEV_' : 'PROD_'
  
  // Các giá trị mặc định
  const defaultValues = {
    API_URL: isDevelopment ? 'http://localhost:3012/api' : 'https://onestar.finstar.vn/api',
    AUTH_URL: isDevelopment ? 'http://localhost:3014/auth' : 'https://onestar.finstar.vn/auth',
    WORKER_URL: isDevelopment ? 'http://localhost:3015/worker' : 'https://onestar.finstar.vn/worker',
    SIP_WS_URL: isDevelopment ? 'ws://103.27.238.195:8088/ws' : 'wss://sip.socket.onestar.vn/ws',
    SIP_SERVER_HOST: '103.27.238.195',
    SIP_NO_ANSWER_TIMEOUT: '45',
  }
  
  // Đọc từ biến môi trường có tiền tố phù hợp hoặc sử dụng giá trị mặc định
  const defineEnv: Record<string, string> = {
    'import.meta.env.VITE_API_URL': JSON.stringify(env[`${envPrefix}API_URL`] || defaultValues.API_URL),
    'import.meta.env.VITE_AUTH_URL': JSON.stringify(env[`${envPrefix}AUTH_URL`] || defaultValues.AUTH_URL),
    'import.meta.env.VITE_WORKER_URL': JSON.stringify(env[`${envPrefix}WORKER_URL`] || defaultValues.WORKER_URL),
    'import.meta.env.VITE_SIP_WS_URL': JSON.stringify(env[`${envPrefix}SIP_WS_URL`] || defaultValues.SIP_WS_URL),
    'import.meta.env.VITE_SIP_SERVER_HOST': JSON.stringify(env.SIP_SERVER_HOST || defaultValues.SIP_SERVER_HOST),
    'import.meta.env.VITE_SIP_NO_ANSWER_TIMEOUT': JSON.stringify(env.SIP_NO_ANSWER_TIMEOUT || defaultValues.SIP_NO_ANSWER_TIMEOUT),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(require('./package.json').version),
    'import.meta.env.VITE_APP_NAME': JSON.stringify(require('./package.json').name),
  }
  
  console.log('Environment variables prepared:', defineEnv)
  return defineEnv
}

export default defineConfig(({ mode }) => {
  // Chuẩn bị biến môi trường
  const define = prepareEnv(mode)
  
  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      define
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
      define
    },
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src'),
          '@shared': resolve('src/shared'),
          '@assets': resolve('src/renderer/src/assets'),
          '@/hooks': resolve('src/renderer/src/hooks'),
          '@/store': resolve('src/renderer/src/store'),
          '@/mocks': resolve('src/renderer/src/mocks'),
          '@/utils': resolve('src/renderer/src/utils'),
          '@/lib': resolve('src/renderer/src/lib'),
          '@/components': resolve('src/renderer/src/components'),
          '@/contexts': resolve('src/renderer/src/contexts'),
          '@/types': resolve('src/renderer/src/types')
        }
      },
      plugins: [react()],
      define
    }
  }
})