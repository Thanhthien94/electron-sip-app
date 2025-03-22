import { useEffect, useRef } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useCall } from './contexts/CallContext'
import { useUI } from './contexts/UIContext'
import { MainLayout } from './components/layouts/MainLayout'
import { DraggableTopBar } from './components/common/DraggableTopBar'
import { PhoneView } from './components/sip/PhoneView'
import { CDRList } from './components/cdr/CDRList'
import { CustomerList } from './components/customer/CustomerList'
import { LoginDialog } from './components/auth/LoginDialog'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader } from './components/common/Loader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Wifi, WifiOff } from 'lucide-react'

export default function App(): JSX.Element {
  const { 
    user, 
    isAuthenticated, 
    isLoading: authLoading, 
    isConnecting 
  } = useAuth()
  
  const { isCallActive, initSIP } = useCall()
  const { activeTab, setActiveTab } = useUI()
  
  // Thêm một ref để theo dõi trạng thái khởi tạo SIP
  const isSipInitialized = useRef<boolean>(false)
  const initAttemptCount = useRef<number>(0)

  // Initialize SIP connection when user is authenticated
  useEffect(() => {
    // Đảm bảo không khởi tạo SIP quá nhiều lần
    if (isAuthenticated && user?.token && !isSipInitialized.current && initAttemptCount.current < 3) {
      console.log('Khởi tạo SIP sau khi xác thực')
      
      // Thêm timeout để đảm bảo không bị loop
      setTimeout(() => {
        initSIP();
        isSipInitialized.current = true;
        initAttemptCount.current++;
      }, 1000);
    }
    
    // Reset the init flag when user logs out
    if (!isAuthenticated) {
      isSipInitialized.current = false;
      initAttemptCount.current = 0;
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

  return (
    <MainLayout>
      {/* Top bar with app title */}
      <DraggableTopBar />
      <div className="flex items-center justify-center absolute top-1 left-0 right-0">
        <span className="text-sky-400">⭐️ Onestar SIP ☎️ ⭐️</span>
        
        {/* Connection indicator */}
        {isConnecting && (
          <div className="ml-4 flex items-center gap-1 animate-pulse">
            <Wifi size={16} className="text-orange-400" />
            <span className="text-xs text-orange-400">Đang kết nối SIP...</span>
          </div>
        )}
      </div>

      {/* Connection alert */}
      {isConnecting && (
        <Alert className="absolute top-10 right-4 w-auto bg-orange-500/20 border-orange-500 shadow-md z-10 max-w-[300px]">
          <AlertDescription className="text-xs text-white flex items-center gap-2">
            <div className="animate-spin h-3 w-3 border-2 border-white rounded-full border-t-transparent"></div>
            Đang kết nối đến máy chủ SIP...
          </AlertDescription>
        </Alert>
      )}

      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[100vh] min-w-[100vw] max-w-full border"
      >
        {/* Left sidebar with tabs for CDR and Customer */}
        <ResizablePanel defaultSize={40} minSize={25} maxSize={50}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full border-r border-gray-400 flex flex-col items-center h-full"
          >
            <TabsList className="grid w-[90%] grid-cols-2 gap-1 items-center justify-center bg-neutral-50/20 mt-8">
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
        <ResizableHandle withHandle />

        {/* Right panel for phone and call information */}
        <ResizablePanel defaultSize={60}>
          <div className="mt-6 pt-10 pl-10">
            <PhoneView />

            {/* Conditional content based on call state */}
            {isCallActive && (
              <div className="mt-4 p-4 bg-neutral-800/50 rounded-lg">
                <p className="text-orange-400 font-medium">Cuộc gọi đang diễn ra</p>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </MainLayout>
  )
}