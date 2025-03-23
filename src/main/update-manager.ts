/**
 * Quản lý cập nhật ứng dụng - phiên bản đã cải tiến
 */
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { autoUpdater, UpdateInfo } from 'electron-updater'
import * as log from 'electron-log'
import { is } from '@electron-toolkit/utils'
import * as fs from 'fs'

// Cấu hình logging
log.transports.file.level = 'debug'
autoUpdater.logger = log

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

// Thông tin cập nhật
interface UpdateState {
  status: UpdateStatus
  info: UpdateInfo | null
  error: string | null
  progress: {
    percent: number
    bytesPerSecond: number
    total: number
    transferred: number
  } | null
}

// Cấu hình kiểm tra cập nhật
const CONFIG = {
  CHECK_INTERVAL: 24 * 60 * 60 * 1000, // 24 giờ
  ERROR_COOLDOWN: 30 * 60 * 1000, // 30 phút
  INITIAL_DELAY: 3000, // 3 giây sau khi khởi động
  MAX_AUTO_CHECK_ERRORS: 3 // Số lỗi tối đa trước khi tạm dừng kiểm tra tự động
}

// Khởi tạo trạng thái cập nhật
let updateState: UpdateState = {
  status: UpdateStatus.NOT_CHECKED,
  info: null,
  error: null,
  progress: null
}

// Biến theo dõi
let mainWindow: BrowserWindow | null = null
let autoCheckTimeout: NodeJS.Timeout | null = null
let errorCount = 0 // Đếm số lần lỗi liên tiếp
let isErrorCooldown = false // Trạng thái tạm dừng sau lỗi
let lastErrorTime = 0 // Thời điểm xảy ra lỗi gần nhất
let updateDisabled = false // Có tắt tính năng cập nhật không

/**
 * Thiết lập cập nhật tự động
 */
export function setupAutoUpdater(window: BrowserWindow): void {
  // Lưu cửa sổ chính
  mainWindow = window

  // Không sử dụng trong development
  if (is.dev) {
    log.info('Không kiểm tra cập nhật trong môi trường development')
    updateDisabled = true
    return
  }

  // Kiểm tra URL cập nhật có phải là mặc định không
  try {
    const feedURL = autoUpdater.getFeedURL()
    if (!feedURL || feedURL.includes('example.com')) {
      log.warn('URL cập nhật chưa được cấu hình đúng hoặc là giá trị mặc định')
      log.warn('URL hiện tại:', feedURL)
      updateDisabled = true
      
      // Vẫn thiết lập các handlers để người dùng có thể thấy lỗi
      setupAutoUpdaterEvents()
      setupIpcHandlers()
      return
    }
  } catch (error) {
    log.error('Lỗi khi kiểm tra URL cập nhật:', error)
    updateDisabled = true
  }

  // Cấu hình theo nền tảng
  configureForPlatform()
  
  // Đăng ký các event listeners
  setupAutoUpdaterEvents()

  // Đăng ký IPC handlers
  setupIpcHandlers()

  // Khôi phục trạng thái tạm dừng lỗi nếu có
  restoreErrorState()

  // Kiểm tra cập nhật tự động
  scheduleUpdateCheck()
}

/**
 * Cấu hình riêng cho từng nền tảng
 */
function configureForPlatform(): void {
  if (process.platform === 'linux') {
    // Linux cần đường dẫn tùy chỉnh cho AppImage
    try {
      const feedURL = autoUpdater.getFeedURL()
      if (feedURL) {
        log.info('Cấu hình URL cho Linux:', feedURL)
        autoUpdater.setFeedURL({
          provider: 'generic',
          url: feedURL,
          useMultipleRangeRequest: false
        })
      }
    } catch (error) {
      log.error('Lỗi khi cấu hình feed URL cho Linux:', error)
    }
  }

  // Tùy chỉnh khác theo từng nền tảng
  if (process.platform === 'darwin') {
    // Cấu hình cho macOS
    autoUpdater.autoDownload = false // Yêu cầu người dùng xác nhận trước khi tải
  } else {
    // Windows và Linux
    autoUpdater.autoDownload = true
  }
}

/**
 * Khôi phục trạng thái lỗi từ trước
 */
function restoreErrorState(): void {
  try {
    const errorState = app.getPath('userData') + '/update-error-state.json'
    if (fs.existsSync(errorState)) {
      const data = JSON.parse(fs.readFileSync(errorState, 'utf8'))
      
      if (data.lastErrorTime) {
        const now = Date.now()
        const timeSinceError = now - data.lastErrorTime
        
        if (timeSinceError < CONFIG.ERROR_COOLDOWN) {
          isErrorCooldown = true
          lastErrorTime = data.lastErrorTime
          errorCount = data.errorCount || 0
          
          // Đặt timeout để hết thời gian tạm dừng
          setTimeout(() => {
            isErrorCooldown = false
            errorCount = 0
            saveErrorState()
          }, CONFIG.ERROR_COOLDOWN - timeSinceError)
          
          log.info(`Khôi phục trạng thái tạm dừng lỗi. Còn lại ${Math.floor((CONFIG.ERROR_COOLDOWN - timeSinceError) / 1000)} giây`)
        }
      }
    }
  } catch (error) {
    log.error('Lỗi khi khôi phục trạng thái lỗi:', error)
  }
}

