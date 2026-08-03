/**
 * Format utilities for consistent display across the application
 */

/**
 * Format bytes to human-readable file size
 * 
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string like "1.50 MB"
 * 
 * @example
 * formatFileSize(1536) // "1.50 KB"
 * formatFileSize(1048576) // "1.00 MB"
 * formatFileSize(0) // "0 Bytes"
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm))
  
  return `${size} ${sizes[i]}`
}

/**
 * Format milliseconds to human-readable time
 * 
 * @param ms - Milliseconds
 * @returns Formatted string like "1.23s" or "456ms"
 * 
 * @example
 * formatTime(1234) // "1.23s"
 * formatTime(456) // "456ms"
 * formatTime(0.5) // "0.50ms"
 */
export function formatTime(ms: number): string {
  if (ms < 1) {
    return `${ms.toFixed(2)}ms`
  } else if (ms < 1000) {
    return `${Math.round(ms)}ms`
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`
  } else {
    const minutes = Math.floor(ms / 60000)
    const seconds = ((ms % 60000) / 1000).toFixed(0)
    return `${minutes}m ${seconds}s`
  }
}

/**
 * Format number with thousands separators
 * 
 * @param num - Number to format
 * @returns Formatted string like "1,234,567"
 * 
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(123) // "123"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * Format percentage
 * 
 * @param value - Number between 0 and 1
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string like "75.5%"
 * 
 * @example
 * formatPercentage(0.755) // "75.5%"
 * formatPercentage(0.5, 0) // "50%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Truncate string with ellipsis
 * 
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add when truncated (default: "...")
 * @returns Truncated string
 * 
 * @example
 * truncateString("Hello World", 8) // "Hello..."
 * truncateString("Hi", 10) // "Hi"
 */
export function truncateString(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - suffix.length) + suffix
}

/**
 * Format date to ISO string without milliseconds
 * 
 * @param date - Date object or timestamp
 * @returns Formatted ISO string
 * 
 * @example
 * formatDate(new Date()) // "2024-01-15T10:30:00Z"
 */
export function formatDate(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date
  return d.toISOString().split('.')[0] + 'Z'
}

/**
 * Format relative time (e.g., "2 hours ago")
 * 
 * @param date - Date object or timestamp
 * @returns Relative time string
 * 
 * @example
 * formatRelativeTime(Date.now() - 3600000) // "1 hour ago"
 * formatRelativeTime(Date.now() + 86400000) // "in 1 day"
 */
export function formatRelativeTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.abs(Math.floor(diffMs / 1000))
  const isPast = diffMs > 0
  
  if (diffSec < 60) return 'just now'
  
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return isPast ? `${diffMin} minute${diffMin > 1 ? 's' : ''} ago` : `in ${diffMin} minute${diffMin > 1 ? 's' : ''}`
  
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return isPast ? `${diffHour} hour${diffHour > 1 ? 's' : ''} ago` : `in ${diffHour} hour${diffHour > 1 ? 's' : ''}`
  
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 30) return isPast ? `${diffDay} day${diffDay > 1 ? 's' : ''} ago` : `in ${diffDay} day${diffDay > 1 ? 's' : ''}`
  
  const diffMonth = Math.floor(diffDay / 30)
  return isPast ? `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago` : `in ${diffMonth} month${diffMonth > 1 ? 's' : ''}`
}
