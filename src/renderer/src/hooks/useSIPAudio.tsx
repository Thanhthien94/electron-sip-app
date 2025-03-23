/**
 * Audio handling utilities for SIP calls
 * Cải thiện xử lý âm thanh và early media cho các cuộc gọi SIP
 */

// Hằng số
const MAX_AUDIO_RETRY = 3
const AUDIO_RETRY_DELAY = 500 // ms

// Hàm tạo phần tử audio mới với retry mechanism
export const createAudioElement = (): HTMLAudioElement | null => {
  let retryCount = 0

  const tryCreateAudio = (): HTMLAudioElement | null => {
    try {
      const audio = new window.Audio()
      audio.autoplay = true
      audio.volume = 1.0
      audio.muted = false

      // Thêm kiểm tra
      if (!audio) {
        throw new Error('Failed to create audio element')
      }

      // Thêm sự kiện để theo dõi
      audio.onloadedmetadata = () => console.log('Audio element: metadata loaded')
      audio.oncanplay = () => console.log('Audio element: can play')
      audio.onplay = () => console.log('Audio element: playback started')
      audio.onerror = (e) => console.error('Audio element error:', e)

      console.log('New audio element created successfully')
      return audio
    } catch (error) {
      console.error(`Failed to create audio element (attempt ${retryCount + 1}):`, error)

      if (retryCount < MAX_AUDIO_RETRY) {
        retryCount++
        console.log(`Retrying audio creation (${retryCount}/${MAX_AUDIO_RETRY})...`)

        // Thử lại sau một khoảng thời gian
        setTimeout(tryCreateAudio, AUDIO_RETRY_DELAY)
        return null
      } else {
        console.error('Max retry attempts reached for audio creation')
        return null
      }
    }
  }

  return tryCreateAudio()
}

// Cải thiện early media handling để xử lý lỗi tốt hơn
export const setupEarlyMedia = (
  session: any,
  audioElement: HTMLAudioElement | null,
  hasEarlyMediaRef?: React.MutableRefObject<boolean>, // Làm tham số này tùy chọn
  // audioContextRef?: React.MutableRefObject<AudioContext | null>
): void => {
  console.log('Setting up early media handling for session')

  // Kiểm tra xem session và audioElement có tồn tại không
  if (!session) {
    console.error('Cannot setup early media: Session is null or undefined')
    return
  }

  if (!audioElement) {
    console.error('Cannot setup early media: Audio element is null or undefined')
    return
  }

  try {
    // Đảm bảo audioElement đã được khởi tạo đầy đủ
    if (!audioElement.play) {
      console.error('Audio element is missing play method')
      return
    }

    // Kiểm tra hasEarlyMediaRef trước khi sử dụng
    const isEarlyMediaAlreadySetup = hasEarlyMediaRef?.current || false
    if (isEarlyMediaAlreadySetup) {
      console.log('Early media already set up, checking streams')
    }

    let remoteStream: MediaStream | null = null

    // Thử lấy stream từ các nguồn khác nhau
    try {
      // JsSIP 3.x way - use getRemoteStreams
      if (
        session.connection &&
        session.connection.getRemoteStreams &&
        session.connection.getRemoteStreams().length > 0
      ) {
        remoteStream = session.connection.getRemoteStreams()[0]
        console.log('Got remote stream using getRemoteStreams()')
      }
      // Modern RTCPeerConnection way
      else if (
        session.sessionDescriptionHandler &&
        session.sessionDescriptionHandler.peerConnection
      ) {
        const pc = session.sessionDescriptionHandler.peerConnection

        // Cách 1: Sử dụng getReceivers (phương pháp hiện đại)
        if (pc.getReceivers && typeof pc.getReceivers === 'function') {
          const receivers = pc.getReceivers()

          if (receivers && receivers.length > 0) {
            // Tạo MediaStream mới từ các tracks audio
            const audioTracks = receivers
              .filter((receiver) => receiver.track && receiver.track.kind === 'audio')
              .map((receiver) => receiver.track)

            if (audioTracks.length > 0) {
              remoteStream = new MediaStream(audioTracks)
              console.log('Created MediaStream from audio receivers:', audioTracks.length)
            }
          }
        }

        // Cách 2: Backup - sử dụng getRemoteStreams qua peerConnection
        if (!remoteStream && pc.getRemoteStreams && typeof pc.getRemoteStreams === 'function') {
          const streams = pc.getRemoteStreams()
          if (streams && streams.length > 0) {
            remoteStream = streams[0]
            console.log('Got remote stream from peerConnection.getRemoteStreams()')
          }
        }
      }
    } catch (streamError) {
      console.error('Error getting remote stream:', streamError)
    }

    // Xử lý stream nếu tìm thấy
    if (remoteStream) {
      console.log('Early media stream found')

      if (remoteStream.getTracks && typeof remoteStream.getTracks === 'function') {
        console.log(
          'Stream tracks:',
          remoteStream
            .getTracks()
            .map((t) => `${t.kind}:${t.id}:${t.enabled ? 'enabled' : 'disabled'}`)
            .join(', ')
        )
      }

      // Thiết lập stream cho audio element
      try {
        audioElement.srcObject = remoteStream

        // Cập nhật hasEarlyMediaRef một cách an toàn
        if (hasEarlyMediaRef) {
          hasEarlyMediaRef.current = true
        }

        // Đảm bảo âm thanh không bị tắt
        audioElement.muted = false
        audioElement.volume = 1.0

        // Play audio với error handling
        const playPromise = audioElement.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Early media playback started successfully')
            })
            .catch((err) => {
              console.error('Error playing early media:', err)

              // Cố gắng khắc phục vấn đề autoplay policy
              const resumeAudio = () => {
                if (!audioElement) return

                audioElement
                  .play()
                  .then(() => console.log('Early media resumed after user interaction'))
                  .catch((e) => console.error('Still failed to play early media:', e))
              }

              document.addEventListener('click', resumeAudio, { once: true })
            })
        }
      } catch (streamError) {
        console.error('Error setting up srcObject for early media:', streamError)
      }
    } else {
      console.log('No early media streams available yet')
    }
  } catch (error) {
    console.error('Error handling early media:', error)
  }
}

