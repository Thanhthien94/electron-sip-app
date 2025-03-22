/**
 * Call Detail Record (CDR) related type definitions
 */

/**
 * CDR information displayed in call details
 */
export interface CDRInfo {
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
  
  /**
   * Raw CDR item returned from API
   */
  export interface CDRItem {
    _id: string
    cnum: string      // Caller number
    dst: string       // Destination number
    dstName?: string  // Destination name
    duration: number  // Call duration in seconds
    billsec: number   // Billing seconds
    disposition: 'ANSWERED' | 'BUSY' | 'NO ANSWER' | 'FAILED' // Call status
    createdAt: string // Creation date
    updatedAt: string // Last update date
    linkRecord?: string // Link to call recording
    company?: string  // Company name
    telco?: string    // Telecom operator
    user?: {          // User who made/received the call
      _id: string
      firstname: string
      lastname: string
    }
  }
  
  /**
   * CDR list response from API
   */
  export interface CDRListResponse {
    message: string
    data: {
      data: CDRItem[]
      total: number
      count: number
      analysDisposition: Array<{
        _id: string
        totalCall: number
      }>
    }
  }
  
  /**
   * CDR query parameters
   */
  export interface CDRQueryParams {
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
  
  /**
   * CDR disposition types with translations
   */
  export const CDR_DISPOSITION_TYPES = {
    'ANSWERED': 'Nghe máy',
    'BUSY': 'Bận',
    'NO ANSWER': 'Không nghe máy',
    'FAILED': 'Gọi thất bại'
  } as const
  
  export type CDRDispositionType = keyof typeof CDR_DISPOSITION_TYPES