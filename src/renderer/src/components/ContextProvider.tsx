'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction
} from 'react'
import axios from 'axios'
import { AUTH_URL } from '@/lib/config'
import { toast } from 'react-toastify'
import { toastOptions } from '@/lib/toast'
import { getItem, saveItem, clearLocalStorage } from '@/store/LocalStorage'

import JsSIP from 'jssip'
import Dialog from './Dialog'
import debug from 'debug'
import { stat } from 'fs'

debug.enable('JsSIP:*')
// debug.enable('JsSIP:RTCSession');

const ringtoneSrc = '/audio/original-phone-ringtone-36558.mp3'

interface Props {
  children: ReactNode
}

// Định nghĩa kiểu dữ liệu cho người dùng
interface User {
  username: string
  firstname: string
  lastname: string
  email: string
  phone: string
  refreshToken: string
  token: string
}
interface DataLogin {
  username: string
  password: string
}

interface CDRInfo {
  from_num: string
  to_num: string
  from_name: string
  to_name: string
  duration: string
  billSec: string
  disposition: string
  record: string
  created_at: Date
}

// Định nghĩa kiểu dữ liệu cho AuthContext
interface AuthContextType {
  user: User | null
  cdrInfo: CDRInfo | null
  login: (username: string, password: string) => void
  logout: () => void
  makeCall: (dst: string, name: string) => void
  endCall: () => void
  acceptCall: () => void
  handleHold: () => void
  handleOpenPhone: () => void
  handleDisableMic: () => void
  handleMuteAudio: () => void
  setIsOnline: Dispatch<SetStateAction<boolean>>
  setCdrInfo: Dispatch<SetStateAction<CDRInfo | null>>
  callState: string
  statusCode: number | null
  incommingId: string
  callDuration: string
  isOpenPhone: boolean
  isDisableMic: boolean
  isMuteAudio: boolean
  isHold: boolean
  isOnline: boolean
}

