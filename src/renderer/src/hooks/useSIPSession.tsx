import { toast } from 'react-toastify'
import { toastOptions } from '@/lib/toast'
import { CALL_STATES, SIP_CODE_MESSAGES } from '@/lib/sipConstants'

// Utility to extract SIP code from raw message
export const extractSipCodeFromMessage = (message: string): number | null => {
  try {
    // Match the status line (e.g., "SIP/2.0 200 OK" or "SIP/2.0 487 Request Terminated")
    const statusLineMatch = message.match(/SIP\/2\.0 (\d+)\s/)
    if (statusLineMatch && statusLineMatch[1]) {
      return parseInt(statusLineMatch[1], 10)
    }

    // Alternatively check for request line with response code
    const requestLineMatch = message.match(/(\d+)\s+[A-Za-z\s]+$/m)
    if (requestLineMatch && requestLineMatch[1]) {
      return parseInt(requestLineMatch[1], 10)
    }

    return null
  } catch (error) {
    console.error('Error extracting SIP code from message:', error)
    return null
  }
}

/**
 * Handles RTC session events and state management
 * This function is extracted from useSIP to make the code more modular and maintainable
 */
export const handleRTCSession = (
  ev: any,
  // State setters
  setState: {
    setSession: React.Dispatch<React.SetStateAction<any>>
    setCallState: React.Dispatch<React.SetStateAction<string>>
    setCallDuration: React.Dispatch<React.SetStateAction<string>>
    setStatusCode: React.Dispatch<React.SetStateAction<number | null>>
    setIncomingCallerId: React.Dispatch<React.SetStateAction<string>>
    setRemoteAudio?: React.Dispatch<React.SetStateAction<HTMLAudioElement | null>>
  },
  // Refs
  refs: {
    sessionRef: React.MutableRefObject<any>
    intervalIdRef: React.MutableRefObject<any>
    ringtoneRef: React.MutableRefObject<HTMLAudioElement | null>
    lastSipMessageRef: React.MutableRefObject<string>
    hasEarlyMediaRef: React.MutableRefObject<boolean>
    audioContextRef?: React.MutableRefObject<AudioContext | null>
  },
  // Helper functions
  helpers: {
    addStream: (session: any, audioElement?: HTMLAudioElement) => void
    handleEarlyMedia: (session: any, audioElement?: HTMLAudioElement) => void
    countTime: (startTime: Date) => string
    resetCall: () => void
    createNewAudio?: () => HTMLAudioElement | null
  },
  // Options
  options: {
    onCallTerminated?: (cause: string, statusCode: number, reason: string) => void
    onCallConnected?: () => void
    onIncomingCall?: (callerId: string) => void
    useAudioContext?: boolean
  }
) => {
  console.log('New RTC session received:', ev)

  // Skip if this is a duplicate event for the same session
  if (refs.sessionRef.current && refs.sessionRef.current.id === ev.session.id) {
    console.log('Duplicate session event received, ignoring:', ev.session.id)
    return
  }

  const newSession = ev.session

  // Destructure state setters
  const {
    setSession,
    setCallState,
    setCallDuration,
    setStatusCode,
    setIncomingCallerId,
    setRemoteAudio
  } = setState

  // Destructure refs
  const {
    sessionRef,
    intervalIdRef,
    ringtoneRef,
    lastSipMessageRef,
    hasEarlyMediaRef,
    audioContextRef
  } = refs

  // Destructure helper functions
  const { addStream, handleEarlyMedia, countTime, resetCall, createNewAudio } = helpers

  // If there's an active session, terminate it
  if (sessionRef.current && sessionRef.current !== newSession) {
    console.log('Terminating existing session before handling new one')
    try {
      sessionRef.current.terminate()
    } catch (error) {
      console.error('Error terminating existing session:', error)
    }
  }

  // Update session state
  setSession(newSession)
  sessionRef.current = newSession

  // Make sure to clean up listeners when session ends
  const cleanupSessionListeners = () => {
    if (!newSession) return

    // Remove all listeners to prevent memory leaks and duplicate handlers
    try {
      newSession.removeAllListeners('progress')
      newSession.removeAllListeners('connecting')
      newSession.removeAllListeners('peerconnection')
      newSession.removeAllListeners('accepted')
      newSession.removeAllListeners('confirmed')
      newSession.removeAllListeners('ended')
      newSession.removeAllListeners('failed')
      console.log('All session listeners cleaned up')
    } catch (error) {
      console.error('Error removing event listeners:', error)
    }

    // If the peerConnection exists, clean up its listeners too
    if (newSession.sessionDescriptionHandler?.peerConnection) {
      try {
        const pc = newSession.sessionDescriptionHandler.peerConnection
        pc.oniceconnectionstatechange = null
        pc.onicegatheringstatechange = null
        pc.onsignalingstatechange = null
        pc.ontrack = null
        console.log('PeerConnection listeners cleaned up')
      } catch (error) {
        console.error('Error cleaning up peerConnection listeners:', error)
      }
    }

    // Close AudioContext if it was created
    if (options.useAudioContext && audioContextRef?.current) {
      try {
        audioContextRef.current
          .close()
          .then(() => {
            console.log('AudioContext closed')
            audioContextRef.current = null
          })
          .catch((err) => {
            console.error('Error closing AudioContext:', err)
          })
      } catch (error) {
        console.error('Error closing AudioContext:', error)
      }
    }
  }

  // Define session completion handler with improved SIP code extraction
  const completeSession = (data: any) => {
    let sipCode: number | null = null
    let reason = ''
    let isSuccessful = false

    try {
      console.log('Call completion data:', {
        cause: data.cause,
        status_code: data.message?.status_code,
        originator: data.originator
      })

      // Start with specific cases based on cause
      const cause = data.cause

      // 1. First try to extract SIP code from the last received SIP message
      if (lastSipMessageRef.current) {
        sipCode = extractSipCodeFromMessage(lastSipMessageRef.current)

        if (sipCode) {
          console.log(`SIP code ${sipCode} extracted from last SIP message`)
        }
      }

      // 2. If not found in SIP message, try to extract from event data
      if (!sipCode) {
        // First check if cause is CANCELED/BYE for special handling
        if (cause === 'CANCELED' || cause === 'Canceled') {
          sipCode = 487 // Request Terminated
          console.log('Call was canceled, using code 487')
        } else if (cause === 'BYE') {
          sipCode = 200 // OK for normal termination
          console.log('Normal call termination (BYE), using code 200')
        }
        // Then check message structures if still no code
        else if (data.message && data.message.status_code) {
          sipCode = data.message.status_code
          console.log(`SIP code ${sipCode} from message.status_code`)
        }
        // Check alternative structure
        else if (data.message && data.message.statusCode) {
          sipCode = data.message.statusCode
          console.log(`SIP code ${sipCode} from message.statusCode`)
        }
        // Check direct statusCode
        else if (data.statusCode) {
          sipCode = data.statusCode
          console.log(`SIP code ${sipCode} from data.statusCode`)
        }
        // Check status field
        else if (data.status) {
          sipCode = data.status
          console.log(`SIP code ${sipCode} from data.status`)
        }
      }

      // 3. If still not found, map from causes
      if (!sipCode) {
        console.log(`No SIP code found, mapping from cause: "${cause}"`)

        // Kiểm tra trường hợp người dùng chủ động kết thúc cuộc gọi
        if (cause === 'Terminated' && data.originator === 'local') {
          sipCode = 200 // Normal OK
          console.log('Call was terminated by local user, using code 200')
        } else {
          // Map causes to SIP codes
          const causeToCodeMap: Record<string, number> = {
            BYE: 200, // Normal termination
            CANCELED: 487, // Request Terminated
            Canceled: 487, // Request Terminated (capitalization varies)
            NO_ANSWER: 408, // Request Timeout
            REJECTED: 603, // Decline
            BUSY: 486, // Busy Here
            TRANSPORT_ERROR: 503, // Service Unavailable
            'Dialog/Transaction does not exist': 481, // Call/Transaction Does Not Exist
            'User Denied Media Access': 403, // Forbidden (no media access)
            'WebRTC not supported': 488, // Not Acceptable Here
            'Not Found': 404, // Not Found
            'Connection Error': 503, // Service Unavailable
            'Timer J expired': 408, // Request Timeout
            'Request Timeout': 408 // Request Timeout
          }

          sipCode = causeToCodeMap[cause] || 500
        }
      }

      // Log final determination
      console.log(`Call ended with cause: "${data.cause}", SIP code: ${sipCode}`)

      // Map SIP code to user-friendly reason using SIP_CODE_MESSAGES
      if (sipCode !== null && SIP_CODE_MESSAGES[sipCode]) {
        reason = SIP_CODE_MESSAGES[sipCode]
        isSuccessful = sipCode >= 200 && sipCode < 300
      } else {
        // Fallback if code is not defined in our constants
        if (sipCode !== null) {
          if (sipCode >= 200 && sipCode < 300) {
            reason = 'Kết thúc bình thường'
            isSuccessful = true
          } else if (sipCode === 487) {
            reason = 'Cuộc gọi bị hủy'
          } else if (sipCode === 408) {
            reason = 'Không trả lời'
          } else if (sipCode === 486 || sipCode === 600) {
            reason = 'Máy bận'
          } else if (sipCode === 480) {
            reason = 'Không liên lạc được'
          } else if (sipCode === 603) {
            reason = 'Từ chối cuộc gọi'
          } else if (sipCode >= 400 && sipCode < 500) {
            reason = 'Lỗi phía client'
          } else if (sipCode >= 500 && sipCode < 600) {
            reason = 'Lỗi máy chủ'
          } else if (sipCode >= 600) {
            reason = 'Lỗi toàn cục'
          } else {
            reason = 'Kết thúc cuộc gọi'
          }
        } else {
          reason = 'Kết thúc cuộc gọi'
        }
      }

      // Update state with extracted SIP code
      setStatusCode(sipCode)
    } catch (error) {
      console.error('Error analyzing call completion:', error)
      sipCode = 500
      reason = 'Lỗi xử lý cuộc gọi'
    }

    // Clean up resources
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current)
      intervalIdRef.current = null
    }

    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
    }

    resetCall()
    sessionRef.current = null
    setCallState(CALL_STATES.HANGUP)

    // Notify through callback if provided
    if (options.onCallTerminated) {
      try {
        options.onCallTerminated(data.cause, sipCode || 0, reason)
      } catch (callbackError) {
        console.error('Error in onCallTerminated callback:', callbackError)
      }
    }

    // Reset last SIP message
    lastSipMessageRef.current = ''
  }

  // Create or ensure we have an audio element for our call
  const getAudioElement = () => {
    if (createNewAudio && setRemoteAudio) {
      const audioElement = createNewAudio()
      if (audioElement) {
        setRemoteAudio(audioElement)
      }
      return audioElement
    }
    return null
  }

  // Outgoing call handlers
  if (newSession.direction === 'outgoing') {
    console.log('Handling outgoing call')

    // Progress event - handles early media (ringing from the server)
    newSession.on('progress', (e: any) => {
      console.log('Call is in progress (ringing):', e)
      setCallState(CALL_STATES.RINGING)

      try {
        // Check for presence of SDP in response (indicates early media)
        if (e.originator === 'remote' && e.response) {
          // Check Content-Type header for SDP
          const contentType = e.response.getHeader ? e.response.getHeader('Content-Type') : null

          const hasBody = !!e.response.body

          console.log('Progress response info:', {
            hasContentType: !!contentType,
            contentType,
            hasBody
          })

          if ((contentType === 'application/sdp' || contentType?.includes('sdp')) && hasBody) {
            console.log('SDP detected in progress event - should have early media')

            // Dừng ringtone local nếu phát hiện early media
            if (ringtoneRef.current) {
              ringtoneRef.current.pause()
              console.log('Local ringtone stopped to allow early media')
            }

            // Áp dụng early media
            const audioElement = getAudioElement()
            if (audioElement) {
              // Đảm bảo audio element không bị tắt âm
              audioElement.muted = false
              audioElement.volume = 1.0

              // Thiết lập early media
              handleEarlyMedia(newSession, audioElement)
            }
          }
        }
      } catch (error) {
        console.error('Error processing potential early media:', error)
      }
    })

    newSession.on('connecting', () => {
      console.log('Outgoing call connecting')
      setCallState(CALL_STATES.RINGING)
    })

    newSession.on('peerconnection', (e: any) => {
      console.log('Peerconnection event for outgoing call:', e)

      // Ensure audio element is created
      const audioElement = getAudioElement()

      // Set up track handling for early media detection
      if (e.peerconnection) {
        e.peerconnection.ontrack = (trackEvent: RTCTrackEvent) => {
          console.log('Track received during call setup:', trackEvent.track.kind)

          if (trackEvent.track.kind === 'audio') {
            console.log('Setting up early media from ontrack event')

            // Create a new MediaStream with the received track
            const stream = new MediaStream()
            stream.addTrack(trackEvent.track)

            // Make sure we have an audio element
            handleEarlyMedia(newSession, audioElement || undefined)
          }
        }
      }
    })

    newSession.on('accepted', (e: any) => {
      console.log('Outgoing call accepted:', e)
      setCallState(CALL_STATES.ANSWERED)

      // Ensure audio element is created
      const audioElement = getAudioElement()

      // Add stream to audio element if we don't already have early media
      if (!hasEarlyMediaRef.current) {
        addStream(newSession, audioElement || undefined)
      }

      // Start duration timer
      const startTime = new Date()
      intervalIdRef.current = window.setInterval(() => {
        const currentDuration = countTime(startTime)
        setCallDuration(currentDuration)
      }, 1000)

      // Notify callback
      if (options.onCallConnected) {
        options.onCallConnected()
      }
    })

    newSession.on('confirmed', (e: any) => {
      console.log('Outgoing call confirmed:', e)
    })
  }

  // Incoming call handlers
  if (newSession.direction === 'incoming') {
    console.log('Handling incoming call')

    // Play ringtone
    if (ringtoneRef.current) {
      console.log('Playing ringtone')
      ringtoneRef.current.play().catch((e) => {
        console.error('Error playing ringtone:', e)
      })
    }

    setCallState(CALL_STATES.RINGING)
    setIncomingCallerId(newSession._request.from._uri._user)

    // Notify callback
    if (options.onIncomingCall) {
      options.onIncomingCall(newSession._request.from._uri._user)
    }

    newSession.on('connecting', (e: any) => {
      console.log('Incoming call connecting:', e)
    })

    newSession.on('peerconnection', (e: any) => {
      console.log('Peerconnection event for incoming call:', e)

      // Ensure audio element is created
      const audioElement = getAudioElement()

      // Set up to handle audio streams
      addStream(newSession, audioElement || undefined)
    })

    newSession.on('accepted', (e: any) => {
      console.log('Incoming call accepted:', e)
      setCallState(CALL_STATES.ANSWERED)

      // Stop ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
      }

      // Start duration timer
      const startTime = new Date()
      intervalIdRef.current = window.setInterval(() => {
        setCallDuration(countTime(startTime))
      }, 1000)
    })

    newSession.on('confirmed', (e: any) => {
      console.log('Incoming call confirmed:', e)
    })
  }

  // Common event handlers for both incoming and outgoing calls
  newSession.on('ended', (data) => {
    completeSession(data)
    cleanupSessionListeners()
  })

  newSession.on('failed', (data) => {
    completeSession(data)
    cleanupSessionListeners()
  })

  // Set up additional WebRTC monitoring
  if (newSession.sessionDescriptionHandler?.peerConnection) {
    const pc = newSession.sessionDescriptionHandler.peerConnection

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state changed:', pc.iceConnectionState)
    }

    pc.onicegatheringstatechange = () => {
      console.log('ICE gathering state changed:', pc.iceGatheringState)
    }

    pc.onsignalingstatechange = () => {
      console.log('Signaling state changed:', pc.signalingState)
    }

    pc.ontrack = (e) => {
      console.log('Track added:', e.track.kind)
      if (e.track.kind === 'audio') {
        console.log('Audio track added directly to peerConnection')

        // Ensure audio element is created
        const audioElement = getAudioElement()

        handleEarlyMedia(newSession, audioElement || undefined)
      }
    }
  }
}
