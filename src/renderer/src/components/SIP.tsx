import { useState, useEffect } from 'react'
import { useAuth } from './ContextProvider'
import {
  PhoneOutgoing,
  PhoneCall,
  Phone,
  Rewind,
  FastForward,
  Volume1,
  Volume2,
  Play,
  Pause
} from 'lucide-react'
import { formatTime, time, formatDate } from '@renderer/lib/moment'

// import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { Button } from './ui/button'

export const SIP = () => {
  const { makeCall, endCall, callState, callDuration, cdrInfo } = useAuth()
  const [destination, setDestination] = useState<any>('')
  const [record, setRecord] = useState<string>('')
  const [duration, setDuration] = useState<Number>(0)

  useEffect(() => {
    if (callState === 'hangup' || callState === 'ringing') setDestination('')
  }, [callState])

  useEffect(() => {
    // console.log('cdrInfo: ', cdrInfo)
    setRecord(cdrInfo?.record as string)
    setDuration(Number(cdrInfo?.duration) as number)
  }, [cdrInfo])

  /*************  ✨ Codeium Command ⭐  *************/
  /**
   * Component to play audio from a given URL.
   *
   * @param {{url: string, name: string}} props
   * @param {string} props.url URL of the audio file
   * @param {string} props.name Name of the caller
   * @returns {JSX.Element}
   */
  /******  8a63cb5d-20cf-4be6-bbf2-a6c04eea77bf  *******/
  const PlayAudio = () => {
    const [audio, setAudio] = useState<any>('')
    const [name, setName] = useState<any>('')
    const [volume, setVolume] = useState(0.8)
    const [duration, setDuration] = useState(0)
    const [current, setCurrent] = useState<number>(0)
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(1)
    const [anchorEl, setAnchorEl] = useState<any>(null)
    const [play, setPlay] = useState<boolean>(false)

    const [position, setPosition] = useState(0)
    const [paused, setPaused] = useState(true)
    function formatDuration(value: number) {
      const minute = Math.floor(value / 60)
      const secondLeft = value - minute * 60
      return `${minute}:${secondLeft < 10 ? `0${secondLeft}` : secondLeft}`
    }

    const playAudio = () => {
      if (audio) {
        audio.play()
        setPaused(false)
      }
    }

    const pauseAudio = () => {
      if (audio) {
        audio.pause()
        setPaused(true)
      }
    }

    useEffect(() => {
      if (record) {
        // console.log('audio: ', record)
        pauseAudio()
        setAudio(
          new Audio(
            record
          )
        )
        setPosition(0)
        setDuration(Number(cdrInfo?.billSec))
        setPlaybackSpeed(1)
      }
      // console.log("audio: ", record);
    }, [record])

    useEffect(() => {
      if (audio) {
        const updateTime = () => {
          setPosition(Math.floor(audio.currentTime))
          setDuration(Math.floor(audio.duration))
          if (Number(audio.currentTime) >= duration) setPaused(true)
        }
        audio.addEventListener('timeupdate', updateTime)
        // console.log("duration: ", audio.duration);
        return () => {
          audio.removeEventListener('timeupdate', updateTime)
        }
      }
    }, [audio])

    const handleVolumeChange = (event: any) => {
      const newVolume = event.target.value
      setVolume(newVolume)
      if (audio) {
        audio.volume = newVolume
      }
    }

    const handleSeek = (v: any) => {
      const seekTime = v
      audio.currentTime = seekTime
    }

    const handlePlaybackSpeedChange = (speed: any) => {
      setPlaybackSpeed(speed)
      audio.playbackRate = speed
      setAnchorEl(null)
    }

    const handleMenuOpen = (event: any) => {
      setAnchorEl(event.currentTarget)
    }
    const downloadAudio = () => {
      fetch(record)
        .then((response) => response.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          const split = cdrInfo?.record.split('/') || []
          link.href = url
          link.download = split[split.length - 1]
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        })
        .catch((error) => console.error('Error downloading audio:', error))
    }

    return (
      <div data-active={!record} className='px-10 data-[active=true]:hidden'>
        <Slider
          aria-label="time-indicator"
          defaultValue={[position]}
          min={0}
          step={1}
          max={duration}
          onChange={(value) => {
            // setPosition(value as number)
            handleSeek(value)
          }}
        />
        <div className="flex justify-between items-center text-xs mt-2">
          <span>{formatDuration(position)}</span>
          <span>{formatDuration(duration - position)}</span>
        </div>
        <div className="flex justify-center items-center gap-2">
          <Button aria-label="previous song">
            <Rewind fontSize="large" />
          </Button>
          <Button
            aria-label={paused ? 'play' : 'pause'}
            onClick={() => {
              setPaused(!paused)
              if (paused) {
                playAudio()
              } else {
                pauseAudio()
              }
            }}
          >
            {paused ? <Play /> : <Pause />}
          </Button>
          <Button aria-label="next song">
            <FastForward fontSize="large" />
          </Button>
        </div>
        {/* <div>
          <Volume1 />
          <Slider
            aria-label="Volume"
            min={0}
            max={1}
            step={0.01}
            value={[Number(volume)]}
            onChange={handleVolumeChange}
          />
          <Volume2 />
          <Button onClick={downloadAudio} color="inherit">
            Download
          </Button>
          <Button
            onClick={handleMenuOpen}
            color="inherit"
            aria-controls="speed-menu-"
            aria-haspopup="true"
          >
            {playbackSpeed}x
          </Button>
        </div> */}
      </div>
    )
  }

  const typeDisposition = {
      'ANSWERED': 'Nghe máy',
      'BUSY': 'Bận',
      'NO ANSWER': 'Không nghe máy',
      'FAILED': 'Gọi thất bại'
  }

  return (
    <>
      <div className="flex flex-col w-full h-full gap-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nhập số -- Enter để gọi"
            className="px-3 py-1 rounded-md border-[0.5px] border-dotted border-amber-400 bg-neutral-500/20"
            value={destination}
            onChange={(e: any) => {
              setDestination(e.target.value)
            }}
            onKeyDown={(e: any) => {
              e.key === 'Enter' && makeCall(destination, '')
            }}
          />
          <button
            data-active={
              destination !== '' ||
              (callState !== 'ringing' &&
                callState !== 'hangup' &&
                callState !== 'answered' &&
                callState !== '')
            }
            className="font-thin text-green-600 hover:text-green-400 p-1 px-3 rounded-full data-[active=false]:hidden"
            onClick={() => {
              makeCall(destination, '')
              // console.log('...calling')
            }}
          >
            <Phone />
          </button>
          <button
            data-active={callState !== 'ringing' && callState !== 'answered'}
            className="border-[0.5px] border-dashed p-1 px-3 text-yellow-100 font-thin rounded-full hover:bg-orange-200 hover:text-black data-[active=true]:hidden"
            onClick={endCall}
          >
            Gác máy
          </button>
          <span
            data-active={callState === 'ringing'}
            className="relative flex h-5 w-5 justify-center items-center data-[active=false]:hidden"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 text-sky-600">
              <PhoneOutgoing />
            </span>
            <span className="relative inline-flex h-5 w-5 text-sky-400">
              <PhoneOutgoing />
            </span>
          </span>
          <span
            data-active={callState === 'answered'}
            className="relative flex h-5 w-5 justify-center items-center data-[active=false]:hidden"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 text-sky-600">
              <PhoneCall />
            </span>
            <span className="relative inline-flex h-5 w-5 text-sky-400">
              <PhoneCall />
            </span>
          </span>
          <span className="text-sky-400">{callState === 'ringing' && 'Đang kết nối...'}</span>
          <span className="text-red-400">{callState === 'answered' && callDuration}</span>
        </div>
        <div
          data-active={cdrInfo !== null}
          className="flex flex-col gap-2 mt-5 data-[active=false]:hidden"
        >
          <div className="flex gap-2">
            <span>Người gọi</span>
            <span className="text-red-500 font-bold">{cdrInfo?.from_name}</span>
          </div>
          <span className="font-thin">Số nội bộ: {cdrInfo?.from_num}</span>
          <div
            data-active={cdrInfo?.to_name !== ''}
            className="flex gap-2 data-[active=false]:hidden"
          >
            <span className="font-thin">Gọi đến</span>
            <span className="text-red-500 font-bold">{cdrInfo?.to_name}</span>
          </div>
          <div className="flex gap-2">
            <span
              data-active={cdrInfo?.to_name !== ''}
              className="font-thin data-[active=true]:hidden"
            >
              Gọi đến
            </span>
            <span className="font-thin">{cdrInfo?.to_num}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-thin">Thực hiện:</span>
            <span className="font-thin">{formatDate(cdrInfo?.created_at as Date)}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-thin">Trạng thái</span>
            <span className="font-thin">{typeDisposition[cdrInfo?.disposition as string]}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-thin">Đàm thoại</span>
            <span className="font-thin">{time(Number(cdrInfo?.duration))}</span>
          </div>
        </div>
        <PlayAudio />
      </div>
    </>
  )
}