// Tạo AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Tạo AuthProvider
export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [dataLogin, setDataLogin] = useState<DataLogin | null>(null)
  const [cdrInfo, setCdrInfo] = useState<CDRInfo | null>(null)

  const [incommingId, setIncommingId] = useState<string>('')
  const [session, setSession] = useState<any>(null)
  // const [coolPhone, setCoolphone] = useState<any>(null)
  const [remoteAudio, setRemoteAudio] = useState<any>(null)
  const [extension, setExtension] = useState<any>('1111')
  const [displayName, setDisplayName] = useState<any>('')
  const [userPw, setUserPw] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('1111')
  const [sipServer, setSipServer] = useState<string>('')
  const [wsHost, setWsHost] = useState<string>('ws://103.27.238.195:8088/ws')
  // const [wsPort, setWsPort] = useState<string>('')
  const [callDuration, setCallDuration] = React.useState<string>('')
  const [callState, setCallState] = React.useState<string>('')
  const [statusCode, setStatusCode] = React.useState<number | null>(null)
  // const [openOutGoing, setOpenOutGoing] = React.useState(false)
  // const [openInComming, setOpenInComming] = React.useState(false)
  const [isOpenPhone, setIsOpenPhone] = React.useState<boolean>(false)
  const [isDisableMic, setIsDisableMic] = React.useState<boolean>(false)
  const [isMuteAudio, setIsMuteAudio] = React.useState<boolean>(false)
  const [isHold, setIsHold] = React.useState<boolean>(false)
  const [openDialog, setOpenDialog] = React.useState<boolean>(false)
  const [isOnline, setIsOnline] = React.useState<boolean>(false)
  let intervalId: any
  let coolPhone: any

  useEffect(() => {
    const fetchSIP = async () => {
      // console.log("user: ", user);
      const config = {
        method: 'get',
        url: `${AUTH_URL}/user/sip?_id=${getItem('SIPID')}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getItem('TOKEN')}`
        }
      }
      try {
        await axios.request(config).then((res) => {
          const data = res.data.data
          if (data) {
            setExtension(data[0]?.extension)
            setPassword(data[0]?.password)
            setSipServer(data[0]?.pbx?.host)
            setWsHost(data[0]?.pbx?.WsHost)
            // setWsPort(data[0]?.pbx?.WsPort)
            setDisplayName(`${getItem('FIRSTNAME')} ${getItem('LASTNAME')}`)
          }
          setIsOnline(true)
          // toast.success(res?.data.message, toastOptions);
          console.log('data: ', res.data)
        })
      } catch (error: any) {
        if (error?.response?.status === 403) setOpenDialog(true)
        console.error('Error fetching sip:', error)
        clearLocalStorage()
        setOpenDialog(true)
        setIsOnline(false)
        // toast.error(error.response?.data.message, toastOptions);
      }
    }

    const fetchUser = async () => {
      console.log('user: ', user)
      const configLogin = {
        method: 'post',
        url: `${AUTH_URL}/login`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify(dataLogin)
      }
      try {
        console.log('first')
        await axios.request(configLogin).then((res) => {
          const data = res.data.data
          setUser(data)
          setDataLogin(null)
          setOpenDialog(false)
          // fetchSIP()
          toast.success(res?.data.message, toastOptions)
          // console.log("data: ", res.data);
          saveItem({
            USERNAME: data.username || '',
            USERID: data._id || '',
            SIPID: data.sip || '',
            TOKEN: data.token || '',
            RETOKEN: data.refreshToken || '',
            PHONE: data.phone || '',
            EMAIL: data.email || '',
            FIRSTNAME: data.firstname || '',
            LASTNAME: data.lastname || '',
            ROLE: data.role.map((item: any) => item.name) || ''
          })
          // router.push("/");
          console.log('handle login success')
        })
      } catch (error: any) {
        console.error('Error fetching user:', error)
        toast.error(error.response?.data.message, toastOptions)
      }
    }

    if (dataLogin) fetchUser()
    if (getItem('TOKEN') && getItem('SIPID')) fetchSIP()
    if (!getItem('TOKEN')) setOpenDialog(true)
  }, [dataLogin])

  useEffect(() => {
    const fetchIp = async () => {
      await fetch('https://api.ipify.org?format=json')
        .then((response) => response.json())
        .then((data) => console.log('data: ', data))
        .catch((error) => console.log(error))
    }
    fetchIp()
  }, [])

  useEffect(() => {
    setUser({
      username: getItem('USERNAME'),
      firstname: getItem('FIRSTNAME'),
      lastname: getItem('LASTNAME'),
      email: getItem('EMAIL'),
      phone: getItem('PHONE'),
      refreshToken: getItem('RETOKEN'),
      token: getItem('TOKEN')
    })
  }, [])

  useEffect(() => {
    if (isDisableMic) {
      disableMicrophone(session)
    } else {
      enableMicrophone(session)
    }
  }, [isDisableMic])

  useEffect(() => {
    if (isMuteAudio) {
      muteAudio(session)
    } else {
      unmuteAudio(session)
    }
  }, [isMuteAudio])

  useEffect(() => {
    if (isHold) {
      hold()
    } else {
      unhold()
    }
  }, [isHold])
  // Count time in calling
  function countTime(startTime: any) {
    // Lấy thời điểm hiện tại
    const now = new Date()

    // Tính số giây đã trôi qua
    const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)

    // Tính số phút và giây
    const minutes = Math.floor(elapsedSeconds / 60)
    const seconds = elapsedSeconds % 60

    // Trả về thời gian dưới dạng chuỗi
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  function disableMicrophone(session: any) {
    if (session && session.sessionDescriptionHandler) {
      const pc = session.sessionDescriptionHandler.peerConnection
      if (pc) {
        pc.getSenders().forEach((sender: any) => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = false
          }
        })
      }
    }
  }

  function enableMicrophone(session: any) {
    if (session && session.sessionDescriptionHandler) {
      const pc = session.sessionDescriptionHandler.peerConnection
      if (pc) {
        pc.getSenders().forEach((sender: any) => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = true
          }
        })
      }
    }
  }

  function muteAudio(session: any) {
    if (session && session.sessionDescriptionHandler) {
      const pc = session.sessionDescriptionHandler.peerConnection
      if (pc) {
        pc.getReceivers().forEach((receiver: any) => {
          if (receiver.track && receiver.track.kind === 'audio') {
            receiver.track.enabled = false
          }
        })
      }
    }
  }

  function unmuteAudio(session: any) {
    if (session && session.sessionDescriptionHandler) {
      const pc = session.sessionDescriptionHandler.peerConnection
      if (pc) {
        pc.getReceivers().forEach((receiver: any) => {
          if (receiver.track && receiver.track.kind === 'audio') {
            receiver.track.enabled = true
          }
        })
      }
    }
  }

  function add_stream() {
    if (sessionjs && sessionjs.connection) {
      const handleAddStream = (e: any) => {
        remoteAudio.srcObject = e.stream
      }

      sessionjs.connection.addEventListener('addstream', handleAddStream)

      // Cleanup function to remove the event listener when the session ends
      return () => {
        sessionjs.connection.removeEventListener('addstream', handleAddStream)
        remoteAudio.srcObject = null
      }
    }
    // Return undefined or null if the condition is not met
    return undefined
  }

  // Gọi hàm để khởi tạo cuộc gọi tới số cụ thể
  function hold() {
    session?.hold()
  }
  function unhold() {
    session?.unhold()
  }

  const handleHold = () => {
    setIsHold(!isHold)
    return !isHold
  }

  function resetCall() {
    if (intervalId) clearInterval(intervalId)
    setCallDuration('')
    // setOpenOutGoing(false)
    // setOpenInComming(false)
  }

  const socket = new JsSIP.WebSocketInterface(wsHost)
  // socket.via_transport = "ws";
  const configuration = {
    sockets: [socket],
    uri: `sip:${extension}@${sipServer}`,
    password: password,
    display_name: displayName,
    hack_ip_in_contact: true,
    no_answer_timeout: 45
  }
  let sessionjs: any
  const initCoolPhone = () => {
    const newRemoteAudio = new window.Audio()
    newRemoteAudio.autoplay = true
    setRemoteAudio(newRemoteAudio)
    coolPhone = new JsSIP.UA(configuration)
    coolPhone.start()
    coolPhone.register()
    coolPhone?.on('newRTCSession', coolPhoneAction)
    console.log('coolPhone: ', coolPhone)
  }
  useEffect(() => {
    if (sipServer) {
      initCoolPhone()
      // setCoolphone(newCoolPhone)
    }
  }, [sipServer])

  useEffect(() => {
    if (callState === 'hangup') {
      if(statusCode === 200) {
        toast.success('Cuộc gọi kết thúc', toastOptions)
      } else {
        toast.error(`Cuộc gọi kết thúc - SIP code: ${statusCode}`, toastOptions)
      }
    }
  }, [callState])

  useEffect(() => {
    console.log('coolPhone: ', coolPhone)
  }, [coolPhone])

  function coolPhoneAction(ev: any) {
    const newSession = ev.session

    if (sessionjs) {
      // hangup any existing call
      sessionjs.terminate()
    }
    sessionjs = newSession
    const completeSession = function (data: any) {
      const cause = data.cause // Nguyên nhân kết thúc (lý do)
      const statusCode = data.message?.status_code // Mã SIP cuối cùng
      setStatusCode(statusCode)
      console.log(`Call ended with cause data: ${JSON.stringify(data)}`)
      console.log(`Call ended with cause: ${cause}, SIP code: ${statusCode}`)
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
      sessionjs = null
      resetCall()
      setCallState('hangup')
    }

    if (sessionjs.direction === 'outgoing') {
      console.log('stream outgoing  -------->')
      sessionjs.on('connecting', function () {
        console.log('CONNECT')
        // setOpenOutGoing(true)
        setSession(sessionjs)
        setCallState('ringing')
      })
      sessionjs.on('peerconnection', function (e: any) {
        console.log('1accepted: ', e)
      })
      sessionjs.on('ended', completeSession)
      sessionjs.on('failed', completeSession)
      sessionjs.on('accepted', function (e: any) {
        console.log('accepted: ', e)
        setCallState('answered')
        const startTime = new Date() // Thời điểm bắt đầu
        intervalId = setInterval(() => {
          const currentTime = countTime(startTime)
          setCallDuration(currentTime) // Hiển thị thời gian tính được
        }, 1000)
      })
      sessionjs.on('confirmed', function (e: any) {
        console.log('CONFIRM STREAM: ', e)
      })
    }

    if (sessionjs.direction === 'incoming') {
      console.log('stream incoming  -------->')
      sessionjs.on('connecting', function (e: any) {
        console.log('CONNECT: ', e)
      })
      sessionjs.on('peerconnection', function (e: any) {
        console.log('1accepted: ', e)
        add_stream()
      })
      sessionjs.on('ended', completeSession)
      sessionjs.on('failed', completeSession)
      sessionjs.on('accepted', function (e: any) {
        console.log('accepted: ', e)
        setCallState('answered')
        const startTime = new Date() // Thời điểm bắt đầu
        intervalId = setInterval(() => {
          const currentTime = countTime(startTime)
          setCallDuration(currentTime) // Hiển thị thời gian tính được
        }, 1000)
      })
      sessionjs.on('confirmed', function (e: any) {
        console.log('CONFIRM STREAM: ', e)
      })

      // console.log("Incoming Call: ", sessionjs);
      setSession(sessionjs)
      // setOpenInComming(true)
      setCallState('ringing')
      setIncommingId(sessionjs._request.from._uri._user)
      const ringtone = new Audio(ringtoneSrc)
      ringtone.play()
    }
  }

  const makeCall = (numTels: string) => {
    if (!coolPhone) initCoolPhone()
    const options = {
      mediaConstraints: { audio: true, video: false },
      pcConfig: {
        iceServers: [
          // { urls: 'stun:stun.l.google.com:19302' }
        ],
        iceTransportPolicy: 'all',
        bundlePolicy: 'balanced',
        rtcpMuxPolicy: 'require',
        iceCandidatePoolSize: 2,
        sdpSemantics: 'unified-plan'
      }
    }
    const numTel = numTels.toString()
    coolPhone?.call(numTel, options)
    add_stream()
  }

  const acceptCall = () => {
    const options = {
      mediaConstraints: { audio: true, video: true },
      pcConfig: {
        rtcpMuxPolicy: 'require',
        iceServers: []
      }
    }
    session?.answer(options)
  }

  function endCall() {
    session.terminate()
  }

  const handleOpenPhone = () => {
    setIsOpenPhone(!isOpenPhone)
    return !isOpenPhone
  }

  const handleDisableMic = () => {
    setIsDisableMic(!isDisableMic)
    return !isDisableMic
  }

  const handleMuteAudio = () => {
    setIsMuteAudio(!isMuteAudio)
    return !isMuteAudio
  }

  const login = (username: string, password: string) => {
    setDataLogin({ username, password })
  }

  const logout = () => {
    setUser(null)
    clearLocalStorage()
    setIsOpenPhone(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        cdrInfo,
        login,
        logout,
        makeCall,
        endCall,
        handleHold,
        handleOpenPhone,
        handleDisableMic,
        handleMuteAudio,
        acceptCall,
        setIsOnline,
        setCdrInfo,
        incommingId,
        callDuration,
        isOnline,
        isOpenPhone,
        isDisableMic,
        isMuteAudio,
        callState,
        statusCode,
        isHold
      }}
    >
      <Dialog
        isOpen={openDialog}
        onClose={() => {
          if (isOnline) {
            setOpenDialog(false)
          } else {
            toast.warning('Vui lòng đăng nhập', toastOptions)
          }
        }}
        className="p-2"
      >
        <div className="flex flex-col gap-2 w-[300px]">
          <input
            type="text"
            placeholder="Email hoặc tên đăng nhập"
            className="w-full p-2 rounded-md"
            onChange={(e: any) => setUsername(e.target.value)}
            onKeyDown={(e: any) => {
              e.key === 'Enter' && setDataLogin({ username, password: userPw })
            }}
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            className="w-full p-2 rounded-md"
            onChange={(e: any) => setUserPw(e.target.value)}
            onKeyDown={(e: any) => {
              e.key === 'Enter' && setDataLogin({ username, password: userPw })
            }}
          />
          <button onClick={() => setDataLogin({ username, password: userPw })}>Đăng nhập</button>
        </div>
      </Dialog>
      <div className={`${openDialog ? 'hidden' : ''}`}>{children}</div>
    </AuthContext.Provider>
  )
}

// Tạo một hook để sử dụng trong các components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
