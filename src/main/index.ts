import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as path from 'path'
import * as fs from 'fs'
import { setupAutoUpdater } from './update-manager'

// Biến theo dõi trạng thái cửa sổ
let mainWindow: BrowserWindow | null = null
let isMaximized = false

// Đọc biến môi trường từ file .env trong development hoặc từ app path trong production
function loadEnv() {
  try {
    // Xác định đường dẫn đến file .env
    const envPath = is.dev 
      ? path.join(process.cwd(), '.env')
      : path.join(app.getPath('userData'), '.env')
    
    // Kiểm tra xem file có tồn tại không
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      const envLines = envContent.split('\n')
      
      // Parse các biến môi trường và thêm vào process.env
      envLines.forEach(line => {
        if (line && !line.startsWith('#')) {
          const match = line.match(/^([^=]+)=(.*)$/)
          if (match) {
            const key = match[1].trim()
            let value = match[2].trim()
            
            // Xóa dấu nháy nếu có
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.substring(1, value.length - 1)
            }
            
            process.env[key] = value
          }
        }
      })
    }
  } catch (error) {
    console.error('Error loading .env file:', error)
  }
}

function createWindow(): void {
  // Load biến môi trường
  loadEnv()
  
  // Phát hiện nền tảng để điều chỉnh cấu hình cửa sổ
  const platform = process.platform
  
  // Thiết lập frame và titleBarStyle dựa trên nền tảng
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    minWidth: 500,
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    center: true,
    title: 'Onestar SIP',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  }
  
  // Thêm các tùy chọn đặc biệt cho macOS
  if (platform === 'darwin') {
    windowOptions.vibrancy = 'under-window'
    windowOptions.visualEffectState = 'active'
    windowOptions.trafficLightPosition = { x: 15, y: 10 }
  }
  
  // Thêm icon cho Linux
  if (platform === 'linux') {
    windowOptions.icon = icon
  }
  
  // Tạo cửa sổ chính
  mainWindow = new BrowserWindow(windowOptions)

  // Xử lý IPC cho điều khiển cửa sổ
  setupWindowControls()

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
      
      // Gửi thông tin về nền tảng cho renderer
      mainWindow.webContents.send('platform-info', {
        platform: process.platform,
        arch: process.arch,
        version: app.getVersion(),
        appName: app.getName()
      })
      
      // Thiết lập auto updater
      setupAutoUpdater(mainWindow)
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load URL cho development hoặc production
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // Mở DevTools trong development
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Thiết lập xử lý cho các điều khiển cửa sổ
function setupWindowControls() {
  if (!mainWindow) return
  
  // Đóng cửa sổ
  ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.close()
  })
  
  // Thu nhỏ cửa sổ
  ipcMain.on('minimize-window', () => {
    if (mainWindow) mainWindow.minimize()
  })
  
  // Phóng to hoặc khôi phục cửa sổ
  ipcMain.on('maximize-window', () => {
    if (!mainWindow) return
    
    if (isMaximized) {
      mainWindow.unmaximize()
      isMaximized = false
    } else {
      mainWindow.maximize()
      isMaximized = true
    }
    
    // Gửi trạng thái maximize về renderer
    mainWindow.webContents.send('maximize-change', isMaximized)
  })
  
  // Theo dõi sự thay đổi trạng thái maximize từ các tương tác khác
  mainWindow.on('maximize', () => {
    isMaximized = true
    if (mainWindow) {
      mainWindow.webContents.send('maximize-change', isMaximized)
    }
  })
  
  mainWindow.on('unmaximize', () => {
    isMaximized = false
    if (mainWindow) {
      mainWindow.webContents.send('maximize-change', isMaximized)
    }
  })
  
  // Xử lý thay đổi theme
  ipcMain.on('set-theme', (_, theme) => {
    if (mainWindow) {
      // Gửi theme mới cho tất cả các cửa sổ
      BrowserWindow.getAllWindows().forEach(window => {
        window.webContents.send('theme-changed', theme)
      })
    }
  })
  
  // Xử lý sự kiện đăng xuất
  ipcMain.on('logout', () => app.quit())
  
  // Ping-pong test
  ipcMain.on('ping', () => console.log('pong'))
  
  // Lưu cấu hình
  ipcMain.handle('save-config', async (_, config) => {
    try {
      const configPath = is.dev
        ? path.join(process.cwd(), '.env')
        : path.join(app.getPath('userData'), '.env')
      
      let content = '# SIP App Configuration\n# Auto-generated file\n\n'
      
      // Convert config object to .env format
      Object.entries(config).forEach(([key, value]) => {
        content += `${key}='${value}'\n`
      })
      
      fs.writeFileSync(configPath, content, 'utf8')
      return { success: true }
    } catch (error) {
      console.error('Error saving config:', error)
      return { success: false, error: String(error) }
    }
  })
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('vn.onestar.sip-app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Xử lý sự kiện trước khi thoát
app.on('before-quit', () => {
  // Thực hiện các thao tác dọn dẹp nếu cần
})

// Xử lý second-instance - đảm bảo chỉ có một phiên bản của ứng dụng chạy
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_, _commandLine, _workingDirectory) => {
    // Ai đó đã cố gắng chạy một phiên bản thứ hai, ta sẽ focus vào cửa sổ hiện tại
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}