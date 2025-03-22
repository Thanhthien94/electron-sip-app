import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Rewind, FastForward, Play, Pause, Download, Volume2, Volume, VolumeX, RotateCcw } from 'lucide-react'

interface AudioPlayerProps {
  record: string
  duration: number
}

export const AudioPlayer = ({ record, duration }: AudioPlayerProps) => {
  // Audio element refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Player state
  const [position, setPosition] = useState<number>(0)
  const [audioDuration, setAudioDuration] = useState<number>(duration || 0)
  const [isPaused, setIsPaused] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [volume, setVolume] = useState<number>(0.8)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1)
  
  // Update interval ref to avoid memory leaks
  const updateIntervalRef = useRef<number | null>(null)

  // Create a new audio element when the record URL changes
  useEffect(() => {
    // Cleanup previous audio and interval
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    
    if (updateIntervalRef.current) {
      window.clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }
    
    setIsLoading(true)
    setLoadError(null)
    setPosition(0)
    setIsPaused(true)
    
    if (record) {
      try {
        // Create new audio element
        const audio = new Audio(record)
        
        // Set initial properties
        audio.volume = volume
        audio.playbackRate = playbackSpeed
        audio.muted = isMuted
        
        // Set up event listeners
        const handleCanPlay = () => {
          setIsLoading(false)
          // Update duration if available, otherwise use the provided duration
          if (audio.duration && !isNaN(audio.duration)) {
            setAudioDuration(Math.floor(audio.duration))
          } else if (duration) {
            setAudioDuration(duration)
          }
        }
        
        const handleError = (e: ErrorEvent) => {
          console.error('Error loading audio:', e)
          setIsLoading(false)
          setLoadError('Không thể tải file audio. Vui lòng thử lại sau.')
        }
        
        const handleEnded = () => {
          setIsPaused(true)
          setPosition(0)
          // Stop the update interval
          if (updateIntervalRef.current) {
            window.clearInterval(updateIntervalRef.current)
            updateIntervalRef.current = null
          }
        }
        
        audio.addEventListener('canplay', handleCanPlay)
        audio.addEventListener('error', handleError as EventListener)
        audio.addEventListener('ended', handleEnded)
        
        // Store the audio element in the ref
        audioRef.current = audio
        
        // Start loading the audio
        audio.load()
        
        // Cleanup event listeners on unmount
        return () => {
          audio.removeEventListener('canplay', handleCanPlay)
          audio.removeEventListener('error', handleError as EventListener)
          audio.removeEventListener('ended', handleEnded)
          audio.pause()
          audio.src = ''
          
          if (updateIntervalRef.current) {
            window.clearInterval(updateIntervalRef.current)
            updateIntervalRef.current = null
          }
        }
      } catch (error) {
        console.error('Error creating audio element:', error)
        setIsLoading(false)
        setLoadError('Không thể khởi tạo trình phát audio.')
      }
    }
  }, [record, duration])
  
  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])
  
  // Update muted state when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted
    }
  }, [isMuted])
  
  // Update playback speed when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed
    }
  }, [playbackSpeed])
  
  // Format time for display (MM:SS)
  const formatDuration = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}`
  }, [])
  
  // Play/pause controls
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return
    
    if (isPaused) {
      // Play
      const playPromise = audioRef.current.play()
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPaused(false)
            
            // Start position update interval
            if (updateIntervalRef.current) {
              window.clearInterval(updateIntervalRef.current)
            }
            
            updateIntervalRef.current = window.setInterval(() => {
              if (audioRef.current) {
                setPosition(Math.floor(audioRef.current.currentTime))
              }
            }, 100) // Update more frequently for smoother slider movement
          })
          .catch((error) => {
            console.error('Error playing audio:', error)
            
            // Try again after user interaction
            const resumeAudio = () => {
              if (audioRef.current) {
                audioRef.current.play()
                  .then(() => {
                    setIsPaused(false)
                  })
                  .catch((e) => {
                    console.error('Still failed to play audio:', e)
                  })
              }
            }
            
            // Add a one-time click listener to the document
            document.addEventListener('click', resumeAudio, { once: true })
          })
      }
    } else {
      // Pause
      audioRef.current.pause()
      setIsPaused(true)
      
      // Clear the update interval
      if (updateIntervalRef.current) {
        window.clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    }
  }, [isPaused])
  
  // Handle seeking
  const handleSeek = useCallback((value: number[]) => {
    if (!audioRef.current) return
    
    const newPosition = value[0]
    audioRef.current.currentTime = newPosition
    setPosition(newPosition)
  }, [])
  
  // Skip backward/forward
  const skipBackward = useCallback(() => {
    if (!audioRef.current) return
    
    const newPosition = Math.max(0, position - 10)
    audioRef.current.currentTime = newPosition
    setPosition(newPosition)
  }, [position])
  
  const skipForward = useCallback(() => {
    if (!audioRef.current) return
    
    const newPosition = Math.min(audioDuration, position + 10)
    audioRef.current.currentTime = newPosition
    setPosition(newPosition)
  }, [position, audioDuration])
  
  // Reset to beginning
  const resetAudio = useCallback(() => {
    if (!audioRef.current) return
    
    audioRef.current.currentTime = 0
    setPosition(0)
  }, [])
  
  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])
  
  // Download recording
  const downloadAudio = useCallback(() => {
    if (!record) return
    
    try {
      fetch(record)
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          const filename = record.split('/').pop() || 'recording.mp3'
          
          link.href = url
          link.download = filename
          document.body.appendChild(link)
          link.click()
          
          // Cleanup
          setTimeout(() => {
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
          }, 100)
        })
        .catch(error => {
          console.error('Error downloading audio:', error)
        })
    } catch (error) {
      console.error('Error initiating download:', error)
    }
  }, [record])
  
  // If no record URL, don't render anything
  if (!record) return null
  
  // Render the audio player
  return (
    <div className="px-4 py-6 bg-neutral-800/30 rounded-lg mt-4 audio-player">
      <h3 className="text-sm font-medium mb-4 text-orange-300">Bản ghi cuộc gọi</h3>
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-orange-500"></div>
          <span className="ml-2 text-sm text-gray-400">Đang tải...</span>
        </div>
      )}
      
      {/* Error state */}
      {loadError && (
        <div className="text-red-400 text-sm text-center py-4">
          {loadError}
        </div>
      )}
      
      {/* Audio player controls - only show when not loading and no error */}
      {!isLoading && !loadError && (
        <>
          {/* Progress slider */}
          <Slider
            value={[position]}
            min={0}
            step={1}
            max={audioDuration}
            onValueChange={handleSeek}
            className="mb-2"
            disabled={isLoading}
          />
          
          {/* Time indicators */}
          <div className="flex justify-between items-center text-xs mb-4">
            <span>{formatDuration(position)}</span>
            <span>{formatDuration(audioDuration - position)}</span>
          </div>
          
          {/* Playback controls */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAudio}
              title="Quay về đầu"
              className="text-gray-400 hover:text-white"
              disabled={isLoading || position === 0}
            >
              <RotateCcw size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={skipBackward}
              title="Lùi 10 giây"
              className="text-gray-400 hover:text-white"
              disabled={isLoading || position <= 0}
            >
              <Rewind size={18} />
            </Button>
            
            <Button
              variant={isPaused ? 'default' : 'secondary'}
              size="sm"
              onClick={togglePlayPause}
              className={`rounded-full p-2 ${isPaused ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-700'}`}
              disabled={isLoading}
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={skipForward}
              title="Tiến 10 giây"
              className="text-gray-400 hover:text-white"
              disabled={isLoading || position >= audioDuration}
            >
              <FastForward size={18} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadAudio}
              title="Tải xuống"
              className="text-gray-400 hover:text-white"
              disabled={isLoading}
            >
              <Download size={16} />
            </Button>
          </div>
          
          {/* Bottom controls */}
          <div className="flex justify-between items-center">
            {/* Volume control */}
            <div className="flex items-center gap-2 w-1/3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-8 w-8"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX size={16} className="text-red-500" />
                ) : volume > 0.5 ? (
                  <Volume2 size={16} className="text-gray-400" />
                ) : (
                  <Volume size={16} className="text-gray-400" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => setVolume(value[0])}
                disabled={isLoading}
                className="w-24"
              />
            </div>
            
            {/* Playback speed */}
            <div className="flex gap-2">
              {[0.5, 1, 1.5, 2].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`text-xs px-2 py-1 rounded ${
                    playbackSpeed === speed
                      ? 'bg-orange-500/80 text-white'
                      : 'bg-neutral-700/50 text-gray-300 hover:bg-neutral-700'
                  }`}
                  disabled={isLoading}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}