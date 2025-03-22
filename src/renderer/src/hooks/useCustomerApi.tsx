import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { API_URL } from '@/lib/config'
import { toastOptions } from '@/lib/toast'

interface CustomerParams {
  page: number
  limit: number
  phone: string
  keyword: string
}

/**
 * Custom hook to fetch and manage Customer data
 * 
 * @param params - Query parameters for the Customer API
 * @param token - Authentication token
 * @param dependencyArray - Additional dependencies to trigger refetch
 * @returns Object containing Customer data, loading state, and utility functions
 */
export const useCustomerApi = (
  params: CustomerParams,
  token: string | null,
  dependencyArray: any[] = []
) => {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalCount, setTotalCount] = useState<number>(0)
  
  /**
   * Fetch customers from the API
   */
  const fetchCustomers = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      return
    }
    
    const queryParams = new URLSearchParams()
    queryParams.append('reverse', '1')
    queryParams.append('page', params.page.toString())
    queryParams.append('limit', params.limit.toString())
    queryParams.append('phone', params.phone)
    queryParams.append('keyword', params.keyword)
    queryParams.append('project', 'true') // Include project data if needed
    
    const config = {
      method: 'get',
      url: `${API_URL}/crm/customer?${queryParams.toString()}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }
    
    try {
      setIsLoading(true)
      const res = await axios.request(config)
      const result = res?.data?.data
      
      if (result && result.data) {
        // Add checked property to each item (for future selection functionality)
        const customers = result.data.map((item: any) => ({
          checked: false,
          ...item
        }))
        
        setData(customers)
        setTotalCount(result.count || 0)
      } else {
        setData([])
      }
      
      setIsLoading(false)
    } catch (error: any) {
      setError(error)
      setIsLoading(false)
      
      // Handle specific error cases
      if (error?.response?.status === 403) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', toastOptions)
        return { isSessionExpired: true }
      }
      
      toast.error(error?.response?.data?.message || 'Không thể tải dữ liệu khách hàng', toastOptions)
      console.error('Error fetching customers:', error)
    }
  }, [token, params, ...dependencyArray])
  
  /**
   * Search customer by phone number
   */
  const searchByPhone = useCallback((phone: string) => {
    return {
      ...params,
      phone,
      page: 1
    }
  }, [params])
  
  /**
   * Search customer by keyword
   */
  const searchByKeyword = useCallback((keyword: string) => {
    return {
      ...params,
      keyword,
      page: 1
    }
  }, [params])
  
  /**
   * Navigate to next page
   */
  const nextPage = useCallback(() => {
    return {
      ...params,
      page: params.page + 1
    }
  }, [params])
  
  /**
   * Navigate to previous page
   */
  const prevPage = useCallback(() => {
    return {
      ...params,
      page: Math.max(1, params.page - 1)
    }
  }, [params])
  
  // Fetch data when dependencies change
  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])
  
  return {
    data,
    isLoading,
    error,
    totalCount,
    fetchCustomers,
    searchByPhone,
    searchByKeyword,
    nextPage,
    prevPage
  }
}