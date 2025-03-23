import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'react-toastify'
import { toastOptions } from '@/lib/toast'
import { UpdateStatus, UpdateState, UpdateInfo, UpdateContextType } from '@/types/update.types'
import { updateApi } from '@/lib/updateApi'

// Khởi tạo trạng thái mặc định
const initialUpdateState: UpdateState = {
  status: UpdateStatus.NOT_CHECKED,
  info: null,
  error: null,
  progress: null
}

// Tạo context
const UpdateContext = createContext<UpdateContextType | undefined>(undefined)

// Provider component
export const UpdateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [updateState, setUpdateState] = useState<UpdateState>(initialUpdateState)
  const [isDismissed, setIsDismissed] = useState<boolean>(false)
  const [errorCooldown, setErrorCooldown] = useState<boolean>(false)

  // Computed values
  const isUpdateAvailable = updateState.status === UpdateStatus.AVAILABLE && !isDismissed
  const isUpdateDownloaded = updateState.status === UpdateStatus.DOWNLOADED && !isDismissed
  const isUpdateError = updateState.status === UpdateStatus.ERROR
  const isCheckingForUpdate = updateState.status === UpdateStatus.CHECKING
  const isDownloadingUpdate = updateState.status === UpdateStatus.DOWNLOADING

  // Thiết lập IPC listeners
  useEffect(() => {
    if (!window.electron?.ipcRenderer) {
      console.warn('IPC Renderer không có sẵn, tính năng cập nhật bị vô hiệu hóa')
      return
    }

    // Nhận cập nhật trạng thái từ main process
    const updateStatusListener = (_event: Electron.IpcRendererEvent, newState: UpdateState) => {
      console.log('Trạng thái cập nhật mới:', newState)
      setUpdateState(newState)

      // Hiển thị thông báo dựa trên trạng thái mới
      if (newState.status === UpdateStatus.AVAILABLE) {
        toast.info(`Có bản cập nhật mới: ${newState.info?.version}`, toastOptions)
      } else if (newState.status === UpdateStatus.DOWNLOADED) {
        toast.success('Cập nhật đã sẵn sàng để cài đặt', toastOptions)
      } else if (newState.status === UpdateStatus.ERROR) {
        toast.error(`Lỗi cập nhật: ${newState.error}`, toastOptions)
      } else if (newState.status === UpdateStatus.NOT_AVAILABLE) {
        toast.info('Ứng dụng đã được cập nhật mới nhất', toastOptions)
      }
    }

    // Nhận thông báo cập nhật đã sẵn sàng
    const updateReadyListener = (_event: Electron.IpcRendererEvent, info: UpdateInfo) => {
      console.log('Cập nhật đã sẵn sàng:', info)
      // Không cần xử lý thêm vì đã xử lý trong updateStatusListener
    }

    // Nhận lời nhắc cập nhật
    const updatePromptListener = (_event: Electron.IpcRendererEvent, info: UpdateInfo) => {
      console.log('Nhắc cập nhật:', info)
      setIsDismissed(false)
    }

    // Đăng ký listeners
    window.electron.ipcRenderer.on('update-status', updateStatusListener)
    window.electron.ipcRenderer.on('update-ready', updateReadyListener)
    window.electron.ipcRenderer.on('update-prompt', updatePromptListener)

    // Lấy trạng thái cập nhật hiện tại khi component được mount
    const fetchUpdateStatus = async () => {
      const status = await updateApi.getUpdateStatus()
      if (status) {
        setUpdateState(status)
      }
    }

    fetchUpdateStatus()

    // Clean up listeners khi component unmount
    return () => {
      window.electron.ipcRenderer.removeListener('update-status', updateStatusListener)
      window.electron.ipcRenderer.removeListener('update-ready', updateReadyListener)
      window.electron.ipcRenderer.removeListener('update-prompt', updatePromptListener)
    }
  }, [])

  // Hàm kiểm tra cập nhật
  const checkForUpdates = () => {
    // Không kiểm tra nếu đang trong thời gian tạm dừng sau lỗi
    if (errorCooldown) {
      toast.info('Đã tạm dừng kiểm tra cập nhật sau lỗi. Vui lòng thử lại sau.', toastOptions)
      return
    }

    updateApi.checkForUpdates()
  }

  // Hàm tải cập nhật
  const downloadUpdate = () => {
    updateApi.downloadUpdate()
  }

  // Hàm cài đặt cập nhật
  const installUpdate = () => {
    updateApi.installUpdate()
  }

  // Hàm bỏ qua cập nhật
  const dismissUpdate = () => {
    setIsDismissed(true)

    // Nếu đang có lỗi, đặt thời gian tạm dừng dài hơn
    if (updateState.status === UpdateStatus.ERROR) {
      setErrorCooldown(true)
      setUpdateState({
        ...updateState,
        status: UpdateStatus.NOT_CHECKED,
        error: null
      })

      // Tạm dừng kiểm tra cập nhật trong 30 phút
      setTimeout(
        () => {
          setErrorCooldown(false)
        },
        30 * 60 * 1000
      ) // 30 phút
    }
  }

  // Giá trị context
  const contextValue: UpdateContextType = {
    updateState,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    dismissUpdate,
    isUpdateAvailable,
    isUpdateDownloaded,
    isUpdateError,
    isCheckingForUpdate,
    isDownloadingUpdate
  }

  return <UpdateContext.Provider value={contextValue}>{children}</UpdateContext.Provider>
}

// Hook để sử dụng context
export const useUpdate = () => {
  const context = useContext(UpdateContext)
  if (!context) {
    throw new Error('useUpdate must be used within an UpdateProvider')
  }
  return context
}
