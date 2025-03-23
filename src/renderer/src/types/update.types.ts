/**
 * Types for update functionality
 */

// Trạng thái cập nhật
export enum UpdateStatus {
    NOT_CHECKED = 'not-checked',
    CHECKING = 'checking',
    AVAILABLE = 'available',
    NOT_AVAILABLE = 'not-available',
    DOWNLOADING = 'downloading',
    DOWNLOADED = 'downloaded',
    ERROR = 'error'
  }
  
  // Thông tin phiên bản cập nhật
  export interface UpdateInfo {
    version: string
    releaseDate?: string
    releaseNotes?: string | string[] | null
    files: Array<{
      url: string
      sha512?: string
      size?: number
    }>
    path?: string
  }
  
  // Thông tin tiến trình tải cập nhật
  export interface UpdateProgress {
    percent: number
    bytesPerSecond: number
    total: number
    transferred: number
  }
  
  // Trạng thái cập nhật đầy đủ
  export interface UpdateState {
    status: UpdateStatus
    info: UpdateInfo | null
    error: string | null
    progress: UpdateProgress | null
  }
  
  // Context API cho cập nhật
  export interface UpdateContextType {
    updateState: UpdateState
    checkForUpdates: () => void
    downloadUpdate: () => void
    installUpdate: () => void
    dismissUpdate: () => void
    isUpdateAvailable: boolean
    isUpdateDownloaded: boolean
    isUpdateError: boolean
    isCheckingForUpdate: boolean
    isDownloadingUpdate: boolean
  }