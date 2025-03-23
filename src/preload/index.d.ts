import { ElectronAPI } from '@electron-toolkit/preload'

interface PlatformInfo {
  platform: string
  arch: string
  version: string
  appName: string
}

// Định nghĩa kiểu cho các listener
type MaximizeChangeListener = (isMaximized: boolean) => void
type ThemeChangeListener = (theme: string) => void

// Window controls API
interface WindowAPI {
  close: () => void
  minimize: () => void
  maximize: () => void
  isMaximized: boolean
  onMaximizeChange: (callback: MaximizeChangeListener) => void
  removeMaximizeChangeListener: (callback: MaximizeChangeListener) => void
}

// Platform info API
interface PlatformAPI {
  info: PlatformInfo | null
  isMac: () => boolean
  isWindows: () => boolean
  isLinux: () => boolean
  getName: () => string
}

// Theme API
interface ThemeAPI {
  current: string
  set: (theme: string) => void
  onThemeChange: (callback: ThemeChangeListener) => void
  removeThemeChangeListener: (callback: ThemeChangeListener) => void
}

// Config API
interface ConfigAPI {
  save: (config: Record<string, any>) => Promise<{ success: boolean, error?: string }>
  get: <T>(key: string, defaultValue?: T) => T
  set: (key: string, value: any) => void
  remove: (key: string) => void
  clear: () => void
}

// Custom API for renderer
interface API {
  window: WindowAPI
  platform: PlatformAPI
  theme: ThemeAPI
  config: ConfigAPI
  logout: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}