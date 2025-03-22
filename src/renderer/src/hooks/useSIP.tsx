import { useState, useEffect, useCallback, useRef } from 'react'
import * as JsSIP from 'jssip'
import { toast } from 'react-toastify'
import { toastOptions } from '@/lib/toast'
import { SIPConfig } from '@/types/auth.types'
import { handleRTCSession } from './useSIPSession'
import { 
  createAudioElement, 
  setupEarlyMedia, 
  addStreamToAudio,
  toggleMicrophone,
  toggleAudio,
  createRingtone 
} from './useSIPAudio'
import {
  RINGTONE_PATH,
  DEFAULT_CALL_OPTIONS,
  DEFAULT_RTC_CONFIG,
  CALL_STATES,
  DEBUG_SIP,
  NO_ANSWER_TIMEOUT,
  MAX_RECONNECT_ATTEMPTS
} from '@/lib/sipConstants'

interface UseSIPOptions {
  onCallTerminated?: (cause: string, statusCode: number, reason: string) => void
  onCallConnected?: () => void
  onIncomingCall?: (callerId: string) => void
}

export const useSIP = (options: UseSIPOptions = {}) => {
  // State for UA and session
  const [ua, setUA] = useState<JsSIP.UA | null>(null)
  const [session, setSession] = useState<any>(null)
  
  // Khởi tạo remoteAudio ngay khi hook được sử dụng
  const [remoteAudio, setRemoteAudio] = useState<HTMLAudioElement | null>(() => createAudioElement())
  
  // Call state
  const [callState, setCallState] = useState<string>(CALL_STATES.IDLE)
  const [callDuration, setCallDuration] = useState<string>('')
  const [statusCode, setStatusCode] = useState<number | null>(null)
  const [incomingCallerId, setIncomingCallerId] = useState<string>('')
  
  // Refs for timers and audio
  const intervalIdRef = useRef<any>(null)
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)
  const sessionRef = useRef<any>(null)
  const lastSipMessageRef = useRef<string>('')
  const hasEarlyMediaRef = useRef<boolean>(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  
  // Add tracking for SIP connection attempts
  const uaInitCountRef = useRef<number>(0)
  const lastUaInitTimeRef = useRef<number>(0)
  
  // Format call duration
  const countTime = useCallback((startTime: Date) => {
    const now = new Date()
    const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)
    const minutes = Math.floor(elapsedSeconds / 60)
    const seconds = elapsedSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [])
  
  // Reset call state
  const resetCall = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current)
      intervalIdRef.current = null
    }
    setCallDuration('')
    hasEarlyMediaRef.current = false
  }, [])
  
  // Detect potential SIP connection loops
  const detectSIPLoop = useCallback(() => {
    // Increment the counter and record the time
    uaInitCountRef.current++;
    const now = Date.now();
    const timeSinceLastInit = now - lastUaInitTimeRef.current;
    lastUaInitTimeRef.current = now;
    
    // Check for rapid initialization (more than MAX_RECONNECT_ATTEMPTS in 10 seconds)
    if (uaInitCountRef.current > MAX_RECONNECT_ATTEMPTS && timeSinceLastInit < 10000) {
      console.error('Potential SIP connection loop detected!', 
        { count: uaInitCountRef.current, timeSinceLastInit });
      return true;
    }
    
    return false;
  }, []);
  
  // Initialize SIP User Agent
  const initSIP = useCallback((config: SIPConfig) => {
    console.log('Initializing SIP with config:', config);
    
    // Check for potential loops
    if (detectSIPLoop()) {
      console.error('SIP connection loop detected - forcing cooldown period');
      toast.error('Phát hiện lỗi kết nối SIP liên tục, đang thử lại sau', toastOptions);
      return null;
    }
    
    // Verify if we already have a functional UA
    if (ua && ua.isRegistered && ua.isRegistered()) {
      console.log('SIP UA already initialized and registered, skipping initialization');
      return ua;
    }
    
    // If we have a UA but it's not registered or working correctly, stop it
    if (ua) {
      console.log('Stopping existing UA before creating a new one');
      try {
        ua.stop();
      } catch (error) {
        console.error('Error stopping existing UA:', error);
      }
    }
    
    if (!config.wsHost || !config.extension || !config.sipServer || !config.password) {
      console.error('Missing required SIP configuration parameters');
      return null;
    }
    
    // Ensure we have the remote audio element
    if (!remoteAudio) {
      const newRemoteAudio = createAudioElement();
      if (newRemoteAudio) {
        setRemoteAudio(newRemoteAudio);
        console.log('Created new remote audio element');
      } else {
        console.error('Failed to create remote audio element, audio might not work properly');
      }
    }
    
    // Create ringtone if not exists
    if (!ringtoneRef.current) {
      ringtoneRef.current = createRingtone(RINGTONE_PATH);
    }
    
    try {
      // Setup WebSocket and UA configuration
      const socket = new JsSIP.WebSocketInterface(config.wsHost);
      
      const uaConfig = {
        sockets: [socket],
        uri: `sip:${config.extension}@${config.sipServer}`,
        password: config.password,
        display_name: config.displayName,
        hack_ip_in_contact: true,
        no_answer_timeout: NO_ANSWER_TIMEOUT,
        // Thêm các cài đặt SIP để phù hợp với log
        register_expires: 600,
        session_timers: true,
        use_preloaded_route: false
      };
      
      console.log('Creating UA with config:', uaConfig);
      
      // Create and start UA
      const userAgent = new JsSIP.UA(uaConfig);
      
      // Set up debug event listeners if DEBUG_SIP is true
      if (DEBUG_SIP) {
        userAgent.on('newMessage', (data: any) => {
          const direction = data.originator === 'local' ? 'SENT' : 'RECEIVED';
          const message = data.message.data || data.message.toString();
          console.log(`[SIP ${direction}]:\n${message}`);
          
          // Store the last received SIP message for later analysis
          if (direction === 'RECEIVED') {
            lastSipMessageRef.current = message;
          }
        });
      }
      
      // Create the combined handler function using the imported RTC session handler
      const newRTCSessionHandler = (ev: any) => {
        // Check if this is a duplicate session event
        if (sessionRef.current && sessionRef.current.id === ev.session.id) {
          console.log('Ignoring duplicate session event');
          return;
        }
        
        handleRTCSession(
          ev,
          {
            setSession,
            setCallState,
            setCallDuration,
            setStatusCode,
            setIncomingCallerId,
            setRemoteAudio
          },
          {
            sessionRef,
            intervalIdRef,
            ringtoneRef,
            lastSipMessageRef,
            hasEarlyMediaRef,
            audioContextRef
          },
          {
            addStream: addStreamToAudio,
            handleEarlyMedia: setupEarlyMedia,
            countTime,
            resetCall,
            createNewAudio: createAudioElement
          },
          {
            ...options,
            useAudioContext: true
          }
        );
      };
      
      // Add event listeners
      userAgent.on('newRTCSession', newRTCSessionHandler);
      userAgent.on('connected', () => console.log('UA connected to WebSocket'));
      userAgent.on('disconnected', () => console.log('UA disconnected from WebSocket'));
      userAgent.on('registered', () => console.log('UA registered with SIP server'));
      userAgent.on('unregistered', () => console.log('UA unregistered from SIP server'));
      userAgent.on('registrationFailed', (data) => {
        console.error('UA registration failed:', data);
      });
      
      // Start UA
      userAgent.start();
      console.log('UA started');
      
      // Register with SIP server
      userAgent.register();
      console.log('Registration requested');
      
      setUA(userAgent);
      return userAgent;
    } catch (error) {
      console.error('Error initializing SIP UA:', error);
      return null;
    }
  }, [ua, remoteAudio, countTime, resetCall, options, detectSIPLoop]);
  
  // Make a call
  const makeCall = useCallback((destination: string) => {
    console.log(`Making call to ${destination}`);
    
    if (!ua) {
      console.error('SIP User Agent not initialized');
      return;
    }
    
    if (!ua.isRegistered()) {
      console.error('SIP User Agent not registered');
      toast.error('Chưa kết nối SIP server', toastOptions);
      return;
    }
    
    // Kiểm tra xem phần tử âm thanh đã sẵn sàng chưa
    if (!remoteAudio) {
      const newAudio = createAudioElement();
      if (newAudio) {
        setRemoteAudio(newAudio);
        console.log('Created new remote audio element before making call');
      } else {
        console.warn('Could not create audio element, proceeding with call but audio may not work');
      }
    }
    
    try {
      // Reset early media flag before making call
      hasEarlyMediaRef.current = false;
      
      ua.call(destination, DEFAULT_CALL_OPTIONS);
      console.log('Call initiated with early media support:', DEFAULT_CALL_OPTIONS);
    } catch (error) {
      console.error('Error making call:', error);
      toast.error('Không thể thực hiện cuộc gọi', toastOptions);
    }
  }, [ua, remoteAudio]);
  
  // End call
  const endCall = useCallback(() => {
    console.log('Ending call');
    
    if (session) {
      session.terminate();
      console.log('Session terminated');
    } else {
      console.warn('No active session to terminate');
    }
  }, [session]);
  
  // Accept incoming call
  const acceptCall = useCallback(() => {
    console.log('Accepting incoming call');
    
    if (session && session.direction === 'incoming') {
      const options = {
        mediaConstraints: { audio: true, video: false },
        pcConfig: DEFAULT_RTC_CONFIG
      };
      
      try {
        session.answer(options);
        console.log('Call answered with options:', options);
      } catch (error) {
        console.error('Error accepting call:', error);
        toast.error('Không thể chấp nhận cuộc gọi', toastOptions);
      }
    } else {
      console.warn('No incoming session to accept');
    }
  }, [session]);
  
  // Hold/unhold
  const holdCall = useCallback(() => {
    console.log('Holding call');
    
    if (session) {
      session.hold();
    } else {
      console.warn('No session to hold');
    }
  }, [session]);
  
  const unholdCall = useCallback(() => {
    console.log('Unholding call');
    
    if (session) {
      session.unhold();
    } else {
      console.warn('No session to unhold');
    }
  }, [session]);
  
  // Microphone control using the audio utilities
  const disableMicrophone = useCallback(() => {
    return toggleMicrophone(session, false);
  }, [session]);
  
  const enableMicrophone = useCallback(() => {
    return toggleMicrophone(session, true);
  }, [session]);
  
  // Speaker control using the audio utilities
  const muteAudio = useCallback(() => {
    return toggleAudio(session, remoteAudio, false);
  }, [session, remoteAudio]);
  
  const unmuteAudio = useCallback(() => {
    return toggleAudio(session, remoteAudio, true);
  }, [session, remoteAudio]);
  
  // Check for microphone permissions
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        console.log('Microphone permissions granted');
        // Stop all tracks after checking permission
        stream.getTracks().forEach(track => track.stop());
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
        toast.error('Không thể truy cập microphone, vui lòng kiểm tra quyền truy cập', toastOptions);
      });
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up SIP resources');
      
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      
      if (ua) {
        ua.stop();
      }
      
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
      
      if (remoteAudio) {
        remoteAudio.pause();
        remoteAudio.srcObject = null;
      }
      
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (error) {
          console.error('Error closing AudioContext:', error);
        }
        audioContextRef.current = null;
      }
      
      if (sessionRef.current) {
        try {
          sessionRef.current.terminate();
        } catch (error) {
          console.error('Error terminating session during cleanup:', error);
        }
        sessionRef.current = null;
      }
    };
  }, [ua]);
  
  return {
    initSIP,
    makeCall,
    endCall,
    acceptCall,
    holdCall,
    unholdCall,
    disableMicrophone,
    enableMicrophone,
    muteAudio,
    unmuteAudio,
    callState,
    callDuration,
    statusCode,
    incomingCallerId,
    session,
    ua
  };
};