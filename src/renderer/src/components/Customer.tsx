'use client'
import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { API_URL } from '@renderer/lib/config'
import { useAuth } from '@renderer/components/ContextProvider'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Skeleton } from '@/components/ui/skeleton'

export default function Customer() {
  const { user, callState, setIsOnline, setCdrInfo } = useAuth()
  const token = user?.token
  const [listCustomer, setListCustomer] = useState<any>([])
  const [isSkeleton, setIsSkeleton] = useState<boolean>(true)
  const [paramsCustomer, setParamsCustomer] = useState<any>({
    page: 1,
    limit: 20,
    phone: '',
    keyword: ''
  })

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
        setIsSkeleton(false)
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

  const SkeletonCustomer = () => {
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
      <div className="h-[calc(100vh-200px)] w-full flex flex-col items-center">
        <div className="flex flex-col gap-2 overflow-auto h-full items-center w-full">
          {listCustomer.map((item: any, index: number) => {
            return (
              <div
                key={index}
                data-active={!isSkeleton}
                data-bg={index % 2 === 0}
                onClick={() => {
                  setParamsCustomer({ ...paramsCustomer, phone: item.phone })
                }}
                className="flex flex-col w-[75%] justify-between items-start cursor-pointer p-2 rounded-lg data-[active=false]:hidden data-[bg=true]:bg-neutral-400/20 data-[bg=false]:bg-neutral-400/10"
              >
                <span className='text-orange-500 truncate'>{item.name}</span>
                <span className='text-sm text-slate-600 px-2'>{item.phone}</span>
              </div>
            )
          })}
          <SkeletonCustomer />
        </div>
      </div>
    </div>
  )
}
