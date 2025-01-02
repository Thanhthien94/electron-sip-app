import { SIP, Sidebar, DraggableTopBar } from './components'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

export default function App(): JSX.Element {
  return (
    <div className="flex h-full items-center justify-center">
        <DraggableTopBar />
        <span className="text-sky-400 absolute top-1">⭐️ Onestar SIP ☎️ ⭐️</span>
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[100vh] min-w-[100vw] max-w-full border"
      >
        <ResizablePanel defaultSize={40} minSize={25} maxSize={50}>
          <Sidebar></Sidebar>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <div className='mt-6 pt-10 pl-10'>
          <SIP></SIP>

          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
