// src/shared/config.ts
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

// Xác định môi trường hiện tại
export const isDevelopment = process.env.NODE_ENV === 'development';

// Hàm đọc biến môi trường từ file .env
function loadEnvFile(envFilePath: string): Record<string, string> {
  try {
    if (fs.existsSync(envFilePath)) {
      const envContent = fs.readFileSync(envFilePath, 'utf8');
      const envVars: Record<string, string> = {};
      
      envContent.split('\n').forEach(line => {
        // Bỏ qua comment và dòng trống
        if (line.trim() && !line.startsWith('#')) {
          const match = line.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            
            // Xóa dấu nháy nếu có
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.substring(1, value.length - 1);
            }
            
            envVars[key] = value;
          }
        }
      });
      
      return envVars;
    }
  } catch (error) {
    console.error(`Error loading env file ${envFilePath}:`, error);
  }
  
  return {};
}

// Xác định đường dẫn đến file .env
function getEnvFilePath(): string {
  const rootPath = isDevelopment
    ? process.cwd() // Thư mục gốc dự án trong môi trường dev
    : path.dirname(app.getPath('exe')); // Thư mục cài đặt trong production
    
  return path.join(rootPath, '.env');
}

// Load biến môi trường từ file .env
const envVars = loadEnvFile(getEnvFilePath());

// Biến môi trường mặc định
const defaultEnv = {
  // Development
  DEV_API_URL: 'http://localhost:3012/api',
  DEV_AUTH_URL: 'http://localhost:3014/auth',
  DEV_WORKER_URL: 'http://localhost:3015/worker',
  DEV_SIP_WS_URL: 'ws://103.27.238.195:8088/ws',
  
  // Production
  PROD_API_URL: 'https://onestar.finstar.vn/api',
  PROD_AUTH_URL: 'https://onestar.finstar.vn/auth',
  PROD_WORKER_URL: 'https://onestar.finstar.vn/worker',
  PROD_SIP_WS_URL: 'wss://sip.socket.onestar.vn/ws'
};

// Kết hợp biến môi trường từ file và mặc định
const combinedEnv = { ...defaultEnv, ...envVars };

// Export các biến cấu hình dựa trên môi trường
export const config = {
  API_URL: isDevelopment ? combinedEnv.DEV_API_URL : combinedEnv.PROD_API_URL,
  AUTH_URL: isDevelopment ? combinedEnv.DEV_AUTH_URL : combinedEnv.PROD_AUTH_URL,
  WORKER_URL: isDevelopment ? combinedEnv.DEV_WORKER_URL : combinedEnv.PROD_WORKER_URL,
  SIP_WS_URL: isDevelopment ? combinedEnv.DEV_SIP_WS_URL : combinedEnv.PROD_SIP_WS_URL,
  
  // Thêm trường APP_VERSION để theo dõi phiên bản
  APP_VERSION: app.getVersion(),
  
  // Thêm trường APP_NAME từ package.json
  APP_NAME: app.getName(),
  
  // Thêm trường để xác định môi trường
  ENV: isDevelopment ? 'development' : 'production',
};

// Export các phương thức hữu ích
export const envUtil = {
  isDevelopment,
  isProduction: !isDevelopment,
  
  // Phương thức cho phép ghi đè cấu hình trong runtime
  overrideConfig: (key: string, value: string): void => {
    (config as any)[key] = value;
  },
  
  // Lưu cấu hình vào file .env
  saveConfig: async (): Promise<boolean> => {
    try {
      const envFilePath = getEnvFilePath();
      let content = '';
      
      // Chuyển đổi từ config hiện tại sang định dạng .env
      Object.entries(config).forEach(([key, value]) => {
        content += `${key}='${value}'\n`;
      });
      
      fs.writeFileSync(envFilePath, content, 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }
};