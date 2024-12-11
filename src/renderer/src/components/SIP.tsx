import { useState, useEffect } from 'react'
import { useAuth } from './ContextProvider'
import { PhoneOutgoing, PhoneCall, Phone } from 'lucide-react'
// import ringtoneSrc from '@assets/audios/original-phone-ringtone-36558.mp3'

export const SIP = () => {
  const { makeCall, endCall, callState } = useAuth()
  const [destination, setDestination] = useState<any>('')

  useEffect(() => {
    if (callState === 'hangup' || callState === 'ringing') setDestination('')
  }, [callState])

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nhập số để gọi"
            className="px-3 py-1 rounded-md"
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
              (callState !== 'ringing' && callState !== 'hangup' && callState !== '')
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
          <span data-active={callState === 'ringing'} className="relative flex h-5 w-5 justify-center items-center data-[active=false]:hidden">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 text-sky-600">
              <PhoneOutgoing />
            </span>
            <span className="relative inline-flex h-5 w-5 text-sky-400"><PhoneOutgoing /></span>
          </span>
          <span data-active={callState === 'answered'} className="relative flex h-5 w-5 justify-center items-center data-[active=false]:hidden">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 text-sky-600">
              <PhoneCall />
            </span>
            <span className="relative inline-flex h-5 w-5 text-sky-400"><PhoneOutgoing /></span>
          </span>
        </div>
      </div>
    </>
  )
}