/**
 * Lưu trạng thái lỗi
 */
function saveErrorState(): void {
  try {
    const errorState = app.getPath('userData') + '/update-error-state.json'
    fs.writeFileSync(errorState, JSON.stringify({
      lastErrorTime,
      errorCount
    }))
  } catch (error) {
    log.error('Lỗi khi lưu trạng thái lỗi:', error)
  }
}

/**
 * Lên lịch kiểm tra cập nhật
 */
function scheduleUpdateCheck(): void {
  // Hủy lịch kiểm tra cũ nếu có
  if (autoCheckTimeout) {
    clearTimeout(autoCheckTimeout)
    autoCheckTimeout = null
  }
  
  // Nếu đang tạm dừng sau lỗi, không lên lịch
  if (isErrorCooldown) {
    log.info('Đang trong thời gian tạm dừng sau lỗi, bỏ qua lên lịch kiểm tra')
    return
  }
  
  // Nếu đã tắt tính năng cập nhật, không lên lịch
  if (updateDisabled) {
    log.info('Tính năng cập nhật đã bị tắt, bỏ qua lên lịch kiểm tra')
    return
  }

  // Kiểm tra sau khi khởi động
  log.info(`Sẽ kiểm tra cập nhật sau ${CONFIG.INITIAL_DELAY / 1000} giây`)
  autoCheckTimeout = setTimeout(() => {
    checkForUpdates(false)
    
    // Lên lịch kiểm tra định kỳ
    autoCheckTimeout = setInterval(() => {
      checkForUpdates(false)
    }, CONFIG.CHECK_INTERVAL)
  }, CONFIG.INITIAL_DELAY)
}

/**
 * Thiết lập các sự kiện cho autoUpdater
 */
function setupAutoUpdaterEvents(): void {
  // Đang kiểm tra cập nhật
  autoUpdater.on('checking-for-update', () => {
    log.info('Đang kiểm tra cập nhật...')
    updateState = {
      ...updateState,
      status: UpdateStatus.CHECKING,
      error: null
    }
    sendStatusToWindow()
  })

  // Có cập nhật mới
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    log.info('Phát hiện cập nhật mới:', info)
    updateState = {
      ...updateState,
      status: UpdateStatus.AVAILABLE,
      info
    }
    sendStatusToWindow()
    
    // Reset error count vì đã kiểm tra thành công
    errorCount = 0
    isErrorCooldown = false
    saveErrorState()
    
    // Hỏi người dùng có muốn cập nhật không
    if (mainWindow) {
      mainWindow.webContents.send('update-prompt', info)
    }
  })

  // Không có cập nhật mới
  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    log.info('Không có cập nhật mới')
    updateState = {
      ...updateState,
      status: UpdateStatus.NOT_AVAILABLE,
      info
    }
    sendStatusToWindow()
    
    // Reset error count vì đã kiểm tra thành công
    errorCount = 0
    isErrorCooldown = false
    saveErrorState()
  })

  // Tiến trình tải cập nhật
  autoUpdater.on('download-progress', (progress) => {
    log.info(`Tiến trình tải: ${progress.percent.toFixed(2)}%`)
    updateState = {
      ...updateState,
      status: UpdateStatus.DOWNLOADING,
      progress
    }
    sendStatusToWindow()
  })

  // Đã tải xong cập nhật
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Cập nhật đã được tải xuống', info)
    updateState = {
      ...updateState,
      status: UpdateStatus.DOWNLOADED,
      info
    }
    sendStatusToWindow()
    
    // Hiển thị thông báo cho người dùng
    showUpdateNotification(info)
  })

  // Lỗi cập nhật
  autoUpdater.on('error', (error) => {
    log.error('Lỗi cập nhật:', error)
    
    // Tăng số lỗi liên tiếp và đặt thời gian tạm dừng
    errorCount++
    lastErrorTime = Date.now()
    
    // Lưu trạng thái lỗi
    saveErrorState()
    
    // Nếu số lỗi vượt quá ngưỡng, tạm dừng kiểm tra tự động
    if (errorCount >= CONFIG.MAX_AUTO_CHECK_ERRORS) {
      log.warn(`Đã gặp ${errorCount} lỗi liên tiếp, tạm dừng kiểm tra tự động trong ${CONFIG.ERROR_COOLDOWN / 60000} phút`)
      isErrorCooldown = true
      
      // Đặt timeout để hết thời gian tạm dừng
      setTimeout(() => {
        isErrorCooldown = false
        errorCount = 0
        saveErrorState()
        
        // Lên lịch lại
        scheduleUpdateCheck()
      }, CONFIG.ERROR_COOLDOWN)
      
      // Hủy lịch kiểm tra hiện tại
      if (autoCheckTimeout) {
        clearInterval(autoCheckTimeout)
        autoCheckTimeout = null
      }
    }
    
    updateState = {
      ...updateState,
      status: UpdateStatus.ERROR,
      error: error.message
    }
    sendStatusToWindow()
  })
}

