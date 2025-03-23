/**
 * API cho tương tác với quá trình cập nhật
 */
import { UpdateState } from '@/types/update.types'

// API để gọi các chức năng cập nhật qua IPC
export const updateApi = {
  /**
   * Kiểm tra cập nhật mới
   */
  checkForUpdates: (): void => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('check-for-updates')
    } else {
      console.error('IPC Renderer không có sẵn')
    }
  },

  /**
   * Tải cập nhật
   */
  downloadUpdate: (): void => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('download-update')
    } else {
      console.error('IPC Renderer không có sẵn')
    }
  },

  /**
   * Cài đặt cập nhật
   */
  installUpdate: (): void => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('install-update')
    } else {
      console.error('IPC Renderer không có sẵn')
    }
  },

  /**
   * Lấy trạng thái cập nhật hiện tại
   */
  getUpdateStatus: async (): Promise<UpdateState | null> => {
    if (window.electron?.ipcRenderer) {
      try {
        return await window.electron.ipcRenderer.invoke('get-update-status')
      } catch (error) {
        console.error('Lỗi khi lấy trạng thái cập nhật:', error)
        return null
      }
    } else {
      console.error('IPC Renderer không có sẵn')
      return null
    }
  }
}