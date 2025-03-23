// Cấu hình cho phía renderer
// Lưu ý: Không thể truy cập trực tiếp API Node.js như fs, path từ renderer

// Xác định môi trường hiện tại
export const isDevelopment = import.meta.env.DEV;

// Cấu hình API URLs
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3012/api';
export const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3014/auth';
export const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:3015/worker';

// Cấu hình SIP
export const SIP_WS_URL = import.meta.env.VITE_SIP_WS_URL || 'ws://103.27.238.195:8088/ws';
export const SIP_SERVER_HOST = import.meta.env.VITE_SIP_SERVER_HOST || '103.27.238.195';
export const SIP_NO_ANSWER_TIMEOUT = Number(import.meta.env.VITE_SIP_NO_ANSWER_TIMEOUT || 45);

// Cấu hình chung
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'SIP App';
export const ENV = import.meta.env.MODE;

// Log cấu hình khi khởi động ứng dụng (chỉ trong development)
if (isDevelopment) {
  console.log('Current environment config:', {
    API_URL,
    AUTH_URL,
    WORKER_URL,
    SIP_WS_URL,
    SIP_SERVER_HOST,
    isDevelopment,
    ENV
  });
}

// Tiện ích cho renderer
export const rendererUtil = {
  isDevelopment,
  isProduction: !isDevelopment,
  
  // Lấy tham số URL
  getQueryParam: (name: string): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },
  
  // Kiểm tra xem có đang chạy trong Electron không
  isElectron: (): boolean => {
    return window.navigator.userAgent.toLowerCase().indexOf('electron') > -1;
  }
};

// Export cấu hình mặc định
export default {
  API_URL,
  AUTH_URL,
  WORKER_URL,
  SIP_WS_URL,
  SIP_SERVER_HOST,
  SIP_NO_ANSWER_TIMEOUT,
  APP_VERSION,
  APP_NAME,
  ENV,
  isDevelopment
};