/**
 * Thiết lập các IPC handlers để giao tiếp với renderer process
 */
function setupIpcHandlers(): void {
  // Nhận lệnh kiểm tra cập nhật từ renderer
  ipcMain.on('check-for-updates', () => {
    checkForUpdates(true)
  })

  // Nhận lệnh tải cập nhật từ renderer
  ipcMain.on('download-update', () => {
    downloadUpdate()
  })

  // Nhận lệnh cài đặt cập nhật từ renderer
  ipcMain.on('install-update', () => {
    installUpdate()
  })

  // Trả về trạng thái cập nhật hiện tại khi renderer yêu cầu
  ipcMain.handle('get-update-status', () => {
    return updateState
  })
  
  // Nhận lệnh tắt/bật tính năng cập nhật
  ipcMain.on('toggle-auto-update', (_, enabled) => {
    updateDisabled = !enabled
    log.info(`Tính năng cập nhật tự động ${updateDisabled ? 'đã bị tắt' : 'đã được bật'}`)
    
    if (!updateDisabled) {
      scheduleUpdateCheck()
    } else if (autoCheckTimeout) {
      clearInterval(autoCheckTimeout)
      autoCheckTimeout = null
    }
  })
  
  // Chấp nhận tạm dừng thông báo lỗi
  ipcMain.on('dismiss-update-error', () => {
    log.info('Người dùng đã đóng thông báo lỗi cập nhật')
    // Không hiển thị lỗi trong một thời gian
    updateState = {
      ...updateState,
      status: UpdateStatus.NOT_CHECKED,
      error: null
    }
    sendStatusToWindow()
  })
}

/**
 * Gửi trạng thái cập nhật đến renderer process
 */
function sendStatusToWindow(): void {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', updateState)
  }
}

/**
 * Hiển thị thông báo cập nhật cho người dùng
 */
function showUpdateNotification(info: UpdateInfo): void {
  if (!mainWindow) return

  // Gửi thông báo đến renderer để hiển thị trong giao diện
  mainWindow.webContents.send('update-ready', info)

  // Hiển thị hộp thoại native
  const dialogOpts = {
    type: 'info' as const,
    buttons: ['Cài đặt ngay', 'Để sau'],
    title: 'Cập nhật ứng dụng',
    message: 'Đã có phiên bản mới',
    detail: `${app.getName()} ${info.version} đã sẵn sàng để cài đặt.\n\nCập nhật này bao gồm các tính năng mới và sửa lỗi.`
  }

  dialog.showMessageBox(mainWindow, dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      installUpdate()
    }
  })
}

/**
 * Kiểm tra cập nhật
 * @param userInitiated Có phải người dùng chủ động kiểm tra hay không
 */
export function checkForUpdates(userInitiated = false): void {
  // Không sử dụng trong development
  if (is.dev) {
    log.info('Không kiểm tra cập nhật trong môi trường development')
    return
  }

  // Nếu tính năng cập nhật đã bị tắt và không phải người dùng yêu cầu
  if (updateDisabled && !userInitiated) {
    log.info('Tính năng cập nhật tự động đã bị tắt, bỏ qua kiểm tra tự động')
    return
  }

  // Nếu đang trong thời gian tạm dừng sau lỗi và không phải người dùng yêu cầu
  if (isErrorCooldown && !userInitiated) {
    log.info('Đang trong thời gian tạm dừng sau lỗi, bỏ qua kiểm tra tự động')
    return
  }

  log.info(`Kiểm tra cập nhật... (${userInitiated ? 'yêu cầu bởi người dùng' : 'tự động'})`)
  try {
    autoUpdater.checkForUpdates()
  } catch (error) {
    log.error('Lỗi khi kiểm tra cập nhật:', error)
    updateState = {
      ...updateState,
      status: UpdateStatus.ERROR,
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }
    sendStatusToWindow()
  }
}

/**
 * Tải cập nhật
 */
export function downloadUpdate(): void {
  if (updateState.status !== UpdateStatus.AVAILABLE) {
    log.warn('Không thể tải cập nhật vì không có cập nhật mới')
    return
  }

  log.info('Đang tải cập nhật...')
  autoUpdater.downloadUpdate()
}

/**
 * Cài đặt cập nhật
 */
export function installUpdate(): void {
  if (updateState.status !== UpdateStatus.DOWNLOADED) {
    log.warn('Không thể cài đặt cập nhật vì chưa tải xuống')
    return
  }

  log.info('Đang cài đặt cập nhật...')
  autoUpdater.quitAndInstall(false, true)
}
