import React, { useEffect, useState } from 'react'
import { X, Minus, Square, Maximize2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface DraggableTopBarProps {
  platform?: string
}

export const DraggableTopBar: React.FC<DraggableTopBarProps> = ({ platform = 'unknown' }) => {
  // Phát hiện nền tảng nếu không được truyền vào
  const [detectedPlatform, setDetectedPlatform] = useState(platform);
  const { theme, setTheme } = useTheme();
  
  // Phát hiện nền tảng khi component mount
  useEffect(() => {
    if (platform === 'unknown') {
      if (window.navigator.userAgent.indexOf('Windows') !== -1) {
        setDetectedPlatform('win32');
      } else if (window.navigator.userAgent.indexOf('Mac') !== -1) {
        setDetectedPlatform('darwin');
      } else if (window.navigator.userAgent.indexOf('Linux') !== -1) {
        setDetectedPlatform('linux');
      }
    }
  }, [platform]);
  
  // Handle window controls for Electron
  const handleClose = () => {
    window.electron?.ipcRenderer.send('close-window')
  }
  
  const handleMinimize = () => {
    window.electron?.ipcRenderer.send('minimize-window')
  }
  
  const handleMaximize = () => {
    window.electron?.ipcRenderer.send('maximize-window')
  }
  
  // Chuyển đổi theme
  const toggleTheme = () => {
    console.log("Current theme:", theme); // Debug
    if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }
  
  // Windows style controls (phải)
  const WindowsControls = () => (
    <div className="flex items-center space-x-2 -webkit-app-region: no-drag absolute top-0 right-0">
      <button
        onClick={handleMinimize}
        className="p-2 rounded hover:bg-neutral-700/50 transition-colors text-neutral-400 hover:text-white"
        aria-label="Minimize"
      >
        <Minus size={12} />
      </button>
      
      <button
        onClick={handleMaximize}
        className="p-2 rounded hover:bg-neutral-700/50 transition-colors text-neutral-400 hover:text-white"
        aria-label="Maximize"
      >
        <Square size={12} />
      </button>
      
      <button
        onClick={handleClose}
        className="p-2 rounded hover:bg-red-500/80 transition-colors text-neutral-400 hover:text-white"
        aria-label="Close"
      >
        <X size={12} />
      </button>
    </div>
  )
  
  // macOS style controls (trái)
  const MacOSControls = () => (
    <div className="flex items-center space-x-2 -webkit-app-region: no-drag absolute top-1 left-2">
      <button
        onClick={handleClose}
        className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center"
        aria-label="Close"
      >
        <X size={8} className="opacity-0 group-hover:opacity-100 text-red-900" />
      </button>
      
      <button
        onClick={handleMinimize}
        className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors flex items-center justify-center"
        aria-label="Minimize"
      >
        <Minus size={8} className="opacity-0 group-hover:opacity-100 text-yellow-900" />
      </button>
      
      <button
        onClick={handleMaximize}
        className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center"
        aria-label="Maximize"
      >
        <Maximize2 size={8} className="opacity-0 group-hover:opacity-100 text-green-900" />
      </button>
    </div>
  )
  
  // Linux style controls (phải)
  const LinuxControls = () => (
    <div className="flex items-center space-x-2 -webkit-app-region: no-drag absolute top-0 right-0">
      <button
        onClick={handleMinimize}
        className="p-2 rounded hover:bg-neutral-700/50 transition-colors text-neutral-400 hover:text-white"
        aria-label="Minimize"
      >
        <Minus size={14} />
      </button>
      
      <button
        onClick={handleMaximize}
        className="p-2 rounded hover:bg-neutral-700/50 transition-colors text-neutral-400 hover:text-white"
        aria-label="Maximize"
      >
        <Square size={14} />
      </button>
      
      <button
        onClick={handleClose}
        className="p-2 rounded hover:bg-red-500/80 transition-colors text-neutral-400 hover:text-white"
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  )
  
  // Quyết định platform cuối cùng để sử dụng
  const activePlatform = detectedPlatform;
  
  return (
    <header className="relative inset-x-0 top-0 h-10 bg-transparent -webkit-app-region: drag flex justify-between items-center px-3 z-[9999] window-controls">
      {/* Hiển thị controls tùy theo nền tảng */}
      {/* {activePlatform === 'win32' && <WindowsControls />}
      {activePlatform === 'darwin' && <MacOSControls />}
      {activePlatform === 'linux' && <LinuxControls />} */}
      
      {/* Title ở giữa top bar - chỉ hiển thị cho Windows và Linux */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-center h-8 pointer-events-none">
        <span className="text-sky-400 text-sm">⭐️ Onestar SIP ☎️ ⭐️</span>
      </div>
      
      {/* Theme toggle */}
      <button 
        onClick={toggleTheme}
        className={`absolute ${activePlatform === 'darwin' ? 'right-4 top-1.5' : 'right-28 top-1.5'} px-2 py-0.5 rounded-full bg-neutral-700/30 hover:bg-neutral-700/50 transition-colors -webkit-app-region: no-drag z-50`}
        // aria-label="Toggle theme"
      >
        <span className="text-xs text-white z-0">
          {theme === 'light' ? '🌙' : '☀️'}
        </span>
      </button>
    </header>
  )
}