import { useState, useEffect } from 'react'
import { useCall } from '@/contexts/CallContext'
import { formatTime, time, formatDate } from '@/lib/moment'
import { CDR_DISPOSITION_TYPES } from '@/types/cdr.types'
import { CALL_STATES } from '@/lib/sipConstants'
import { AudioPlayer } from './AudioPlayer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  PhoneOutgoing,
  PhoneCall,
  Phone,
  PhoneMissed,
  Mic,
  MicOff,
  Volume,
  VolumeX,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'

export const PhoneView = () => {
  const {
    makeCall,
    endCall,
    callState,
    callDuration,
    cdrInfo,
    isCallActive,
    isDisableMic,
    isMuteAudio,
    handleDisableMic,
    handleMuteAudio,
    callEndInfo,
    isRetrying
  } = useCall()
  
  const [destination, setDestination] = useState<string>('')
  const [showLastCallInfo, setShowLastCallInfo] = useState<boolean>(false)

  // Reset destination when call ends or starts ringing
  useEffect(() => {
    if (callState === CALL_STATES.HANGUP || callState === CALL_STATES.RINGING) {
      setDestination('')
    }
    
    // Hiển thị thông tin cuộc gọi vừa kết thúc
    if (callState === CALL_STATES.HANGUP && callEndInfo.code !== null) {
      setShowLastCallInfo(true)
      
      // Tự động ẩn thông tin sau 5 giây
      const timer = setTimeout(() => {
        setShowLastCallInfo(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [callState, callEndInfo])

  // Hiển thị badge theo trạng thái cuộc gọi kết thúc
  const renderCallEndBadge = () => {
    if (!showLastCallInfo || callEndInfo.code === null) return null
    
    if (callEndInfo.successful) {
      return (
        <Badge className="flex gap-1 items-center bg-green-500 text-white">
          <CheckCircle size={14} />
          <span>{callEndInfo.reason} (SIP {callEndInfo.code})</span>
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive" className="flex gap-1 items-center">
          <AlertCircle size={14} />
          <span>{callEndInfo.reason} (SIP {callEndInfo.code})</span>
        </Badge>
      )
    }
  }

  return (
    <div className="flex flex-col w-full h-full gap-3">
      {/* Phone input and controls */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Nhập số -- Enter để gọi"
          className="px-3 py-1 rounded-md border-[0.5px] border-dotted border-amber-400 bg-neutral-500/20"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && destination.trim()) {
              makeCall(destination)
            }
          }}
          disabled={isCallActive || isRetrying}
        />
        
        {/* Conditionally show call button based on state */}
        {(!isCallActive && !isRetrying && destination !== '') && (
          <Button 
            className="font-thin text-green-600 hover:text-green-400 p-1 px-3 rounded-full"
            onClick={() => makeCall(destination)}
          >
            <Phone />
          </Button>
        )}
        
        {/* Show retry indicator */}
        {isRetrying && (
          <div className="flex items-center gap-1 text-orange-400 text-sm">
            <RefreshCw size={16} className="animate-spin" />
            <span>Đang thử lại...</span>
          </div>
        )}
        
        {/* Show hangup button during active call */}
        {isCallActive && (
          <Button 
            className="border-[0.5px] border-dashed p-1 px-3 text-yellow-100 font-thin rounded-full hover:bg-orange-200 hover:text-black"
            onClick={endCall}
          >
            Gác máy
          </Button>
        )}
        
        {/* Call status indicators */}
        {callState === CALL_STATES.RINGING && (
          <span className="relative flex h-5 w-5 justify-center items-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 text-sky-600">
              <PhoneOutgoing />
            </span>
            <span className="relative inline-flex h-5 w-5 text-sky-400">
              <PhoneOutgoing />
            </span>
          </span>
        )}
        
        {callState === CALL_STATES.ANSWERED && (
          <span className="relative flex h-5 w-5 justify-center items-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 text-sky-600">
              <PhoneCall />
            </span>
            <span className="relative inline-flex h-5 w-5 text-sky-400">
              <PhoneCall />
            </span>
          </span>
        )}
        
        {/* Call status text */}
        <span className="text-sky-400">
          {callState === CALL_STATES.RINGING && 'Đang kết nối...'}
        </span>
        <span className="text-red-400">
          {callState === CALL_STATES.ANSWERED && callDuration}
        </span>
        
        {/* Microphone and speaker controls - only show during active call */}
        {callState === CALL_STATES.ANSWERED && (
          <div className="flex gap-2">
            <Button
              className={`p-1 rounded-full ${isDisableMic ? 'bg-red-500' : 'bg-transparent'}`}
              onClick={handleDisableMic}
              title={isDisableMic ? "Bật micrô" : "Tắt micrô"}
            >
              {isDisableMic ? <MicOff size={16} /> : <Mic size={16} />}
            </Button>
            
            <Button
              className={`p-1 rounded-full ${isMuteAudio ? 'bg-red-500' : 'bg-transparent'}`}
              onClick={handleMuteAudio}
              title={isMuteAudio ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {isMuteAudio ? <VolumeX size={16} /> : <Volume size={16} />}
            </Button>
          </div>
        )}
      </div>
      
      {/* Hiển thị thông tin kết thúc cuộc gọi gần nhất */}
      {renderCallEndBadge()}
      
      {/* CDR Information Display */}
      {cdrInfo && (
        <div className="flex flex-col gap-2 mt-5 p-4 rounded-lg bg-neutral-800/20">
          <div className="flex gap-2">
            <span>Người gọi</span>
            <span className="text-red-500 font-bold">{cdrInfo.from_name || 'Không xác định'}</span>
          </div>
          <span className="font-thin">Số nội bộ: {cdrInfo.from_num}</span>
          
          {cdrInfo.to_name && (
            <div className="flex gap-2">
              <span className="font-thin">Gọi đến</span>
              <span className="text-red-500 font-bold">{cdrInfo.to_name}</span>
            </div>
          )}
          
          <div className="flex gap-2">
            <span className={cdrInfo.to_name ? 'font-thin hidden' : 'font-thin'}>
              Gọi đến
            </span>
            <span className="font-thin">{cdrInfo.to_num}</span>
          </div>
          
          <div className="flex gap-2">
            <span className="font-thin">Thực hiện:</span>
            <span className="font-thin">{formatDate(cdrInfo.created_at)}</span>
          </div>
          
          <div className="flex gap-2">
            <span className="font-thin">Trạng thái</span>
            <span className="font-thin">
              {CDR_DISPOSITION_TYPES[cdrInfo.disposition as keyof typeof CDR_DISPOSITION_TYPES] || cdrInfo.disposition}
            </span>
          </div>
          
          <div className="flex gap-2">
            <span className="font-thin">Đàm thoại</span>
            <span className="font-thin">{time(Number(cdrInfo.duration))}</span>
          </div>
        </div>
      )}
      
      {/* Audio Player for recordings */}
      {cdrInfo?.record && (
        <AudioPlayer record={cdrInfo.record} duration={Number(cdrInfo.billSec)} />
      )}
    </div>
  )
}