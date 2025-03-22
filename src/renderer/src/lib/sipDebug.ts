/**
 * Debug utility for SIP connections - giúp phát hiện và sửa các loop kết nối
 */

// Bộ đếm để theo dõi số lần khởi tạo
let sipInitCount = 0;
let activeConnections = 0;
let lastInitTime = 0;

interface SIPDebugData {
  initCount: number;
  activeConnections: number;
  timeSinceLastInit: number;
  lastInitTime: number;
  connectionHistory: Array<{
    time: number;
    action: string;
    details?: string;
  }>;
}

// Theo dõi lịch sử kết nối
const connectionHistory: Array<{
  time: number;
  action: string;
  details?: string;
}> = [];

/**
 * Ghi lại sự kiện SIP với timestamp
 */
export const logSIPEvent = (action: string, details?: string): void => {
  const timestamp = Date.now();
  connectionHistory.push({
    time: timestamp,
    action,
    details
  });
  
  // Giữ kích thước lịch sử hợp lý
  if (connectionHistory.length > 100) {
    connectionHistory.shift();
  }
  
  console.log(`[SIP ${action}]`, details || '');
};

/**
 * Theo dõi khi có khởi tạo SIP mới
 */
export const trackSIPInit = (wsHost: string): void => {
  sipInitCount++;
  activeConnections++;
  lastInitTime = Date.now();
  
  logSIPEvent('INIT', `Kết nối đến ${wsHost}`);
};

/**
 * Theo dõi khi SIP kết thúc/đóng
 */
export const trackSIPClose = (): void => {
  activeConnections = Math.max(0, activeConnections - 1);
  logSIPEvent('CLOSE');
};

/**
 * Lấy dữ liệu debug SIP
 */
export const getSIPDebugData = (): SIPDebugData => {
  return {
    initCount: sipInitCount,
    activeConnections,
    timeSinceLastInit: Date.now() - lastInitTime,
    lastInitTime,
    connectionHistory: [...connectionHistory]
  };
};

/**
 * Reset bộ đếm debug - dùng cho testing
 */
export const resetSIPDebugData = (): void => {
  sipInitCount = 0;
  activeConnections = 0;
  lastInitTime = 0;
  connectionHistory.length = 0;
  logSIPEvent('RESET');
};

/**
 * Kiểm tra xem có vòng lặp kết nối SIP tiềm ẩn không
 * Trả về true nếu có vẻ đang có loop
 */
export const detectSIPLoop = (): boolean => {
  // Kiểm tra khởi tạo nhanh (nhiều hơn 3 lần trong 10 giây)
  if (sipInitCount > 3) {
    const last10Seconds = connectionHistory.filter(
      event => event.action === 'INIT' && Date.now() - event.time < 10000
    );
    
    if (last10Seconds.length >= 3) {
      logSIPEvent('LOOP_DETECTED', `${last10Seconds.length} lần khởi tạo trong 10 giây qua`);
      return true;
    }
  }
  
  return false;
};

/**
 * Hướng dẫn sử dụng
 * 
 * Thêm vào file useSIP.tsx:
 * 
 * import { trackSIPInit, trackSIPClose, detectSIPLoop } from '@/lib/sipDebug';
 * 
 * // Thêm vào hàm initSIP:
 * const initSIP = useCallback((config: SIPConfig) => {
 *   // Thêm debug tracking
 *   trackSIPInit(config.wsHost);
 *   
 *   // Kiểm tra loop
 *   if (detectSIPLoop()) {
 *     console.error('Phát hiện loop kết nối SIP tiềm ẩn!');
 *     // Xem xét thêm logic phục hồi ở đây
 *   }
 *   
 *   // Tiếp tục với khởi tạo bình thường...
 * }, [/* dependencies *\/]);
 * 
 * // Thêm vào useEffect cleanup:
 * useEffect(() => {
 *   return () => {
 *     // Cleanup code...
 *     trackSIPClose();
 *   };
 * }, []);
 */