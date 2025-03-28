/**
 * Improved storage utilities for Electron app
 * More secure and structured than the original implementation
 */

// Danh sách các key cần kiểm tra tính hợp lệ cho SIP
const SIP_REQUIRED_KEYS = ['SIPID', 'TOKEN'];

/**
 * Save multiple items to localStorage
 * @param value Object with key-value pairs to save
 */
export const saveItem = async (value: Record<string, any>): Promise<void> => {
  if (typeof window === 'undefined') return

  try {
    await Promise.all(
      Object.entries(value).map(([key, val]) => {
        if (val !== undefined && val !== null) {
          window.localStorage?.setItem(key, JSON.stringify(val))
        }
      })
    )
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

/**
 * Get an item from localStorage with proper typing and error handling
 * @param key The key to retrieve
 * @returns The parsed value or null if not found
 */
export const getItem = <T = any>(key: string): T | null => {
  if (typeof window === 'undefined') return null

  try {
    const item = window.localStorage?.getItem(key)
    
    if (!item) return null
    
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error)
    return null
  }
}

/**
 * Remove a specific item from localStorage
 * @param key The key to remove
 */
export const removeItem = (key: string): void => {
  if (typeof window === 'undefined') return
  
  try {
    window.localStorage?.removeItem(key)
  } catch (error) {
    console.error(`Error removing item ${key} from localStorage:`, error)
  }
}

/**
 * Kiểm tra tính hợp lệ của dữ liệu SIP trong localStorage
 * @returns boolean - true nếu dữ liệu hợp lệ, ngược lại là false
 */
export const validateStoredSIPData = (): boolean => {
  if (typeof window === 'undefined') return false
  
  try {
    // Kiểm tra từng key cần thiết
    for (const key of SIP_REQUIRED_KEYS) {
      const value = getItem(key);
      if (!value) {
        console.log(`Missing required SIP key: ${key}`);
        return false;
      }
    }
    
    // Các kiểm tra bổ sung về tính hợp lệ của dữ liệu
    const sipId = getItem('SIPID');
    if (typeof sipId !== 'string' || sipId.length < 1) {
      console.log('SIPID is invalid');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating SIP data:', error);
    return false;
  }
}

/**
 * Clear all localStorage except for specified keys
 * @param keysToKeep Array of keys to preserve
 */
export const clearLocalStorageExceptKeys = (keysToKeep: string[]): void => {
  if (typeof window === 'undefined') return
  
  try {
    const keysToRemove = Object.keys(localStorage).filter(key => !keysToKeep.includes(key))
    
    keysToRemove.forEach(key => {
      window.localStorage?.removeItem(key)
    })
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}

/**
 * Clear all localStorage
 */
export const clearLocalStorage = (): void => {
  if (typeof window === 'undefined') return
  
  try {
    window.localStorage?.clear()
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}

/**
 * Secure version of localStorage with encryption for sensitive data
 * TODO: Implement proper encryption for production
 */
export const secureStorage = {
  setItem: (key: string, value: any): void => {
    // In a real implementation, encrypt the value before storing
    const encryptedValue = JSON.stringify(value) // Placeholder for encryption
    localStorage.setItem(`secure_${key}`, encryptedValue)
  },
  
  getItem: <T = any>(key: string): T | null => {
    const encryptedValue = localStorage.getItem(`secure_${key}`)
    if (!encryptedValue) return null
    
    // In a real implementation, decrypt before returning
    return JSON.parse(encryptedValue) as T
  },
  
  removeItem: (key: string): void => {
    localStorage.removeItem(`secure_${key}`)
  }
}