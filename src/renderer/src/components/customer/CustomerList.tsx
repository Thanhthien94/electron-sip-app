import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCall } from '@/contexts/CallContext'
import { useCustomerApi } from '@/hooks/useCustomerApi'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Phone, UserRound, Search } from 'lucide-react'

export const CustomerList = () => {
  const { user } = useAuth()
  const { makeCall } = useCall()
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [searchTimeout, setSearchTimeout] = useState<any>(null)
  
  // Search params for customer API
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
    phone: '',
    keyword: ''
  })
  
  // Use custom hook to fetch customer data
  const { 
    data: customers, 
    isLoading, 
    error 
  } = useCustomerApi(searchParams, user?.token)
  
  // Handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value
    setSearchKeyword(keyword)
    
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    setSearchTimeout(
      setTimeout(() => {
        setSearchParams({
          ...searchParams,
          keyword,
          page: 1
        })
      }, 500)
    )
  }
  
  // Handle quick call to customer
  const handleCallCustomer = useCallback((phone: string) => {
    if (phone) {
      makeCall(phone)
    }
  }, [makeCall])
  
  // Render loading skeleton
  const SkeletonCustomer = () => (
    <div className="flex items-center space-x-2">
      <Skeleton className="h-12 w-12 rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-3 w-[80px]" />
      </div>
    </div>
  )
  
  return (
    <div className="h-full w-full flex flex-col p-2">
      {/* Search box */}
      <div className="relative mb-4">
        <Input
          value={searchKeyword}
          onChange={handleSearchChange}
          type="text"
          placeholder="Tìm khách hàng..."
          className="p-2 pl-8 rounded-lg bg-transparent border border-orange-400 w-full"
        />
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
      </div>
      
      {/* Customer list */}
      <div className="flex flex-col gap-2 overflow-auto h-[calc(100vh-200px)] w-full">
        {isLoading ? (
          Array(5).fill(0).map((_, index) => (
            <SkeletonCustomer key={index} />
          ))
        ) : (
          customers.map((customer: any, index: number) => (
            <div
              key={customer._id || index}
              data-bg={index % 2 === 0}
              className="flex flex-col w-full justify-between items-start cursor-pointer p-3 rounded-lg data-[bg=true]:bg-neutral-400/20 data-[bg=false]:bg-neutral-400/10 hover:bg-neutral-500/30 transition-colors"
            >
              <div className="flex justify-between w-full items-center mb-1">
                <div className="flex items-center gap-2">
                  <UserRound size={16} className="text-orange-400" />
                  <span className="text-orange-500 truncate font-medium">
                    {customer.name || 'Khách hàng'}
                  </span>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-full hover:bg-green-500/20"
                  onClick={() => handleCallCustomer(customer.phone)}
                >
                  <Phone size={14} className="text-green-500" />
                </Button>
              </div>
              
              <div className="flex flex-col text-sm pl-6">
                <span className="text-slate-400">{customer.phone}</span>
                {customer.email && (
                  <span className="text-slate-500 text-xs">{customer.email}</span>
                )}
                {customer.company && (
                  <span className="text-slate-500 text-xs mt-1">{customer.company}</span>
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Empty state */}
        {!isLoading && customers.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            Không tìm thấy khách hàng
          </div>
        )}
      </div>
    </div>
  )
}