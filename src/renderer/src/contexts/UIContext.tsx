import { createContext, useContext, useState, ReactNode } from 'react'

interface UIContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
  isPhoneViewExpanded: boolean
  togglePhoneView: () => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('cdr')
  const [isPhoneViewExpanded, setIsPhoneViewExpanded] = useState<boolean>(false)

  const togglePhoneView = () => {
    setIsPhoneViewExpanded((prev) => !prev)
  }

  return (
    <UIContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isPhoneViewExpanded,
        togglePhoneView
      }}
    >
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}
