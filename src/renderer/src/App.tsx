import { SIP, LeftBar, DraggableTopBar } from './components'

function App(): JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
    <DraggableTopBar />
      <div className="flex h-full items-center justify-center">
        <span className="text-sky-400 absolute top-1">⭐️ Finstar SIP ☎️ ⭐️</span>
        <LeftBar>
          <SIP />
        </LeftBar>
      </div>
    </>
  )
}

export default App
