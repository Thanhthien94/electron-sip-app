import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
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
    plugins: [react()]
  }
})