// Thêm stream vào phần tử audio với xử lý lỗi cải tiến
export const addStreamToAudio = (
  session: any,
  audioElement: HTMLAudioElement | null,
  // audioContextRef?: React.MutableRefObject<AudioContext | null>
): (() => void) | undefined => {
  console.log('Adding stream to audio element')

  // Kiểm tra session và audioElement tồn tại
  if (!session) {
    console.error('Cannot add stream: Session is null or undefined')
    return undefined
  }

  if (!audioElement) {
    console.error('Cannot add stream: Audio element is null or undefined')
    return undefined
  }

  // Biến để theo dõi các cleanup function
  const cleanupFunctions: Array<() => void> = []

  try {
    // Đảm bảo audio element được cấu hình đúng
    audioElement.muted = false
    audioElement.volume = 1.0
    audioElement.autoplay = true

    // Handle addstream event for backward compatibility
    const handleAddStream = (e: any) => {
      console.log('Stream added to session:', e.stream ? 'stream received' : 'no stream')

      if (!e.stream) {
        console.warn('addstream event fired but no stream provided')
        return
      }

      if (audioElement) {
        try {
          console.log('Setting remote audio srcObject from addstream event')
          audioElement.srcObject = e.stream

          // Ensure audio is playing with better error handling
          const playPromise = audioElement.play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('Audio playback started successfully')
              })
              .catch((err) => {
                console.error('Error playing audio:', err)

                // Try to recover after user interaction
                const resumeAudio = () => {
                  if (!audioElement) return

                  console.log('Attempting to resume audio after user interaction')
                  audioElement
                    .play()
                    .then(() => console.log('Audio resumed after user interaction'))
                    .catch((e) => console.error('Failed to resume audio:', e))
                }

                // Add one-time click listener to resume audio
                document.addEventListener('click', resumeAudio, { once: true })
                cleanupFunctions.push(() => {
                  document.removeEventListener('click', resumeAudio)
                })
              })
          }
        } catch (error) {
          console.error('Error setting srcObject in addstream handler:', error)
        }
      }
    }

    // Kiểm tra và thiết lập stream đã có sẵn trong session
    try {
      let existingStream: MediaStream | null = null

      // Check session connection
      if (
        session.connection &&
        session.connection.getRemoteStreams &&
        typeof session.connection.getRemoteStreams === 'function'
      ) {
        const streams = session.connection.getRemoteStreams()
        if (streams && streams.length > 0) {
          existingStream = streams[0]
          console.log('Found existing stream in session connection')
        }
      }

      // Check session description handler
      if (!existingStream && session.sessionDescriptionHandler?.peerConnection) {
        const pc = session.sessionDescriptionHandler.peerConnection

        // Try getReceivers first
        if (pc.getReceivers && typeof pc.getReceivers === 'function') {
          const receivers = pc.getReceivers()
          if (receivers && receivers.length > 0) {
            const audioTracks = receivers
              .filter((receiver) => receiver.track && receiver.track.kind === 'audio')
              .map((receiver) => receiver.track)

            if (audioTracks.length > 0) {
              existingStream = new MediaStream(audioTracks)
              console.log('Created MediaStream from existing receivers')
            }
          }
        }

        // Fallback to getRemoteStreams
        if (!existingStream && pc.getRemoteStreams && typeof pc.getRemoteStreams === 'function') {
          const pcStreams = pc.getRemoteStreams()
          if (pcStreams && pcStreams.length > 0) {
            existingStream = pcStreams[0]
            console.log('Found existing stream in peerConnection')
          }
        }
      }

      // Apply existing stream if found
      if (existingStream && audioElement) {
        console.log('Applying existing stream to audio element')
        audioElement.srcObject = existingStream
        audioElement
          .play()
          .then(() => console.log('Existing stream playback started'))
          .catch((err) => console.error('Error playing existing stream:', err))
      }
    } catch (error) {
      console.error('Error setting up existing stream:', error)
    }

    // Set up event listeners based on what's available

    // 1. Add listener to session.connection (JsSIP style)
    if (session.connection) {
      try {
        session.connection.addEventListener('addstream', handleAddStream)
        cleanupFunctions.push(() => {
          if (session.connection) {
            try {
              session.connection.removeEventListener('addstream', handleAddStream)
            } catch (err) {
              console.error('Error removing addstream listener:', err)
            }
          }
        })
      } catch (error) {
        console.error('Error adding addstream event listener:', error)
      }
    }

    // 2. Add track handling to RTCPeerConnection if available
    if (session.sessionDescriptionHandler?.peerConnection) {
      try {
        const pc = session.sessionDescriptionHandler.peerConnection

        // Modern approach with ontrack
        const handleTrack = (e: RTCTrackEvent) => {
          console.log(
            'Track event triggered:',
            e.track ? `${e.track.kind}:${e.track.id}` : 'no track'
          )

          if (e.track && e.track.kind === 'audio' && audioElement) {
            // Create a stream that includes all audio tracks
            const stream = new MediaStream()

            // Add all audio tracks from all streams
            e.streams.forEach((s) => {
              s.getAudioTracks().forEach((track) => {
                stream.addTrack(track)
              })
            })

            if (stream.getAudioTracks().length === 0) {
              // If no tracks in the event's streams, add this specific track
              stream.addTrack(e.track)
            }

            console.log('Setting up audio track(s) from ontrack event')

            // Set the stream to the audio element
            audioElement.srcObject = stream

            // Play with proper error handling
            audioElement
              .play()
              .then(() => console.log('Audio track playback started'))
              .catch((err) => {
                console.error('Error playing audio track:', err)

                // Try to play on user interaction
                const resumeTrackAudio = () => {
                  if (!audioElement) return

                  audioElement.play().catch((e) => console.error('Error on track audio retry:', e))
                }

                document.addEventListener('click', resumeTrackAudio, { once: true })
                cleanupFunctions.push(() => {
                  document.removeEventListener('click', resumeTrackAudio)
                })
              })
          }
        }

        pc.ontrack = handleTrack

        cleanupFunctions.push(() => {
          if (session.sessionDescriptionHandler?.peerConnection) {
            session.sessionDescriptionHandler.peerConnection.ontrack = null
          }
        })
      } catch (peerConnError) {
        console.error('Error setting up track handler:', peerConnError)
      }
    }

    // Return a combined cleanup function
    return () => {
      console.log('Running audio stream cleanup functions')
      cleanupFunctions.forEach((fn) => {
        try {
          fn()
        } catch (err) {
          console.error('Error in cleanup function:', err)
        }
      })

      // Additional cleanup
      if (audioElement) {
        try {
          audioElement.pause()
          audioElement.srcObject = null
        } catch (err) {
          console.error('Error cleaning up audio element:', err)
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error in addStreamToAudio:', error)
    return undefined
  }
}

// Bật/tắt microphone với xử lý lỗi cải tiến
export const toggleMicrophone = (session: any, enable: boolean): boolean => {
  if (!session) {
    console.warn('No session provided to toggle microphone')
    return false
  }

  if (!session.sessionDescriptionHandler) {
    console.warn('No sessionDescriptionHandler available to toggle microphone')
    return false
  }

  const pc = session.sessionDescriptionHandler.peerConnection
  if (!pc) {
    console.warn('No peer connection available to toggle microphone')
    return false
  }

  let success = false

  try {
    // Sử dụng RTCRtpSender để tìm và xử lý audio track
    const senders = pc.getSenders()
    if (!senders || senders.length === 0) {
      console.warn('No RTP senders found')
      return false
    }

    let audioTrackFound = false

    senders.forEach((sender: RTCRtpSender) => {
      if (sender.track && sender.track.kind === 'audio') {
        audioTrackFound = true

        try {
          sender.track.enabled = enable
          success = true
          console.log(`Microphone ${enable ? 'enabled' : 'disabled'}`)
        } catch (trackError) {
          console.error(`Error ${enable ? 'enabling' : 'disabling'} audio track:`, trackError)
        }
      }
    })

    if (!audioTrackFound) {
      console.warn('No audio tracks found to toggle')
    }
  } catch (error) {
    console.error(`Error ${enable ? 'enabling' : 'disabling'} microphone:`, error)
  }

  return success
}

// Bật/tắt âm thanh (speaker) với xử lý lỗi cải tiến
export const toggleAudio = (
  session: any,
  audioElement: HTMLAudioElement | null,
  enable: boolean
): boolean => {
  let success = false

  // Method 1: Disable audio tracks in RTCRtpReceiver
  if (session && session.sessionDescriptionHandler) {
    const pc = session.sessionDescriptionHandler.peerConnection
    if (pc) {
      try {
        const receivers = pc.getReceivers()
        if (!receivers || receivers.length === 0) {
          console.warn('No RTP receivers found')
        } else {
          let audioTrackFound = false

          receivers.forEach((receiver: RTCRtpReceiver) => {
            if (receiver.track && receiver.track.kind === 'audio') {
              audioTrackFound = true

              try {
                receiver.track.enabled = enable
                success = true
              } catch (trackError) {
                console.error(
                  `Error ${enable ? 'enabling' : 'disabling'} receiver track:`,
                  trackError
                )
              }
            }
          })

          if (!audioTrackFound) {
            console.warn('No audio receiver tracks found to toggle')
          }
        }
      } catch (error) {
        console.error(`Error ${enable ? 'unmuting' : 'muting'} audio through receivers:`, error)
      }
    }
  }

  // Method 2: Mute the audio element directly (more reliable)
  if (audioElement) {
    try {
      audioElement.muted = !enable

      // Additionally try to set volume
      if (enable) {
        audioElement.volume = 1.0
      } else {
        audioElement.volume = 0.0
      }

      success = true
    } catch (error) {
      console.error(`Error ${enable ? 'unmuting' : 'muting'} audio element:`, error)
    }
  } else {
    console.warn('No audio element provided to toggle audio')
  }

  console.log(`Audio ${enable ? 'unmuted' : 'muted'} (success: ${success})`)
  return success
}

// Tạo và cấu hình ringtone với xử lý lỗi
export const createRingtone = (src: string): HTMLAudioElement | null => {
  if (!src) {
    console.error('No source provided for ringtone')
    return null
  }

  try {
    const ringtone = new Audio(src)
    ringtone.loop = true
    ringtone.volume = 0.7 // Giảm âm lượng để không quá to

    // Thêm xử lý lỗi cho ringtone
    ringtone.onerror = (e) => {
      console.error('Error loading ringtone:', e)
    }

    console.log('Ringtone audio element created')
    return ringtone
  } catch (error) {
    console.error('Error creating ringtone:', error)
    return null
  }
}
