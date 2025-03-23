import { useEffect, useRef, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useCall } from './contexts/CallContext'
import { useUI } from './contexts/UIContext'
import { PhoneView } from './components/sip/PhoneView'
import { CDRList } from './components/cdr/CDRList'
import { CustomerList } from './components/customer/CustomerList'
import { LoginDialog } from './components/auth/LoginDialog'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader } from './components/common/Loader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Wifi, Settings, X, Minus, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DraggableTopBar } from './components/DraggableTopBar'
import { SettingsMenu } from './components/settings'
import { UpdateNotification } from './components/update/UpdateNotification'

export default function App(): JSX.Element {
  const { user, isAuthenticated, isLoading: authLoading, isConnecting } = useAuth()
  const { isCallActive, initSIP } = useCall()
  const { activeTab, setActiveTab } = useUI()
  const [platform, setPlatform] = useState<string>('unknown')
  // const { setTheme, isDarkMode } = useTheme()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  // Thêm một ref để theo dõi trạng thái khởi tạo SIP
  const isSipInitialized = useRef<boolean>(false)
  const initAttemptCount = useRef<number>(0)

  useEffect(() => {
    if (window.navigator.userAgent.indexOf('Windows') !== -1) {
      setPlatform('win32')
    } else if (window.navigator.userAgent.indexOf('Mac') !== -1) {
      setPlatform('darwin')
    } else if (window.navigator.userAgent.indexOf('Linux') !== -1) {
      setPlatform('linux')
    }
  }, [])

  // Initialize SIP connection when user is authenticated
  useEffect(() => {
    // Đảm bảo không khởi tạo SIP quá nhiều lần
    if (
      isAuthenticated &&
      user?.token &&
      !isSipInitialized.current &&
      initAttemptCount.current < 3
    ) {
      console.log('Khởi tạo SIP sau khi xác thực')

      // Thêm timeout để đảm bảo không bị loop
      setTimeout(() => {
        initSIP()
        isSipInitialized.current = true
        initAttemptCount.current++
      }, 1000)
    }

    // Reset the init flag when user logs out
    if (!isAuthenticated) {
      isSipInitialized.current = false
      initAttemptCount.current = 0
    }
  }, [isAuthenticated, user, initSIP])

  // Show login dialog if not authenticated
  if (!isAuthenticated && !authLoading) {
    return <LoginDialog />
  }

  // Show loader while authenticating
  if (authLoading) {
    return <Loader message="Đang tải..." />
  }

  // Toggle theme function
  // const toggleTheme = () => {
  //   setTheme(isDarkMode ? 'light' : 'dark')
  // }

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

  const WindowsControls = () => (
    <div className="flex items-center space-x-2 -webkit-app-region: no-drag">
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

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Titlebar */}
      <div className="h-10 flex items-center justify-between bg-bg-primary border-b border-border-light">
        <DraggableTopBar />

        {/* Title */}
        <div className="w-full text-center">
          <span className="text-sky-400 text-sm">⭐️ Onestar SIP ☎️ ⭐️</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 pr-2 absolute right-2 top-1">
          {/* Theme toggle */}
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-8 w-8 p-0 rounded-full"
            >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </Button> */}

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <Settings size={16} />
          </Button>
          {platform === 'win32' && <WindowsControls />}
        </div>
        {/* Settings Menu */}
        {isSettingsOpen && (
          <div className="absolute right-0 top-10 z-[9999]">
            <SettingsMenu isVisible={true} onClose={() => setIsSettingsOpen(false)} />
          </div>
        )}
      </div>

      {/* Connection indicator */}
      <div className="relative">
        {isConnecting && (
          <div className="absolute top-1 left-0 right-0 z-50 flex items-center justify-center">
            <div className="flex items-center gap-1 animate-pulse">
              <Wifi size={16} className="text-orange-400" />
              <span className="text-xs text-orange-400">Đang kết nối SIP...</span>
            </div>
          </div>
        )}

        {/* Connection alert */}
        {isConnecting && (
          <Alert className="absolute top-1 right-4 w-auto bg-orange-500/20 border-orange-500 shadow-md z-50 max-w-[300px]">
            <AlertDescription className="text-xs text-white flex items-center gap-2">
              <div className="animate-spin h-3 w-3 border-2 border-white rounded-full border-t-transparent"></div>
              Đang kết nối đến máy chủ SIP...
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left sidebar with tabs for CDR and Customer */}
          <ResizablePanel defaultSize={40} minSize={25} maxSize={50} className="bg-sidebar-bg">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full border-r border-border-light flex flex-col items-center h-full"
            >
              <TabsList className="grid w-[90%] grid-cols-2 gap-1 items-center justify-center bg-bg-tertiary/20 mt-2">
                <TabsTrigger value="cdr">CDR</TabsTrigger>
                <TabsTrigger value="contact">Danh bạ</TabsTrigger>
              </TabsList>

              <TabsContent value="cdr" className="w-full flex-grow overflow-hidden">
                <CDRList />
              </TabsContent>

              <TabsContent value="contact" className="w-full flex-grow overflow-hidden">
                <CustomerList />
              </TabsContent>
            </Tabs>
          </ResizablePanel>

          {/* Resizable handle between panels */}
          <ResizableHandle withHandle className="bg-border-medium" />

          {/* Right panel for phone and call information */}
          <ResizablePanel defaultSize={60} className="bg-bg-primary overflow-auto">
            <div className="mt-2 pt-2 pl-10 pr-6 pb-6">
              <PhoneView />

              {/* Conditional content based on call state */}
              {isCallActive && (
                <div className="mt-4 p-4 bg-bg-secondary rounded-lg border border-border-light">
                  <p className="text-accent font-medium">Cuộc gọi đang diễn ra</p>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Thêm UpdateNotification component */}
      <UpdateNotification />
    </div>
  )
}
