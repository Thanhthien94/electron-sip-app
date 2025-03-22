import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { toast } from 'react-toastify'
import { toastOptions } from '@/lib/toast'
import { useSIP } from '@/hooks/useSIP'
import { useAuth } from './AuthContext'
import { CDRInfo } from '@/types/cdr.types'
import { getSIPCodeInfo, getSIPCodeMessage } from '@/lib/sipCodes'

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
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { sipConfig } = useAuth()
  const [cdrInfo, setCdrInfo] = useState<CDRInfo | null>(null)
  const [isHold, setIsHold] = useState<boolean>(false)
  const [isDisableMic, setIsDisableMic] = useState<boolean>(false)
  const [isMuteAudio, setIsMuteAudio] = useState<boolean>(false)
  const [callEndInfo, setCallEndInfo] = useState<{
    code: number | null
    reason: string
    successful: boolean
  }>({
    code: null,
    reason: '',
    successful: false
  })

  // Use the SIP hook with enhanced callbacks
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
    unmuteAudio
  } = useSIP({
    onCallTerminated: (cause, code, reason) => {
      console.log(`Call terminated with cause: ${cause}, code: ${code}, reason: ${reason}`)
      
      // Cập nhật thông tin kết thúc cuộc gọi
      setCallEndInfo({
        code,
        reason: reason || mapCodeToReason(code),
        successful: code >= 200 && code < 300
      })
      
      // Không hiển thị toast ở đây nữa vì đã được xử lý trong useSIP
    },
    onCallConnected: () => {
      console.log('Call connected callback in CallContext')
    },
    onIncomingCall: (callerId) => {
      console.log(`Incoming call from ${callerId}`)
    }
  })

  // Ánh xạ SIP code sang lý do dễ hiểu khi không có reason từ useSIP
  const mapCodeToReason = (code: number): string => {
    const sipInfo = getSIPCodeInfo(code)
    if (sipInfo) {
      return sipInfo.vietnameseName
    }
    
    const codeMap: Record<number, string> = {
      200: 'Kết thúc bình thường',
      400: 'Yêu cầu không hợp lệ',
      401: 'Cần xác thực',
      403: 'Truy cập bị từ chối',
      404: 'Không tìm thấy người dùng',
      408: 'Hết thời gian chờ',
      480: 'Tạm thời không liên lạc được',
      481: 'Cuộc gọi không tồn tại',
      486: 'Máy bận',
      487: 'Yêu cầu đã bị hủy',
      488: 'Không chấp nhận',
      500: 'Lỗi máy chủ nội bộ',
      503: 'Dịch vụ không khả dụng',
      600: 'Bận toàn bộ',
      603: 'Từ chối',
      604: 'Không tồn tại ở mọi nơi'
    }
    
    return codeMap[code] || `Lỗi không xác định (Code: ${code})`
  }

  // Initialize SIP with config
  const initSIP = useCallback(() => {
    if (!sipConfig) {
      console.error('SIP configuration missing')
      toast.error('Không thể khởi tạo SIP: Thiếu cấu hình', toastOptions)
      return
    }
    
    console.log('Initializing SIP with config from CallContext')
    initSIPHook(sipConfig)
  }, [sipConfig, initSIPHook])

  // Handle call state changes
  useEffect(() => {
    if (callState === 'hangup') {
      // Reset states when call ends
      setIsHold(false)
      setIsDisableMic(false)
      setIsMuteAudio(false)
      
      console.log('Call ended with status code:', statusCode)
      console.log('Call end info:', callEndInfo)
    }
  }, [callState, statusCode, callEndInfo])

  // Determine if call is active
  const isCallActive = callState === 'ringing' || callState === 'answered'

  // Handle hold state changes
  useEffect(() => {
    if (isHold) {
      holdCall()
    } else {
      unholdCall()
    }
  }, [isHold, holdCall, unholdCall])

  // Handle mic mute state changes
  useEffect(() => {
    if (isDisableMic) {
      disableMicrophone()
    } else {
      enableMicrophone()
    }
  }, [isDisableMic, disableMicrophone, enableMicrophone])

  // Handle audio mute state changes
  useEffect(() => {
    if (isMuteAudio) {
      muteAudio()
    } else {
      unmuteAudio()
    }
  }, [isMuteAudio, muteAudio, unmuteAudio])

  // Wrapper for makeCall with additional logging and validation
  const makeCall = useCallback((destination: string, name: string = '') => {
    if (!destination) {
      toast.warning('Vui lòng nhập số điện thoại', toastOptions)
      return
    }
    
    // Clean the phone number - remove any non-digit characters except +
    const cleanDestination = destination.replace(/[^\d+]/g, '')
    
    if (cleanDestination.length < 3) {
      toast.warning('Số điện thoại không hợp lệ', toastOptions)
      return
    }
    
    console.log(`Making call to ${cleanDestination}`, name ? `(${name})` : '')
    sipMakeCall(cleanDestination)
  }, [sipMakeCall])

  // Toggle methods with additional logging
  const handleHold = useCallback(() => {
    console.log(`${isHold ? 'Unholding' : 'Holding'} call`)
    setIsHold(prev => !prev)
    return !isHold
  }, [isHold])

  const handleDisableMic = useCallback(() => {
    console.log(`${isDisableMic ? 'Enabling' : 'Disabling'} microphone`)
    setIsDisableMic(prev => !prev)
    return !isDisableMic
  }, [isDisableMic])

  const handleMuteAudio = useCallback(() => {
    console.log(`${isMuteAudio ? 'Unmuting' : 'Muting'} audio`)
    setIsMuteAudio(prev => !prev)
    return !isMuteAudio
  }, [isMuteAudio])

  // Log important state changes for debugging
  useEffect(() => {
    console.log(`Call state changed to: ${callState}`)
    
    if (callState === 'answered') {
      console.log('Call is now active - audio should be flowing')
    }
  }, [callState])

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
        initSIP
      }}
    >
      {children}
    </CallContext.Provider>
  )
}

export const useCall = () => {
  const context = useContext(CallContext)
  if (!context) {
    throw new Error('useCall must be used within a CallProvider')
  }
  return context
}