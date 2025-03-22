import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '@renderer/contexts/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'
import { useCDRApi } from '@/hooks/useCDRApi' // Custom hook mới

export default function CDR() {
  const { user, setIsOnline, setCdrInfo } = useAuth()
  const [keywordDetail, setKeywordDetail] = useState('')
  const [timeoutStart, setTimeoutStart] = useState()
  
  // Sử dụng useMemo để tránh tạo lại object params khi không cần thiết
  const params = useMemo(() => ({
    page: 1,
    limit: 20,
    company: '',
    telco: '',
    disposition: '',
    cnum: '',
    keyword: keywordDetail,
    gteDate: '',
    lteDate: ''
  }), [keywordDetail])
  
  // Sử dụng custom hook cho CDR API
  const { data: cdrData, loading, fetchCDRs } = useCDRApi(params, user?.token)
  
  const { listCDR, totalCall, count } = cdrData || { listCDR: [], totalCall: 0, count: 0 }
  
  // Sử dụng useCallback cho các hàm xử lý
  const handleSearch = useCallback((e) => {
    setKeywordDetail(e.target.value)
    clearTimeout(timeoutStart)
    setTimeoutStart(
      setTimeout(() => {
        // Tìm kiếm với giá trị mới
      }, 1000)
    )
  }, [timeoutStart])
  
  // Còn lại của component
}