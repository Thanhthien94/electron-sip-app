import { useState, useEffect, useCallback, useRef } from 'react'
import * as JsSIP from 'jssip'
import { toast } from 'react-toastify'
import { toastOptions } from '@/lib/toast'
import { SIPConfig } from '@/types/auth.types'
import { handleRTCSession } from './useSIPSession'

// Constants
const RINGTONE_PATH = '/audio/original-phone-ringtone-36558.mp3'

// Debug flag - set to true to enable detailed SIP message logging
const DEBUG_SIP = true

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
  const [remoteAudio, setRemoteAudio] = useState<HTMLAudioElement | null>(() => {
    try {
      const audio = new window.Audio();
      audio.autoplay = true;
      audio.volume = 1.0;
      console.log('Remote audio element initialized during hook creation');
      return audio;
    } catch (error) {
      console.error('Failed to create remote audio element:', error);
      return null;
    }
  });
  
  // Call state
  const [callState, setCallState] = useState<string>('')
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
  
  // Hàm tạo phần tử audio mới
  const createNewAudio = useCallback(() => {
    try {
      const audio = new window.Audio();
      audio.autoplay = true;
      audio.volume = 1.0;
      console.log('New audio element created');
      return audio;
    } catch (error) {
      console.error('Failed to create new audio element:', error);
      return null;
    }
  }, []);
  
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
  
  // Handle early media streams with improved error handling
  const handleEarlyMedia = useCallback((session: any, providedAudio?: HTMLAudioElement) => {
    console.log('Setting up early media handling for session');
    
    // Use provided audio element or fall back to state
    const audioElement = providedAudio || remoteAudio;
    
    if (!audioElement) {
      console.error('Remote audio element not available for early media');
      // Tạo mới audio element nếu không có
      const newAudio = createNewAudio();
      if (newAudio) {
        setRemoteAudio(newAudio);
        
        // Đợi một thời gian ngắn rồi thử lại
        setTimeout(() => {
          handleEarlyMedia(session, newAudio);
        }, 100);
      }
      return;
    }
    
    if (!session) {
      console.error('No session provided for early media handling');
      return;
    }
    
    try {
      // Check if we already have streams
      if (session.connection && 
          session.connection.getRemoteStreams && 
          session.connection.getRemoteStreams().length > 0) {
        
        const stream = session.connection.getRemoteStreams()[0];
        
        if (stream && stream.getTracks().length > 0) {
          console.log('Early media stream found, setting up audio');
          
          // Thử cả hai cách để đảm bảo phát được âm thanh
          audioElement.srcObject = stream;
          hasEarlyMediaRef.current = true;
          
          // Ensure the audio is unmuted and playing
          audioElement.muted = false;
          audioElement.volume = 1.0;
          
          // Thêm thử nghiệm với AudioContext
          try {
            if (!audioContextRef.current) {
              audioContextRef.current = new AudioContext();
            }
            
            const source = audioContextRef.current.createMediaStreamSource(stream);
            const destination = audioContextRef.current.destination;
            source.connect(destination);
            console.log('Connected stream to AudioContext');
          } catch (audioContextError) {
            console.warn('AudioContext not supported or error:', audioContextError);
          }
          
          audioElement.play()
            .then(() => {
              console.log('Early media playback started successfully');
            })
            .catch(err => {
              console.error('Error playing early media:', err);
              
              // Try again after user interaction
              const resumeAudio = () => {
                audioElement.play()
                  .then(() => console.log('Early media resumed after user interaction'))
                  .catch(e => console.error('Still failed to play early media:', e));
              };
              
              document.addEventListener('click', resumeAudio, { once: true });
            });
        } else {
          console.log('Early media stream found but no audio tracks');
        }
      } else {
        console.log('No early media streams available yet');
      }
    } catch (error) {
      console.error('Error handling early media:', error);
    }
  }, [remoteAudio, createNewAudio]);
  
  // Add stream to audio element - critical for audio to work properly
  const addStream = useCallback((session: any, providedAudio?: HTMLAudioElement) => {
    console.log('Adding stream to audio element, session:', 
      session ? {
        direction: session.direction,
        hasConnection: !!session.connection,
        status: session.status
      } : 'null');
    
    // Use provided audio element or fall back to state
    const audioElement = providedAudio || remoteAudio;
    
    if (!audioElement) {
      console.error('Remote audio element not available');
      // Tạo mới nếu không có
      const newAudio = createNewAudio();
      if (newAudio) {
        setRemoteAudio(newAudio);
        
        // Đợi một thời gian ngắn rồi thử lại
        setTimeout(() => {
          addStream(session, newAudio);
        }, 100);
      }
      return;
    }
    
    if (session && session.connection) {
      // Handle addstream event for backward compatibility
      const handleAddStream = (e: any) => {
        console.log('Stream added to session:', e.stream ? {
          id: e.stream.id,
          active: e.stream.active,
          tracks: e.stream.getTracks().map(t => t.kind)
        } : 'no stream');
        
        if (audioElement && e.stream) {
          console.log('Setting remote audio srcObject from addstream event');
          audioElement.srcObject = e.stream;
          
          // Thử cả hai cách để đảm bảo phát được âm thanh
          try {
            if (!audioContextRef.current) {
              audioContextRef.current = new AudioContext();
            }
            
            const source = audioContextRef.current.createMediaStreamSource(e.stream);
            const destination = audioContextRef.current.destination;
            source.connect(destination);
            console.log('Connected stream to AudioContext');
          } catch (audioContextError) {
            console.warn('AudioContext not supported or error:', audioContextError);
          }
          
          // Ensure audio is playing with better error handling
          const playPromise = audioElement.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('Audio playback started successfully');
            }).catch(err => {
              console.error('Error playing audio:', err);
              
              // Try to recover after user interaction
              const resumeAudio = () => {
                console.log('Attempting to resume audio after user interaction');
                audioElement.play()
                  .then(() => console.log('Audio resumed after user interaction'))
                  .catch(e => console.error('Failed to resume audio:', e));
              };
              
              // Add one-time click listener to resume audio
              document.addEventListener('click', resumeAudio, { once: true });
              
              // Show a toast to inform user
              toast.warning('Nhấp vào bất kỳ đâu để bật âm thanh', toastOptions);
            });
          }
        } else {
          console.error('Remote audio element not available or no stream in event');
        }
      };
      
      // Add legacy event listener - needed for some browsers/situations
      session.connection.addEventListener('addstream', handleAddStream);
      
      // Modern approach: handle tracks directly
      const handleTrack = (e: RTCTrackEvent) => {
        console.log('Track event triggered:', {
          kind: e.track.kind,
          id: e.track.id,
          readyState: e.track.readyState
        });
        
        if (e.track.kind === 'audio' && audioElement) {
          console.log('Setting up audio track');
          
          // Create a new MediaStream for this track
          const stream = new MediaStream();
          stream.addTrack(e.track);
          
          // Set the stream to the audio element
          audioElement.srcObject = stream;
          
          // Play with proper error handling
          audioElement.play()
            .then(() => console.log('Audio track playback started'))
            .catch(err => {
              console.error('Error playing audio track:', err);
              
              // Try to play on user interaction
              document.addEventListener('click', () => {
                audioElement.play().catch(e => console.error('Error on retry:', e));
              }, { once: true });
            });
        }
      };
      
      // Add track event handler if peerConnection is available
      if (session.sessionDescriptionHandler?.peerConnection) {
        session.sessionDescriptionHandler.peerConnection.ontrack = handleTrack;
      }
      
      // Check if streams are already available (could happen with early media)
      if (session.connection.getRemoteStreams && session.connection.getRemoteStreams().length > 0) {
        const stream = session.connection.getRemoteStreams()[0];
        console.log('Remote stream already available, setting directly:', {
          id: stream.id,
          active: stream.active,
          tracks: stream.getTracks().map(t => t.kind)
        });
        
        audioElement.srcObject = stream;
        
        // Play with error handling
        audioElement.play()
          .then(() => console.log('Direct stream playback started'))
          .catch(err => {
            console.error('Error playing direct stream:', err);
            
            // Show toast with instructions
            toast.warning('Nhấp vào bất kỳ đâu để bật âm thanh', toastOptions);
            
            // Try to play on user interaction
            document.addEventListener('click', () => {
              audioElement.play().catch(e => console.error('Error on retry:', e));
            }, { once: true });
          });
      }
      
      return () => {
        // Cleanup function
        if (session.connection) {
          session.connection.removeEventListener('addstream', handleAddStream);
        }
        
        if (session.sessionDescriptionHandler?.peerConnection) {
          session.sessionDescriptionHandler.peerConnection.ontrack = null;
        }
      };
    } else {
      console.warn('Session or connection not available for adding stream');
    }
  }, [remoteAudio, createNewAudio]);
  
  // Detect potential SIP connection loops
  const detectSIPLoop = useCallback(() => {
    // Increment the counter and record the time
    uaInitCountRef.current++;
    const now = Date.now();
    const timeSinceLastInit = now - lastUaInitTimeRef.current;
    lastUaInitTimeRef.current = now;
    
    // Check for rapid initialization (more than 3 in 10 seconds)
    if (uaInitCountRef.current > 3 && timeSinceLastInit < 10000) {
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
      const newRemoteAudio = createNewAudio();
      if (newRemoteAudio) {
        setRemoteAudio(newRemoteAudio);
        console.log('Created new remote audio element');
      } else {
        console.error('Failed to create remote audio element, audio might not work properly');
      }
    }
    
    // Create ringtone if not exists
    if (!ringtoneRef.current) {
      try {
        ringtoneRef.current = new Audio(RINGTONE_PATH);
        ringtoneRef.current.loop = true;
        console.log('Created ringtone audio element');
      } catch (error) {
        console.error('Failed to create ringtone audio:', error);
      }
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
        no_answer_timeout: 45,
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
            addStream,
            handleEarlyMedia,
            countTime,
            resetCall,
            createNewAudio
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
  }, [ua, remoteAudio, addStream, handleEarlyMedia, countTime, resetCall, options, detectSIPLoop, createNewAudio]);
  
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
      const newAudio = createNewAudio();
      if (newAudio) {
        setRemoteAudio(newAudio);
        console.log('Created new remote audio element before making call');
      } else {
        console.warn('Could not create audio element, proceeding with call but audio may not work');
      }
    }
    
    const options = {
      mediaConstraints: { audio: true, video: false },
      pcConfig: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' } // Add STUN server for better connectivity
        ],
        iceTransportPolicy: 'all',
        bundlePolicy: 'balanced',
        rtcpMuxPolicy: 'require',
        iceCandidatePoolSize: 2,
        sdpSemantics: 'unified-plan'
      },
      
      // Critical options for early media support
      RTCConstraints: {"optional": [{'DtlsSrtpKeyAgreement': 'true'}]},
      earlyMedia: true,          // Enable early media support
      answerOnProgress: true,    // Auto handle progress responses with early media
      
      extraHeaders: [],
      mediaStream: undefined
    };
    
    try {
      // Reset early media flag before making call
      hasEarlyMediaRef.current = false;
      
      ua.call(destination, options);
      console.log('Call initiated with early media support:', options);
    } catch (error) {
      console.error('Error making call:', error);
      toast.error('Không thể thực hiện cuộc gọi', toastOptions);
    }
  }, [ua, remoteAudio, createNewAudio]);
  
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
        pcConfig: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ],
          rtcpMuxPolicy: 'require'
        }
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
  
  // Microphone control
  const disableMicrophone = useCallback(() => {
    console.log('Disabling microphone');
    
    if (session && session.sessionDescriptionHandler) {
      const pc = session.sessionDescriptionHandler.peerConnection;
      if (pc) {
        pc.getSenders().forEach((sender: any) => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = false;
            console.log('Audio track disabled');
          }
        });
      }
    } else {
      console.warn('No session or peerConnection to disable microphone');
    }
  }, [session]);
  
  const enableMicrophone = useCallback(() => {
    console.log('Enabling microphone');
    
    if (session && session.sessionDescriptionHandler) {
      const pc = session.sessionDescriptionHandler.peerConnection;
      if (pc) {
        pc.getSenders().forEach((sender: any) => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = true;
            console.log('Audio track enabled');
          }
        });
      }
    } else {
      console.warn('No session or peerConnection to enable microphone');
    }
  }, [session]);
  
  // Speaker control
  const muteAudio = useCallback(() => {
    console.log('Muting audio');
    
    if (session && session.sessionDescriptionHandler) {
      const pc = session.sessionDescriptionHandler.peerConnection;
      if (pc) {
        pc.getReceivers().forEach((receiver: any) => {
          if (receiver.track && receiver.track.kind === 'audio') {
            receiver.track.enabled = false;
            console.log('Receiver audio track disabled');
          }
        });
      }
    } else {
      console.warn('No session or peerConnection to mute audio');
    }
    
    // Also mute the audio element directly
    if (remoteAudio) {
      remoteAudio.muted = true;
    }
  }, [session, remoteAudio]);
  
  const unmuteAudio = useCallback(() => {
    console.log('Unmuting audio');
    
    if (session && session.sessionDescriptionHandler) {
      const pc = session.sessionDescriptionHandler.peerConnection;
      if (pc) {
        pc.getReceivers().forEach((receiver: any) => {
          if (receiver.track && receiver.track.kind === 'audio') {
            receiver.track.enabled = true;
            console.log('Receiver audio track enabled');
          }
        });
      }
    } else {
      console.warn('No session or peerConnection to unmute audio');
    }
    
    // Also unmute the audio element directly
    if (remoteAudio) {
      remoteAudio.muted = false;
    }
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