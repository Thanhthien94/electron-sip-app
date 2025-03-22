/**
 * Authentication related type definitions
 */

/**
 * User information
 */
export interface User {
    username: string
    firstname: string
    lastname: string
    email: string
    phone: string
    refreshToken: string
    token: string
    role?: string[]
  }
  
  /**
   * Login credentials
   */
  export interface LoginCredentials {
    username: string
    password: string
  }
  
  /**
   * SIP configuration
   */
  export interface SIPConfig {
    extension: string
    password: string
    sipServer: string
    wsHost: string
    displayName: string
  }
  
  /**
   * Auth state
   */
  export interface AuthState {
    user: User | null
    sipConfig: SIPConfig | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
  }
  
  /**
   * Login response from API
   */
  export interface LoginResponse {
    message: string
    data: User & {
      _id: string
      sip: string
      role: Array<{ name: string }>
    }
  }
  
  /**
   * SIP response from API
   */
  export interface SIPResponse {
    message: string
    data: Array<{
      extension: string
      password: string
      pbx: {
        host: string
        WsHost: string
        WsPort?: string
      }
    }>
  }