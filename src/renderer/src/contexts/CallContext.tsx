import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { toast } from 'react-toastify'
import { toastOptions } from '@/lib/toast'
import { useSIP } from '@/hooks/useSIP'
import { useAuth } from './AuthContext'
import { CDRInfo } from '@/types/cdr.types'
import { 
  CALL_STATES, 
  SIP_CODE_MESSAGES,
  MAX_RECONNECT_ATTEMPTS 
} from '@/lib/sipConstants'

// Cấu hình thử lại kết nối thông minh
const CALL_RETRY_DELAYS = [1500, 3000, 5000]; // ms

// Biến toàn cục để theo dõi loop
if (typeof window !== 'undefined') {
  window._sipLoopCount = window._sipLoopCount || 0;
  window._lastInitTime = window._lastInitTime || 0;
}

interface CallContextType {
  callState: string
  callDuration: string
  incomingCallerId: string
  statusCode: number | null
  cdrInfo: CDRInfo | null
  isCallActive: boolean
  isHold: boolean
  isDisableMic: boolean
  isMuteAudio: boolean
  callEndInfo: {
    code: number | null
    reason: string
    successful: boolean
  }
  makeCall: (destination: string, name?: string) => void
  endCall: () => void
  acceptCall: () => void
  handleHold: () => boolean
  handleDisableMic: () => boolean
  handleMuteAudio: () => boolean
  setCdrInfo: React.Dispatch<React.SetStateAction<CDRInfo | null>>
  initSIP: () => void
  isRetrying: boolean
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, sipConfig, fetchSIPConfig, isAuthenticated } = useAuth()
  const [cdrInfo, setCdrInfo] = useState<CDRInfo | null>(null)
  const [isHold, setIsHold] = useState<boolean>(false)
  const [isDisableMic, setIsDisableMic] = useState<boolean>(false)
  const [isMuteAudio, setIsMuteAudio] = useState<boolean>(false)
  const [isRetrying, setIsRetrying] = useState<boolean>(false)
  const [callEndInfo, setCallEndInfo] = useState<{
    code: number | null
    reason: string
    successful: boolean
  }>({
    code: null,
    reason: '',
    successful: false
  })
  
  // Refs để theo dõi trạng thái
  const isSipInitialized = useRef<boolean>(false)
  const initSipTimeout = useRef<any>(null)
  const isInitSipRunning = useRef<boolean>(false) // Theo dõi nếu initSip đang chạy
  const callRetryCount = useRef<number>(0)
  const callRetryTimeout = useRef<any>(null)

  // Callback cho sự kiện SIP
  const handleCallTerminated = useCallback((cause: string, code: number, reason: string) => {
    console.log(`Call terminated with cause: ${cause}, code: ${code}, reason: ${reason}`)
    
    // Xử lý trường hợp người dùng chủ động kết thúc cuộc gọi
    let actualCode = code
    let actualReason = reason
    
    if (cause === 'Terminated' && code === 500) {
      actualCode = 200
      actualReason = 'Kết thúc bình thường'
    }
    
    // Cập nhật thông tin kết thúc cuộc gọi
    setCallEndInfo({
      code: actualCode,
      reason: actualReason || SIP_CODE_MESSAGES[actualCode] || 'Kết thúc cuộc gọi',
      successful: actualCode >= 200 && actualCode < 300
    })
  }, [])

  // Khởi tạo useSIP hook với các callbacks
  const {
    initSIP: initSIPHook,
    makeCall: sipMakeCall,
    endCall: sipEndCall,
    acceptCall: sipAcceptCall,
    callState,
    callDuration,
    incomingCallerId,
    statusCode,
    holdCall,
    unholdCall,
    disableMicrophone,
    enableMicrophone,
    muteAudio,
    unmuteAudio,
    ua
  } = useSIP({
    onCallTerminated: handleCallTerminated,
    onCallConnected: () => {
      console.log('Call connected callback in CallContext')
      
      // Reset call retry state
      callRetryCount.current = 0;
      if (callRetryTimeout.current) {
        clearTimeout(callRetryTimeout.current);
        callRetryTimeout.current = null;
      }
    },
    onIncomingCall: (callerId) => {
      console.log(`Incoming call from ${callerId}`)
    }
  })

  // Reset call states khi cuộc gọi kết thúc
  useEffect(() => {
    if (callState === CALL_STATES.HANGUP) {
      setIsHold(false)
      setIsDisableMic(false)
      setIsMuteAudio(false)
      
      // Hiển thị thông báo khi cuộc gọi kết thúc dựa vào callEndInfo
      if (callEndInfo.code !== null) {
        // Tránh hiển thị thông báo khi chưa có cuộc gọi nào
        if (callEndInfo.code !== 0) {
          const message = callEndInfo.reason || 'Cuộc gọi kết thúc';
          
          if (callEndInfo.successful) {
            toast.success(`${message} (${callEndInfo.code})`, toastOptions);
          } else {
            toast.error(`${message} (${callEndInfo.code})`, toastOptions);
          }
        }
      }
    }
  }, [callState, statusCode, callEndInfo])

  // Xác định xem cuộc gọi có đang hoạt động không
  const isCallActive = callState === CALL_STATES.RINGING || callState === CALL_STATES.ANSWERED

  // Xử lý trạng thái giữ máy
  useEffect(() => {
    if (isHold) {
      holdCall()
    } else {
      unholdCall()
    }
  }, [isHold, holdCall, unholdCall])

  // Xử lý trạng thái tắt micro
  useEffect(() => {
    if (isDisableMic) {
      disableMicrophone()
    } else {
      enableMicrophone()
    }
  }, [isDisableMic, disableMicrophone, enableMicrophone])

  // Xử lý trạng thái tắt âm thanh
  useEffect(() => {
    if (isMuteAudio) {
      muteAudio()
    } else {
      unmuteAudio()
    }
  }, [isMuteAudio, muteAudio, unmuteAudio])

  // Hàm khởi tạo SIP với kiểm tra nghiêm ngặt
  const initSIP = useCallback(async () => {
    // Kiểm tra nếu hàm đang chạy để tránh gọi chồng chéo
    if (isInitSipRunning.current) {
      console.log('initSIP đang chạy, bỏ qua lệnh gọi mới');
      return;
    }
    
    // Đánh dấu hàm đang chạy
    isInitSipRunning.current = true;
    
    // Sử dụng biến toàn cục để theo dõi loop
    const now = Date.now();
    if (window._lastInitTime && now - window._lastInitTime < 2000) {
      console.log('Throttling SIP init calls - called too frequently');
      isInitSipRunning.current = false;
      return;
    }
    window._lastInitTime = now;
    
    // Sử dụng bộ đếm toàn cục để ngăn loop vô hạn
    window._sipLoopCount = (window._sipLoopCount || 0) + 1;
    if (window._sipLoopCount > MAX_RECONNECT_ATTEMPTS) {
      console.error('Phát hiện loop, dừng việc khởi tạo SIP');
      toast.error('Khởi tạo SIP không thành công sau nhiều lần thử', toastOptions);
      
      // Reset sau 10 giây
      setTimeout(() => {
        window._sipLoopCount = 0;
      }, 10000);
      
      isInitSipRunning.current = false;
      return;
    }
    
    // Hủy bỏ timeout cũ nếu có
    if (initSipTimeout.current) {
      clearTimeout(initSipTimeout.current)
      initSipTimeout.current = null
    }
    
    try {
      // Kiểm tra người dùng đã đăng nhập
      if (!user || !user.token) {
        console.error('Người dùng chưa đăng nhập');
        toast.error('Vui lòng đăng nhập để sử dụng tính năng gọi điện', toastOptions);
        isInitSipRunning.current = false;
        return;
      }
      
      // Kiểm tra SIPID có tồn tại không
      const sipId = localStorage.getItem('SIPID');
      if (!sipId) {
        console.error('Không tìm thấy SIPID');
        toast.error('Không tìm thấy thông tin SIP, vui lòng đăng nhập lại', toastOptions);
        isInitSipRunning.current = false;
        return;
      }
      
      // Kiểm tra SIP UA đã được khởi tạo và registered
      if (isSipInitialized.current && ua && ua.isRegistered && ua.isRegistered()) {
        console.log('SIP đã được khởi tạo và đăng ký, bỏ qua việc khởi tạo lại');
        window._sipLoopCount = 0; // Reset counter khi thành công
        isInitSipRunning.current = false;
        return;
      }
      
      // Kiểm tra có cấu hình SIP không
      if (!sipConfig) {
        console.error('Chưa lấy được thông tin cấu hình SIP');
        
        // Tự động gọi API lấy cấu hình SIP
        const success = await fetchSIPConfig();
        
        if (success) {
          // Thử lại sau 1 giây
          console.log('Đã lấy cấu hình SIP thành công, sẽ thử khởi tạo SIP sau 1 giây');
          initSipTimeout.current = setTimeout(() => {
            window._sipLoopCount = 0; // Reset counter sau khi lấy cấu hình thành công
            initSIP();
          }, 1000);
        } else {
          toast.error('Không thể khởi tạo SIP: Thiếu cấu hình', toastOptions);
        }
        isInitSipRunning.current = false;
        return;
      }
      
      // Kiểm tra tính đầy đủ của cấu hình SIP
      if (!sipConfig.extension || !sipConfig.password || !sipConfig.sipServer || !sipConfig.wsHost) {
        console.error('Thiếu thông tin cấu hình SIP', sipConfig);
        toast.error('Cấu hình SIP không đầy đủ, vui lòng đăng nhập lại', toastOptions);
        isInitSipRunning.current = false;
        return;
      }
      
      // Khởi tạo SIP với cấu hình đầy đủ
      console.log('Đang khởi tạo SIP với cấu hình:', sipConfig);
      const uaInstance = initSIPHook(sipConfig);
      
      if (uaInstance) {
        isSipInitialized.current = true;
        window._sipLoopCount = 0; // Reset counter khi khởi tạo thành công
        console.log('SIP đã được khởi tạo thành công');
      } else {
        console.error('Khởi tạo SIP thất bại');
        toast.error('Không thể kết nối đến máy chủ SIP', toastOptions);
      }
    } catch (error) {
      console.error('Lỗi trong quá trình khởi tạo SIP:', error);
      toast.error('Đã xảy ra lỗi khi khởi tạo SIP', toastOptions);
    } finally {
      isInitSipRunning.current = false;
    }
  }, [sipConfig, user, initSIPHook, ua, fetchSIPConfig]);

  // Theo dõi sipConfig và tự động khởi tạo SIP khi có cấu hình mới
  useEffect(() => {
    if (sipConfig && Object.keys(sipConfig).length > 0 && !isSipInitialized.current) {
      console.log('Nhận được cấu hình SIP mới, sẽ khởi tạo SIP sau một khoảng thời gian ngắn');
      
      // Khởi tạo với timeout để tránh gọi quá nhanh
      setTimeout(() => {
        initSIP();
      }, 500);
    }
  }, [sipConfig, initSIP]);

  // Khi người dùng xác thực thay đổi, đảm bảo trạng thái đúng
  useEffect(() => {
    if (!isAuthenticated) {
      isSipInitialized.current = false;
      window._sipLoopCount = 0;
    }
  }, [isAuthenticated]);

  // Hàm lên lịch thử lại cuộc gọi
  const scheduleCallRetry = (destination: string, name?: string) => {
    // Hủy timeout hiện tại nếu có
    if (callRetryTimeout.current) {
      clearTimeout(callRetryTimeout.current);
    }
    
    // Nếu đã vượt quá số lần thử lại
    if (callRetryCount.current >= CALL_RETRY_DELAYS.length) {
      console.log('Đã vượt quá số lần thử gọi tối đa');
      toast.error('Không thể kết nối cuộc gọi sau nhiều lần thử', toastOptions);
      callRetryCount.current = 0;
      setIsRetrying(false);
      return;
    }
    
    const delay = CALL_RETRY_DELAYS[callRetryCount.current];
    console.log(`Thử lại cuộc gọi sau ${delay/1000}s (lần ${callRetryCount.current + 1})`);
    
    // Hiển thị trạng thái đang thử lại
    setIsRetrying(true);
    
    // Hiển thị thông báo thân thiện
    if (callRetryCount.current === 0) {
      toast.info('Đang cố gắng kết nối cuộc gọi...', toastOptions);
    } else {
      toast.info(`Thử kết nối lại lần ${callRetryCount.current + 1}...`, toastOptions);
    }
    
    // Lên lịch thử lại
    callRetryTimeout.current = setTimeout(() => {
      callRetryCount.current++;
      
      // Thử gọi lại với destination đã làm sạch
      if (ua && ua.isRegistered && ua.isRegistered()) {
        console.log(`Đang thử gọi lại lần ${callRetryCount.current}: ${destination}`);
        sipMakeCall(destination);
      } else {
        // Nếu SIP chưa sẵn sàng, thử khởi tạo lại
        console.log('SIP chưa sẵn sàng, thử khởi tạo lại trước khi gọi');
        initSIP().then(() => {
          // Đợi thêm thời gian để SIP kết nối
          setTimeout(() => {
            if (ua && ua.isRegistered && ua.isRegistered()) {
              sipMakeCall(destination);
            } else {
              // Nếu vẫn không kết nối được, lên lịch thử lại
              scheduleCallRetry(destination, name);
            }
          }, 1500);
        });
      }
    }, delay);
  };

  // Hàm thực hiện cuộc gọi với kiểm tra kỹ lưỡng và thử lại thông minh
  const makeCall = useCallback((destination: string, name: string = '') => {
    if (!destination) {
      toast.warning('Vui lòng nhập số điện thoại', toastOptions);
      return;
    }
    
    // Làm sạch số điện thoại - loại bỏ các ký tự không phải số trừ dấu +
    const cleanDestination = destination.replace(/[^\d+]/g, '');
    
    if (cleanDestination.length < 3) {
      toast.warning('Số điện thoại không hợp lệ', toastOptions);
      return;
    }
    
    // Reset trạng thái thử lại
    callRetryCount.current = 0;
    
    // Kiểm tra SIP đã được khởi tạo chưa
    if (!isSipInitialized.current || !ua) {
      console.log('SIP chưa được khởi tạo, đang khởi tạo lại');
      
      // Khởi tạo SIP và thử gọi sau
      initSIP().then(() => {
        // Chờ một chút cho kết nối hoàn thành
        setTimeout(() => {
          if (ua && ua.isRegistered && ua.isRegistered()) {
            sipMakeCall(cleanDestination);
          } else {
            console.log('SIP vẫn chưa sẵn sàng sau khi khởi tạo, lên lịch thử lại');
            scheduleCallRetry(cleanDestination, name);
          }
        }, 1500);
      });
      
      return;
    }
    
    // Kiểm tra UA đã registered chưa
    if (!ua.isRegistered || !ua.isRegistered()) {
      toast.warning('Đang kết nối đến máy chủ SIP, vui lòng thử lại sau', toastOptions);
      
      // Thử đăng ký lại và lên lịch thử lại
      try {
        ua.register();
        console.log('Đã gửi lệnh đăng ký lại, lên lịch thử lại cuộc gọi');
        scheduleCallRetry(cleanDestination, name);
      } catch (error) {
        console.error('Lỗi khi đăng ký SIP:', error);
        toast.error('Không thể kết nối đến máy chủ SIP', toastOptions);
      }
      
      return;
    }
    
    // Thực hiện cuộc gọi khi đã sẵn sàng
    console.log(`Making call to ${cleanDestination}`, name ? `(${name})` : '');
    sipMakeCall(cleanDestination);
  }, [sipMakeCall, initSIP, ua]);

  // Các hàm xử lý trạng thái
  const handleHold = useCallback(() => {
    console.log(`${isHold ? 'Unholding' : 'Holding'} call`);
    setIsHold(prev => !prev);
    return !isHold;
  }, [isHold]);

  const handleDisableMic = useCallback(() => {
    console.log(`${isDisableMic ? 'Enabling' : 'Disabling'} microphone`);
    setIsDisableMic(prev => !prev);
    return !isDisableMic;
  }, [isDisableMic]);

  const handleMuteAudio = useCallback(() => {
    console.log(`${isMuteAudio ? 'Unmuting' : 'Muting'} audio`);
    setIsMuteAudio(prev => !prev);
    return !isMuteAudio;
  }, [isMuteAudio]);

  // Dọn dẹp khi unmount
  useEffect(() => {
    return () => {
      // Hủy bỏ timeout nếu còn
      if (initSipTimeout.current) {
        clearTimeout(initSipTimeout.current);
        initSipTimeout.current = null;
      }
      
      if (callRetryTimeout.current) {
        clearTimeout(callRetryTimeout.current);
        callRetryTimeout.current = null;
      }
    };
  }, []);

  return (
    <CallContext.Provider
      value={{
        callState,
        callDuration,
        incomingCallerId,
        statusCode,
        cdrInfo,
        isCallActive,
        isHold,
        isDisableMic,
        isMuteAudio,
        callEndInfo,
        makeCall,
        endCall: sipEndCall,
        acceptCall: sipAcceptCall,
        handleHold,
        handleDisableMic,
        handleMuteAudio,
        setCdrInfo,
        initSIP,
        isRetrying
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};