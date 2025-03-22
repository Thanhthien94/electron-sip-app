import { X, Minus, Square } from 'lucide-react'

export const DraggableTopBar = () => {
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
  
  return (
    <header className="absolute inset-x-0 top-0 h-8 bg-transparent cursor-move flex justify-between items-center px-3 z-50">
      {/* Draggable region - most of the top bar */}
      <div className="flex-1 h-full -webkit-app-region: drag" />
      
      {/* Window controls - not draggable */}
      <div className="flex items-center space-x-2 -webkit-app-region: no-drag">
        <button
          onClick={handleMinimize}
          className="p-1 rounded hover:bg-neutral-700/50 transition-colors text-neutral-400 hover:text-white"
        >
          <Minus size={14} />
        </button>
        
        <button
          onClick={handleMaximize}
          className="p-1 rounded hover:bg-neutral-700/50 transition-colors text-neutral-400 hover:text-white"
        >
          <Square size={14} />
        </button>
        
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-red-500/80 transition-colors text-neutral-400 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </header>
  )
}