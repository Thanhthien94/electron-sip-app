'use client'
import React, { useEffect, useState } from 'react'
import {
  ChevronDownCircle,
  ChevronUpCircle,
  OctagonAlert,
  PhoneMissed,
  PhoneOutgoing
} from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import dayjs from 'dayjs'
import { API_URL } from '@renderer/lib/config'
import { useAuth } from '@renderer/components/ContextProvider'
import axios from 'axios'
import { toast } from 'react-toastify'

export default function CDR() {
  const { user, callState, setIsOnline, setCdrInfo } = useAuth()
  const token = user?.token
  const [keywordDetail, setKeywordDetail] = useState<any>('')
  const [listCDR, setListCDR] = useState<any>([])
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
    // gteDate: dayjs().startOf('month'),
    gteDate: '',
    lteDate: ''
  })

  const handleNext = () => {
    const newPage = paramsDetail.page + 1
    setParamsDetail({ ...paramsDetail, page: newPage })
    setIsSkeleton(true)
  }
  const handlePrev = () => {
    const newPage = paramsDetail.page - 1 || 1
    setParamsDetail({ ...paramsDetail, page: newPage })
    setIsSkeleton(true)
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
      //   setIsSkeleton(true)
      const res = await axios.request(config)
      const result = res?.data?.data
      if (result) {
        // console.log('result: ', result)
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

  useEffect(() => {
    if (token) fetchCDRs()
  }, [paramsDetail, token])

  useEffect(() => {
    if (token && (callState === 'hangup')) {
      setTimeout(() => {
        fetchCDRs()
        console.log('fetchCDRs setTimeout')
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
    <div>
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
      <div className="flex flex-col gap-3 items-center w-full overflow-y-auto h-[calc(100vh-220px)]">
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
                  {[item.dst]}
                </span>
                {/* <span>{item.disposition}</span> */}
              </div>
            )
          })}
        {isSkeleton && <SkeletonCall />}
      </div>
      <div
        data-active={count !== 0}
        className="flex flex-row gap-2 items-center text-xs mx-auto mt-2 w-fit data-[active=false]:hidden"
      >
        <span className=" bg-orange-400 p-1 px-2 rounded-full">page {paramsDetail.page}</span>
        <span>
          {count} / {totalCall}
        </span>
        <button onClick={handlePrev} className="hover:text-sky-600 text-orange-400">
          <ChevronUpCircle size={20} />
        </button>
        <button onClick={handleNext} className="hover:text-sky-600 text-orange-400">
          <ChevronDownCircle size={20} />
        </button>
      </div>
    </div>
  )
}
