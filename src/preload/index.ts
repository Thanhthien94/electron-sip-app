import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Định nghĩa kiểu cho thông tin nền tảng
interface PlatformInfo {
  platform: string
  arch: string
  version: string
  appName: string
}

// Định nghĩa kiểu cho các listener
type MaximizeChangeListener = (isMaximized: boolean) => void
type ThemeChangeListener = (theme: string) => void

// Custom APIs for renderer process
const api = {
  // Window controls API
  window: {
    close: () => ipcRenderer.send('close-window'),
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    isMaximized: false,
    
    // Các callbacks cho sự kiện maximize thay đổi
    maximizeChangeListeners: [] as MaximizeChangeListener[],
    
    // Đăng ký callback cho sự kiện maximize thay đổi
    onMaximizeChange: (callback: MaximizeChangeListener) => {
      api.window.maximizeChangeListeners.push(callback)
    },
    
    // Hủy đăng ký callback
    removeMaximizeChangeListener: (callback: MaximizeChangeListener) => {
      const index = api.window.maximizeChangeListeners.indexOf(callback)
      if (index !== -1) {
        api.window.maximizeChangeListeners.splice(index, 1)
      }
    }
  },
  
  // Platform info API
  platform: {
    // Thông tin nền tảng nhận được từ main process
    info: null as PlatformInfo | null,
    
    // Kiểm tra nền tảng hiện tại
    isMac: () => api.platform.info?.platform === 'darwin',
    isWindows: () => api.platform.info?.platform === 'win32',
    isLinux: () => api.platform.info?.platform === 'linux',
    
    // Lấy tên nền tảng
    getName: () => api.platform.info?.platform || 'unknown'
  },
  
  // Theme API
  theme: {
    // Theme hiện tại
    current: localStorage.getItem('theme') || 'system',
    
    // Thay đổi theme
    set: (theme: string) => {
      localStorage.setItem('theme', theme)
      ipcRenderer.send('set-theme', theme)
      api.theme.current = theme
      
      // Gọi tất cả các theme listeners
      api.theme.themeChangeListeners.forEach(listener => listener(theme))
    },
    
    // Các callbacks cho sự kiện theme thay đổi
    themeChangeListeners: [] as ThemeChangeListener[],
    
    // Đăng ký callback cho sự kiện theme thay đổi
    onThemeChange: (callback: ThemeChangeListener) => {
      api.theme.themeChangeListeners.push(callback)
    },
    
    // Hủy đăng ký callback
    removeThemeChangeListener: (callback: ThemeChangeListener) => {
      const index = api.theme.themeChangeListeners.indexOf(callback)
      if (index !== -1) {
        api.theme.themeChangeListeners.splice(index, 1)
      }
    }
  },
  
  // Config API - lưu và đọc cấu hình
  config: {
    // Lưu cấu hình
    save: async (config: Record<string, any>) => {
      return ipcRenderer.invoke('save-config', config)
    },
    
    // Lấy giá trị từ localStorage
    get: (key: string, defaultValue: any = null) => {
      const value = localStorage.getItem(key)
      if (value === null) return defaultValue
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    },
    
    // Lưu giá trị vào localStorage
    set: (key: string, value: any) => {
      if (typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value))
      } else {
        localStorage.setItem(key, value)
      }
    },
    
    // Xóa giá trị từ localStorage
    remove: (key: string) => {
      localStorage.removeItem(key)
    },
    
    // Xóa tất cả
    clear: () => {
      localStorage.clear()
    }
  },
  
  // Gửi thông báo đăng xuất
  logout: () => {
    ipcRenderer.send('logout')
  }
}

// Nhận thông tin nền tảng từ main process
ipcRenderer.on('platform-info', (_: IpcRendererEvent, info: PlatformInfo) => {
  api.platform.info = info
})

// Nhận thông tin về trạng thái maximize
ipcRenderer.on('maximize-change', (_: IpcRendererEvent, isMaximized: boolean) => {
  api.window.isMaximized = isMaximized
  // Gọi tất cả các listeners
  api.window.maximizeChangeListeners.forEach(listener => listener(isMaximized))
})

// Nhận thông tin về thay đổi theme
ipcRenderer.on('theme-changed', (_: IpcRendererEvent, theme: string) => {
  api.theme.current = theme
  // Gọi tất cả các theme listeners
  api.theme.themeChangeListeners.forEach(listener => listener(theme))
})

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}