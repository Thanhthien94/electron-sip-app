import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { API_URL } from '@/lib/config'
import { toastOptions } from '@/lib/toast'

interface CDRParams {
  page: number
  limit: number
  company: string
  userTag?: string
  telco: string
  disposition: string
  cnum: string
  keyword: string
  gteDate: string | Date
  lteDate: string | Date
}

interface CDRData {
  listCDR: any[]
  totalCall: number
  count: number
  isLoading: boolean
}

/**
 * Custom hook to fetch and manage CDR (Call Detail Records) data
 * 
 * @param params - Query parameters for the CDR API
 * @param token - Authentication token
 * @param dependencyArray - Additional dependencies to trigger refetch
 * @returns Object containing CDR data, loading state, and utility functions
 */
export const useCDRApi = (
  params: CDRParams,
  token: string | null,
  dependencyArray: any[] = []
) => {
  const [data, setData] = useState<CDRData>({
    listCDR: [],
    totalCall: 0,
    count: 0,
    isLoading: true
  })
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  /**
   * Fetch CDRs from the API
   */
  const fetchCDRs = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      return { isSessionExpired: false }
    }

    const queryParams = new URLSearchParams()
    queryParams.append('reverse', '1')
    queryParams.append('page', params.page.toString())
    queryParams.append('limit', params.limit.toString())
    queryParams.append('keyword', params.keyword)
    queryParams.append('company', params.company)
    queryParams.append('userTag', params.userTag || '')
    queryParams.append('telco', params.telco)
    queryParams.append('disposition', params.disposition)
    queryParams.append('cnum', params.cnum)
    queryParams.append('gteDate', params.gteDate ? params.gteDate.toString() : '')
    queryParams.append('lteDate', params.lteDate ? params.lteDate.toString() : '')

    const config = {
      method: 'get',
      url: `${API_URL}/cdr?${queryParams.toString()}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }

    try {
      setIsLoading(true)
      const res = await axios.request(config)
      const result = res?.data?.data

      if (result) {
        if (result.total !== 0) {
          setData({
            listCDR: result.data,
            totalCall: result.analysDisposition[0]?.totalCall || 0,
            count: result?.count || 0,
            isLoading: false
          })
        } else {
          setData({
            listCDR: [],
            totalCall: 0,
            count: 0,
            isLoading: false
          })
        }
      }
      setIsLoading(false)
      return { isSessionExpired: false }
    } catch (error: any) {
      setError(error)
      setIsLoading(false)
      
      // Handle specific error cases
      if (error?.response?.status === 403) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', toastOptions)
        return { isSessionExpired: true }
      }
      
      toast.error(error?.response?.data?.message || 'Không thể tải dữ liệu CDR', toastOptions)
      console.error('Error fetching CDRs:', error)
      return { isSessionExpired: false }
    }
  }, [token, params, ...dependencyArray])

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

  /**
   * Reset filters and search parameters
   */
  const resetFilters = useCallback(() => {
    return {
      ...params,
      page: 1,
      keyword: '',
      company: '',
      telco: '',
      disposition: '',
      cnum: ''
    }
  }, [params])

  // Fetch data when dependencies change
  useEffect(() => {
    fetchCDRs()
  }, [fetchCDRs])

  return {
    data: {
      listCDR: data.listCDR,
      totalCall: data.totalCall,
      count: data.count
    },
    isLoading,
    error,
    fetchCDRs,
    nextPage,
    prevPage,
    resetFilters
  }
}