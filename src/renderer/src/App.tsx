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

export default function App(): JSX.Element {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { isCallActive, initSIP } = useCall()
  const { activeTab, setActiveTab } = useUI()
  
  // Thêm một ref để theo dõi trạng thái khởi tạo SIP
  const isSipInitialized = useRef<boolean>(false)

  // Initialize SIP connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.token && !isSipInitialized.current) {
      console.log('Khởi tạo SIP sau khi xác thực')
      // Thêm timeout để đảm bảo không bị loop
      setTimeout(() => {
        initSIP();
        isSipInitialized.current = true;
      }, 500);
    }
    
    // Reset the init flag when user logs out
    if (!isAuthenticated) {
      isSipInitialized.current = false;
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
      <span className="text-sky-400 absolute top-1">⭐️ Onestar SIP ☎️ ⭐️</span>

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