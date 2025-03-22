import { useState, useEffect } from 'react'
import { ChevronDownCircle, ChevronUpCircle, OctagonAlert, PhoneMissed, PhoneOutgoing } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCall } from '@/contexts/CallContext'
import { useCDRApi } from '@/hooks/useCDRApi'
import { CDRItem } from '@/types/cdr.types'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'

export const CDRList = () => {
  const { user } = useAuth()
  const { callState, setCdrInfo } = useCall()
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [searchTimeout, setSearchTimeout] = useState<any>(null)
  
  // Search params with useState to trigger data refetch
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
    company: '',
    telco: '',
    disposition: '',
    cnum: '',
    keyword: '',
    gteDate: '',
    lteDate: ''
  })
  
  // Use the custom hook to fetch CDR data
  const {
    data: { listCDR, totalCall, count },
    isLoading,
    error,
    nextPage,
    prevPage
  } = useCDRApi(searchParams, user?.token, [user?.token, callState])
  
  // Fetch CDRs after a call ends (with delay to allow backend to update)
  useEffect(() => {
    if (user?.token && callState === 'hangup') {
      const timer = setTimeout(() => {
        setSearchParams({ ...searchParams })
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [user, callState])
  
  // Handle search input changes with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value
    setSearchKeyword(keyword)
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // Set new timeout for search
    setSearchTimeout(
      setTimeout(() => {
        setSearchParams({
          ...searchParams,
          keyword,
          page: 1 // Reset to first page on new search
        })
      }, 500)
    )
  }
  
  // Handle pagination
  const handleNextPage = () => {
    setSearchParams(nextPage())
  }
  
  const handlePrevPage = () => {
    setSearchParams(prevPage())
  }
  
  // Render loading skeleton
  const SkeletonCall = () => (
    <div className="flex items-center space-x-2">
      <Skeleton className="h-12 w-12 rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-12 w-[180px]" />
      </div>
    </div>
  )
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Search box */}
      <div className="flex flex-col items-center w-full mb-4 px-4 pt-2">
        <Input
          value={searchKeyword}
          onChange={handleSearchChange}
          type="text"
          placeholder="Tìm số điện thoại"
          className="p-1 px-3 rounded-lg bg-transparent border border-orange-400 w-full"
        />
      </div>
      
      {/* Call list */}
      <div className="flex flex-col gap-3 items-center w-full overflow-y-auto h-[calc(100vh-220px)] px-2">
        {isLoading ? (
          <SkeletonCall />
        ) : (
          listCDR.map((item: CDRItem, index: number) => (
            <div
              key={item._id || index}
              data-bg={index % 2 === 0}
              onClick={() => {
                const data = {
                  from_num: item.cnum,
                  to_num: item.dst,
                  from_name: item.user ? `${item.user.lastname} ${item.user.firstname}` : '',
                  to_name: item.dstName || '',
                  duration: item.duration.toString(),
                  billSec: item.billsec.toString(),
                  disposition: item.disposition,
                  record: item.linkRecord || '',
                  created_at: new Date(item.createdAt)
                }
                setCdrInfo(data)
              }}
              className="flex flex-row w-[90%] justify-between gap-2 items-center cursor-pointer p-2 rounded-lg data-[bg=true]:bg-neutral-400/20 data-[bg=false]:bg-neutral-400/10 hover:bg-neutral-500/30 transition-colors"
            >
              {/* Call status icons */}
              {item.disposition === 'FAILED' && (
                <span className="text-red-600">
                  <OctagonAlert size={20} />
                </span>
              )}
              
              {(item.disposition === 'NO ANSWER' || item.disposition === 'BUSY') && (
                <span className="text-red-500">
                  <PhoneMissed size={20} />
                </span>
              )}
              
              {item.disposition === 'ANSWERED' && (
                <span className="text-green-500">
                  <PhoneOutgoing size={20} />
                </span>
              )}
              
              {/* Call number with color based on disposition */}
              <span
                className={
                  item.disposition === 'ANSWERED'
                    ? 'text-green-600'
                    : item.disposition === 'BUSY'
                    ? 'text-red-600'
                    : item.disposition === 'NO ANSWER'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }
              >
                {item.dst}
              </span>
            </div>
          ))
        )}
        
        {/* Empty state message */}
        {!isLoading && listCDR.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            Không có dữ liệu cuộc gọi
          </div>
        )}
      </div>
      
      {/* Pagination controls */}
      {count > 0 && (
        <div className="flex flex-row gap-2 items-center text-xs mx-auto mt-2 w-fit">
          <span className="bg-orange-400 p-1 px-2 rounded-full">Trang {searchParams.page}</span>
          <span>
            {count} / {totalCall}
          </span>
          <button onClick={handlePrevPage} className="hover:text-sky-600 text-orange-400" disabled={searchParams.page <= 1}>
            <ChevronUpCircle size={20} />
          </button>
          <button onClick={handleNextPage} className="hover:text-sky-600 text-orange-400" disabled={count < searchParams.limit}>
            <ChevronDownCircle size={20} />
          </button>
        </div>
      )}
    </div>
  )
}