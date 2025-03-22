/**
 * Audio handling utilities for SIP calls
 * Cải thiện xử lý âm thanh và early media cho các cuộc gọi SIP
 */

// Hằng số
const MAX_AUDIO_RETRY = 3;
const AUDIO_RETRY_DELAY = 500; // ms

// Hàm tạo phần tử audio mới với retry mechanism
export const createAudioElement = (): HTMLAudioElement | null => {
  let retryCount = 0;
  
  const tryCreateAudio = (): HTMLAudioElement | null => {
    try {
      const audio = new window.Audio();
      audio.autoplay = true;
      audio.volume = 1.0;
      
      // Thêm kiểm tra
      if (!audio) {
        throw new Error('Failed to create audio element');
      }
      
      console.log('New audio element created successfully');
      return audio;
    } catch (error) {
      console.error(`Failed to create audio element (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < MAX_AUDIO_RETRY) {
        retryCount++;
        console.log(`Retrying audio creation (${retryCount}/${MAX_AUDIO_RETRY})...`);
        
        // Thử lại sau một khoảng thời gian
        setTimeout(tryCreateAudio, AUDIO_RETRY_DELAY);
        return null;
      } else {
        console.error('Max retry attempts reached for audio creation');
        return null;
      }
    }
  };
  
  return tryCreateAudio();
};

// Cải thiện early media handling để xử lý lỗi tốt hơn
export const setupEarlyMedia = (
  session: any, 
  audioElement: HTMLAudioElement | null,
  hasEarlyMediaRef: React.MutableRefObject<boolean>,
  audioContextRef?: React.MutableRefObject<AudioContext | null>
): void => {
  console.log('Setting up early media handling for session');
  
  // Kiểm tra xem session và audioElement có tồn tại không
  if (!session) {
    console.error('Cannot setup early media: Session is null or undefined');
    return;
  }
  
  if (!audioElement) {
    console.error('Cannot setup early media: Audio element is null or undefined');
    return;
  }
  
  try {
    // Đảm bảo audioElement đã được khởi tạo đầy đủ
    if (!audioElement.play) {
      console.error('Audio element is missing play method');
      return;
    }
    
    // Kiểm tra nếu đã thiết lập early media trước đó
    if (hasEarlyMediaRef.current) {
      console.log('Early media already set up, skipping');
      return;
    }
    
    // Kiểm tra stream có tồn tại không
    if (session.connection && 
        session.connection.getRemoteStreams && 
        session.connection.getRemoteStreams().length > 0) {
      
      const stream = session.connection.getRemoteStreams()[0];
      
      // Bổ sung kiểm tra stream
      if (!stream) {
        console.error('Remote stream is null or undefined');
        return;
      }
      
      // Kiểm tra xem stream có audio tracks không
      if (stream.getTracks && stream.getTracks().length > 0) {
        console.log('Early media stream found with tracks:', 
                    stream.getTracks().map(t => t.kind).join(', '));
        
        // Thiết lập stream cho audio element
        try {
          audioElement.srcObject = stream;
          hasEarlyMediaRef.current = true;
          
          // Đảm bảo âm thanh không bị tắt
          audioElement.muted = false;
          audioElement.volume = 1.0;
          
          // Thêm thử nghiệm với AudioContext nếu được yêu cầu
          if (audioContextRef && !audioContextRef.current) {
            try {
              audioContextRef.current = new AudioContext();
              
              // Chỉ tạo source và kết nối nếu context được tạo thành công
              if (audioContextRef.current) {
                const source = audioContextRef.current.createMediaStreamSource(stream);
                const destination = audioContextRef.current.destination;
                source.connect(destination);
                console.log('Connected stream to AudioContext successfully');
              }
            } catch (audioContextError) {
              console.warn('AudioContext not supported or error:', audioContextError);
              // Tiếp tục mà không sử dụng AudioContext
            }
          }
          
          // Play audio với error handling
          const playPromise = audioElement.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('Early media playback started successfully');
              })
              .catch(err => {
                console.error('Error playing early media:', err);
                
                // Cố gắng khắc phục vấn đề autoplay policy
                const resumeAudio = () => {
                  if (!audioElement) return;
                  
                  audioElement.play()
                    .then(() => console.log('Early media resumed after user interaction'))
                    .catch(e => console.error('Still failed to play early media:', e));
                };
                
                // Thêm lắng nghe sự kiện click một lần để resume audio
                document.addEventListener('click', resumeAudio, { once: true });
                
                // Nếu đang trong một session gọi đi, có thể không cần early media
                // và chờ đến khi cuộc gọi được chấp nhận
                if (session.direction === 'outgoing') {
                  console.log('Outgoing call: Early media error is not critical, will try again when call is answered');
                }
              });
          }
        } catch (streamError) {
          console.error('Error setting up srcObject for early media:', streamError);
          
          // Fallback: Thử dùng createObjectURL (cho trình duyệt cũ)
          try {
            if (window.URL && window.URL.createObjectURL) {
              (audioElement as any).src = window.URL.createObjectURL(stream);
              console.log('Used createObjectURL fallback for early media');
              
              audioElement.play()
                .catch(e => console.error('Failed to play early media with createObjectURL:', e));
            }
          } catch (fallbackError) {
            console.error('Fallback for early media also failed:', fallbackError);
          }
        }
      } else {
        console.log('Early media stream found but no audio tracks');
      }
    } else {
      console.log('No early media streams available yet');
    }
  } catch (error) {
    console.error('Error handling early media:', error);
  }
};

// Thêm stream vào phần tử audio với xử lý lỗi cải tiến
export const addStreamToAudio = (
  session: any, 
  audioElement: HTMLAudioElement | null,
  audioContextRef?: React.MutableRefObject<AudioContext | null>
): (() => void) | undefined => {
  console.log('Adding stream to audio element, session:', 
    session ? {
      direction: session.direction,
      hasConnection: !!session.connection,
      status: session.status
    } : 'null');
  
  // Kiểm tra session và audioElement tồn tại
  if (!session) {
    console.error('Cannot add stream: Session is null or undefined');
    return undefined;
  }
  
  if (!audioElement) {
    console.error('Cannot add stream: Audio element is null or undefined');
    return undefined;
  }
  
  if (!session.connection) {
    console.error('Cannot add stream: Session connection is null or undefined');
    return undefined;
  }
  
  // Kiểm tra audio element
  if (!audioElement.play) {
    console.error('Cannot add stream: Audio element is not fully initialized');
    return undefined;
  }
  
  // Biến để theo dõi các cleanup function
  const cleanupFunctions: Array<() => void> = [];
  
  try {
    // Handle addstream event for backward compatibility
    const handleAddStream = (e: any) => {
      console.log('Stream added to session:', e.stream ? {
        id: e.stream.id,
        active: e.stream.active,
        tracks: e.stream.getTracks().map(t => t.kind)
      } : 'no stream');
      
      if (!e.stream) {
        console.warn('addstream event fired but no stream provided');
        return;
      }
      
      if (audioElement) {
        try {
          console.log('Setting remote audio srcObject from addstream event');
          audioElement.srcObject = e.stream;
          
          // Setup AudioContext for better compatibility if needed
          if (audioContextRef && !audioContextRef.current) {
            try {
              audioContextRef.current = new AudioContext();
              
              if (audioContextRef.current) {
                const source = audioContextRef.current.createMediaStreamSource(e.stream);
                const destination = audioContextRef.current.destination;
                source.connect(destination);
                
                // Add cleanup for AudioContext
                cleanupFunctions.push(() => {
                  if (audioContextRef.current) {
                    try {
                      audioContextRef.current.close();
                      audioContextRef.current = null;
                    } catch (err) {
                      console.error('Error closing AudioContext:', err);
                    }
                  }
                });
                
                console.log('Connected stream to AudioContext');
              }
            } catch (audioContextError) {
              console.warn('AudioContext setup failed:', audioContextError);
            }
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
                if (!audioElement) return;
                
                console.log('Attempting to resume audio after user interaction');
                audioElement.play()
                  .then(() => console.log('Audio resumed after user interaction'))
                  .catch(e => console.error('Failed to resume audio:', e));
              };
              
              // Add one-time click listener to resume audio
              document.addEventListener('click', resumeAudio, { once: true });
              
              // Add cleanup for event listener
              cleanupFunctions.push(() => {
                document.removeEventListener('click', resumeAudio);
              });
            });
          }
        } catch (error) {
          console.error('Error setting srcObject in addstream handler:', error);
          
          // Fallback for older browsers
          try {
            if (window.URL && window.URL.createObjectURL) {
              (audioElement as any).src = window.URL.createObjectURL(e.stream);
              console.log('Used createObjectURL fallback for stream');
              
              audioElement.play()
                .catch(e => console.error('Failed to play with createObjectURL:', e));
            }
          } catch (fallbackError) {
            console.error('Fallback for stream also failed:', fallbackError);
          }
        }
      } else {
        console.error('Audio element not available in addstream handler');
      }
    };
    
    // Add legacy event listener - needed for some browsers/situations
    try {
      session.connection.addEventListener('addstream', handleAddStream);
      
      // Add cleanup function for the addstream listener
      cleanupFunctions.push(() => {
        if (session.connection) {
          try {
            session.connection.removeEventListener('addstream', handleAddStream);
          } catch (err) {
            console.error('Error removing addstream listener:', err);
          }
        }
      });
    } catch (error) {
      console.error('Error adding addstream event listener:', error);
    }
    
    // Modern approach: handle tracks directly with ontrack
    const handleTrack = (e: RTCTrackEvent) => {
      console.log('Track event triggered:', {
        kind: e.track.kind,
        id: e.track.id,
        readyState: e.track.readyState
      });
      
      if (e.track.kind === 'audio' && audioElement) {
        try {
          console.log('Setting up audio track from ontrack event');
          
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
              const resumeTrackAudio = () => {
                if (!audioElement) return;
                
                audioElement.play()
                  .catch(e => console.error('Error on track audio retry:', e));
              };
              
              document.addEventListener('click', resumeTrackAudio, { once: true });
              
              // Add cleanup for event listener
              cleanupFunctions.push(() => {
                document.removeEventListener('click', resumeTrackAudio);
              });
            });
        } catch (error) {
          console.error('Error handling track event:', error);
        }
      }
    };
    
    // Add track event handler if peerConnection is available
    if (session.sessionDescriptionHandler?.peerConnection) {
      try {
        session.sessionDescriptionHandler.peerConnection.ontrack = handleTrack;
        
        // Add cleanup for ontrack
        cleanupFunctions.push(() => {
          if (session.sessionDescriptionHandler?.peerConnection) {
            session.sessionDescriptionHandler.peerConnection.ontrack = null;
          }
        });
      } catch (error) {
        console.error('Error setting ontrack handler:', error);
      }
    }
    
    // Check if streams are already available (could happen with early media)
    try {
      if (session.connection.getRemoteStreams && session.connection.getRemoteStreams().length > 0) {
        const stream = session.connection.getRemoteStreams()[0];
        
        if (stream) {
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
              
              // Handle autoplay restrictions
              const resumeDirectAudio = () => {
                if (!audioElement) return;
                
                audioElement.play()
                  .catch(e => console.error('Error on direct stream retry:', e));
              };
              
              document.addEventListener('click', resumeDirectAudio, { once: true });
              
              // Add cleanup
              cleanupFunctions.push(() => {
                document.removeEventListener('click', resumeDirectAudio);
              });
            });
        }
      }
    } catch (error) {
      console.error('Error checking for existing streams:', error);
    }
    
    // Return a combined cleanup function
    return () => {
      console.log('Running audio stream cleanup functions');
      cleanupFunctions.forEach(fn => {
        try {
          fn();
        } catch (err) {
          console.error('Error in cleanup function:', err);
        }
      });
      
      // Additional cleanup
      if (audioElement) {
        try {
          audioElement.pause();
          audioElement.srcObject = null;
        } catch (err) {
          console.error('Error cleaning up audio element:', err);
        }
      }
    };
  } catch (error) {
    console.error('Unexpected error in addStreamToAudio:', error);
  }
  
  return undefined;
};

// Bật/tắt microphone với xử lý lỗi cải tiến
export const toggleMicrophone = (session: any, enable: boolean): boolean => {
  if (!session) {
    console.warn('No session provided to toggle microphone');
    return false;
  }
  
  if (!session.sessionDescriptionHandler) {
    console.warn('No sessionDescriptionHandler available to toggle microphone');
    return false;
  }
  
  const pc = session.sessionDescriptionHandler.peerConnection;
  if (!pc) {
    console.warn('No peer connection available to toggle microphone');
    return false;
  }
  
  let success = false;
  
  try {
    // Sử dụng RTCRtpSender để tìm và xử lý audio track
    const senders = pc.getSenders();
    if (!senders || senders.length === 0) {
      console.warn('No RTP senders found');
      return false;
    }
    
    let audioTrackFound = false;
    
    senders.forEach((sender: RTCRtpSender) => {
      if (sender.track && sender.track.kind === 'audio') {
        audioTrackFound = true;
        
        try {
          sender.track.enabled = enable;
          success = true;
          console.log(`Microphone ${enable ? 'enabled' : 'disabled'}`);
        } catch (trackError) {
          console.error(`Error ${enable ? 'enabling' : 'disabling'} audio track:`, trackError);
        }
      }
    });
    
    if (!audioTrackFound) {
      console.warn('No audio tracks found to toggle');
    }
  } catch (error) {
    console.error(`Error ${enable ? 'enabling' : 'disabling'} microphone:`, error);
  }
  
  return success;
};

// Bật/tắt âm thanh (speaker) với xử lý lỗi cải tiến
export const toggleAudio = (session: any, audioElement: HTMLAudioElement | null, enable: boolean): boolean => {
  let success = false;
  
  // Method 1: Disable audio tracks in RTCRtpReceiver
  if (session && session.sessionDescriptionHandler) {
    const pc = session.sessionDescriptionHandler.peerConnection;
    if (pc) {
      try {
        const receivers = pc.getReceivers();
        if (!receivers || receivers.length === 0) {
          console.warn('No RTP receivers found');
        } else {
          let audioTrackFound = false;
          
          receivers.forEach((receiver: RTCRtpReceiver) => {
            if (receiver.track && receiver.track.kind === 'audio') {
              audioTrackFound = true;
              
              try {
                receiver.track.enabled = enable;
                success = true;
              } catch (trackError) {
                console.error(`Error ${enable ? 'enabling' : 'disabling'} receiver track:`, trackError);
              }
            }
          });
          
          if (!audioTrackFound) {
            console.warn('No audio receiver tracks found to toggle');
          }
        }
      } catch (error) {
        console.error(`Error ${enable ? 'unmuting' : 'muting'} audio through receivers:`, error);
      }
    }
  }
  
  // Method 2: Mute the audio element directly (more reliable)
  if (audioElement) {
    try {
      audioElement.muted = !enable;
      
      // Additionally try to set volume
      if (enable) {
        audioElement.volume = 1.0;
      } else {
        audioElement.volume = 0.0;
      }
      
      success = true;
    } catch (error) {
      console.error(`Error ${enable ? 'unmuting' : 'muting'} audio element:`, error);
    }
  } else {
    console.warn('No audio element provided to toggle audio');
  }
  
  console.log(`Audio ${enable ? 'unmuted' : 'muted'} (success: ${success})`);
  return success;
};

// Tạo và cấu hình ringtone với xử lý lỗi
export const createRingtone = (src: string): HTMLAudioElement | null => {
  if (!src) {
    console.error('No source provided for ringtone');
    return null;
  }
  
  try {
    const ringtone = new Audio(src);
    ringtone.loop = true;
    ringtone.volume = 0.7; // Giảm âm lượng để không quá to
    
    // Thêm xử lý lỗi cho ringtone
    ringtone.onerror = (e) => {
      console.error('Error loading ringtone:', e);
    };
    
    console.log('Ringtone audio element created');
    return ringtone;
  } catch (error) {
    console.error('Error creating ringtone:', error);
    return null;
  }
};