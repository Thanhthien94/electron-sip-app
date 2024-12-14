import React, { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { clearLocalStorage } from '@/store/LocalStorage'
import {
  Power,
  PhoneOutgoing,
  PhoneMissed,
  OctagonAlert,
  ChevronDownCircle,
  ChevronUpCircle
} from 'lucide-react'
import dayjs from 'dayjs'
import { API_URL } from '@renderer/lib/config'
import { useAuth } from '@renderer/components/ContextProvider'
import axios from 'axios'
import { toast } from 'react-toastify'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

interface DialogProps {
  children?: React.ReactNode
  className?: string
}

const logout = () => {
  clearLocalStorage()
  window.electron.ipcRenderer.send('logout')
}

export const Sidebar: React.FC<DialogProps> = ({ className }) => {
  const { user, callState, setIsOnline, setCdrInfo } = useAuth()
  const token = user?.token
  const [keywordDetail, setKeywordDetail] = useState<any>('')
  const [listCDR, setListCDR] = useState<any>([])
  const [listCustomer, setListCustomer] = useState<any>([])
  const [totalCall, setTotalCall] = useState<number>(0)
  const [count, setCount] = useState<number>(0)
  const [isSkeleton, setIsSkeleton] = useState<boolean>(true)
  const [timeoutStart, setTimeoutStart] = useState<any>()
  const [paramsDetail, setParamsDetail] = useState<any>({
    page: 1,
    limit: 20,
    company: '',
    telco: '',
    disposition: '',
    cnum: '',
    keyword: '',
    gteDate: dayjs().startOf('month'),
    lteDate: ''
  })
  const [paramsCustomer, setParamsCustomer] = useState<any>({
    page: 1,
    limit: 20,
    phone: '',
    keyword: ''
  })

  const handleNext = () => {
    const newPage = paramsDetail.page + 1
    setParamsDetail({ ...paramsDetail, page: newPage })
  }
  const handlePrev = () => {
    const newPage = paramsDetail.page - 1 || 1
    setParamsDetail({ ...paramsDetail, page: newPage })
  }

  const fetchCDRs = async () => {
    const config = {
      method: 'get',
      url: `${API_URL}/cdr?reverse=1&page=${paramsDetail.page}&limit=${
        paramsDetail.limit
      }&keyword=${paramsDetail.keyword}&company=${
        paramsDetail.company
      }&userTag=${paramsDetail.userTag || ''}&telco=${
        paramsDetail.telco
      }&disposition=${paramsDetail.disposition}&cnum=${
        paramsDetail.cnum
      }&gteDate=${paramsDetail.gteDate}&lteDate=${paramsDetail.lteDate}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }

    try {
      setIsSkeleton(true)
      const res = await axios.request(config)
      const result = res?.data?.data
      if (result) {
        console.log('result: ', result)
        if (result.total !== 0) {
          setListCDR(result.data)
          setTotalCall(result.analysDisposition[0]?.totalCall)
          setCount(result?.count)
          setIsSkeleton(false)
        } else {
          setListCDR([])
          setTotalCall(0)
          setIsSkeleton(true)
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 403) setIsOnline(false)
      toast.error(error?.response?.data?.message)
      console.log(error)
      setIsSkeleton(true)
    }
  }

  const fetchCustomer = async () => {
    const configGetCustomer = {
      method: 'get',
      url: `${API_URL}/crm/customer?reverse=1&page=${paramsCustomer.page}&limit=${paramsCustomer.limit}&keyword=${paramsCustomer.keyword}&phone=${paramsCustomer.phone}&project`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }
    axios
      .request(configGetCustomer)
      .then((res) => {
        const metaData = res?.data?.data?.data
        const newList = metaData.map((item: any) => {
          return { checked: false, ...item }
        })
        console.log('newList: ', newList)
        // const result = res?.data?.data
        setListCustomer(newList)
      })
      .catch((error) => {
        console.log(error)
        if (
          error?.response?.data?.message === 'jwt expired' ||
          error?.response?.data?.message === 'jwt malformed'
        ) {
          setIsOnline(false)
        }
      })
  }
  useEffect(() => {
    if (token) fetchCustomer()
  }, [paramsCustomer])

  useEffect(() => {
    if (token) fetchCDRs()
  }, [paramsDetail])

  useEffect(() => {
    if (token && (callState === 'hangup' || callState === '')) {
      setTimeout(() => {
        fetchCDRs()
      }, 5000)
    }
  }, [user, callState])

  const SkeletonCall = () => {
    return (
      <div
        data-active={isSkeleton}
        className="flex items-center space-x-2 data-[active=false]:hidden"
      >
        <Skeleton className="h-12 w-12 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-[180px]" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={twMerge(
        'flex flex-row justify-start min-h-full pt-10 overflow-y-hidden scrollbar-small',
        className
      )}
    >
      <Tabs
        defaultValue="cdr"
        className="w-[400px] border-r border-gray-400 flex flex-col items-center"
      >
        <TabsList className="grid w-[90%] grid-cols-2 gap-1 items-center justify-center bg-neutral-50/20">
          <TabsTrigger value="cdr">CDR</TabsTrigger>
          <TabsTrigger value="contact">Danh bạ</TabsTrigger>
        </TabsList>
        <TabsContent value="cdr">
          <div className="flex flex-col items-center w-full mb-2">
            <input
              value={keywordDetail}
              onChange={(e) => {
                setKeywordDetail(e.target.value)
                clearTimeout(timeoutStart)
                setTimeoutStart(
                  setTimeout(() => {
                    setParamsDetail({
                      ...paramsDetail,
                      keyword: e.target.value
                    })
                  }, 1000)
                )
              }}
              type="text"
              placeholder="Tìm số điện thoại"
              className="p-1 px-3 rounded-lg bg-transparent border border-orange-400 mx-auto w-[80%]"
            />
          </div>
          <div className="flex flex-col gap-2 items-center w-full overflow-y-auto h-[calc(100vh-220px)]">
            {!isSkeleton &&
              listCDR.map((item: any, index: number) => {
                return (
                  <div
                    key={index}
                    data-active={!isSkeleton}
                    data-bg={index % 2 === 0}
                    onClick={() => {
                      const data = {
                        from_num: item.cnum,
                        to_num: item.dst,
                        from_name: item.user?.lastname + ' ' + item.user?.firstname,
                        to_name: item.dstName || '',
                        duration: item.duration,
                        billSec: item.billsec,
                        disposition: item.disposition,
                        record: item.linkRecord || '',
                        created_at: item.createdAt
                      }
                      setCdrInfo(data)
                    }}
                    className={
                      'flex flex-row w-[75%] justify-between gap-2 items-center cursor-pointer p-2 rounded-lg data-[active=false]:hidden data-[bg=true]:bg-neutral-400/20 data-[bg=false]:bg-neutral-400/10'
                    }
                  >
                    <span
                      data-active={item.disposition === 'FAILED'}
                      className="text-red-600 data-[active=false]:hidden"
                    >
                      <OctagonAlert size={20} />
                    </span>
                    <span
                      data-active={item.disposition === 'NO ANSWER' || item.disposition === 'BUSY'}
                      className="text-red-500 data-[active=false]:hidden"
                    >
                      <PhoneMissed size={20} />
                    </span>
                    <span
                      data-active={item.disposition === 'ANSWERED'}
                      className="text-green-500 data-[active=false]:hidden"
                    >
                      <PhoneOutgoing size={20} />
                    </span>
                    <span
                      data-success={item.disposition === 'ANSWERED'}
                      data-busy={item.disposition === 'BUSY'}
                      data-noanswer={item.disposition === 'NO ANSWER'}
                      data-failed={item.disposition === 'FAILED'}
                      className="data-[success=true]:text-green-600 data-[busy=true]:text-red-600 data-[noanswer=true]:text-yellow-600 data-[failed=true]:text-red-600"
                    >
                      {item.dst}
                    </span>
                    {/* <span>{item.disposition}</span> */}
                  </div>
                )
              })}
            {isSkeleton && <SkeletonCall />}
          </div>
          <div
            data-active={count !== 0}
            className="flex flex-row gap-2 items-center mx-auto mt-2 w-fit data-[active=false]:hidden"
          >
            <span className="text-sm bg-orange-400 p-1 px-2 rounded-full">
              page {paramsDetail.page}
            </span>
            <span className="text-sm ">
              {count} / {totalCall}
            </span>
            <button onClick={handlePrev} className="hover:text-sky-600">
              <ChevronUpCircle size={20} />
            </button>
            <button onClick={handleNext} className="hover:text-sky-600">
              <ChevronDownCircle size={20} />
            </button>
          </div>
        </TabsContent>
        <TabsContent value="contact">
          <>
            <div className="h-[calc(100vh-200px)] flex flex-col">
              <div className="flex flex-col gap-2 overflow-auto h-full items-center">
                {listCustomer.map((item: any, index: number) => {
                  return (
                    <div
                      key={index}
                      data-active={!isSkeleton}
                      data-bg={index % 2 === 0}
                      onClick={() => {
                        setParamsCustomer({ ...paramsCustomer, phone: item.phone })
                      }}
                      className="flex flex-row w-[75%] justify-between gap-2 items-center cursor-pointer p-2 rounded-lg data-[active=false]:hidden data-[bg=true]:bg-neutral-400/20 data-[bg=false]:bg-neutral-400/10"
                    >
                      <span>{item.name}</span>
                      <span>{item.phone}</span>
                    </div>
                  )
                })}
              </div>
              <div
                data-active={isSkeleton}
                className="flex items-center space-x-2 data-[active=false]:hidden"
              >
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-12 w-[180px]" />
                </div>
              </div>
            </div>
          </>
        </TabsContent>
        <div className={'absolute bottom-2'}>
          <button
            onClick={logout}
            className="px-2 py-2 w-fit rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <Power size={20} />
          </button>
        </div>
      </Tabs>
      {/* <main className={'w-full p-2'}>{children}</main> */}
    </div>
  )
}
