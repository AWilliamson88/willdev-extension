/**
 * Validation utilities for input validation
 */

/**
 * Check if a string is valid JSON
 * 
 * @param str - String to validate
 * @returns true if valid JSON, false otherwise
 */
export function isValidJSON(str: string): boolean {
  if (!str.trim()) return false
  
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

/**
 * Check if a string is valid XML
 * 
 * @param str - String to validate
 * @returns true if valid XML, false otherwise
 */
export function isValidXML(str: string): boolean {
  if (!str.trim()) return false
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(str, 'text/xml')
    const parserError = doc.querySelector('parsererror')
    return parserError === null
  } catch {
    return false
  }
}

/**
 * Check if a string is a valid JWT token
 * 
 * @param str - String to validate
 * @returns true if valid JWT format, false otherwise
 */
export function isValidJWT(str: string): boolean {
  if (!str.trim()) return false
  
  const parts = str.trim().split('.')
  return parts.length === 3 && parts.every(part => part.length > 0)
}

/**
 * Check if a string is a valid URL
 * 
 * @param str - String to validate
 * @returns true if valid URL, false otherwise
 */
export function isValidURL(str: string): boolean {
  if (!str.trim()) return false
  
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

/**
 * Check if a string is a valid email
 * 
 * @param str - String to validate
 * @returns true if valid email format, false otherwise
 */
export function isValidEmail(str: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(str)
}

/**
 * Check if a string is a valid hex color
 * 
 * @param str - String to validate
 * @returns true if valid hex color (#RGB or #RRGGBB), false otherwise
 */
export function isValidHexColor(str: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexRegex.test(str)
}

/**
 * Validate file size
 * 
 * @param file - File to validate
 * @param maxSize - Maximum size in bytes
 * @returns Error message if invalid, null if valid
 */
export function validateFileSize(file: File, maxSize: number): string | null {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
    return `File size too large. Maximum size is ${maxSizeMB}MB.`
  }
  return null
}

/**
 * Validate file type
 * 
 * @param file - File to validate
 * @param acceptedTypes - Array of accepted MIME types
 * @returns Error message if invalid, null if valid
 */
export function validateFileType(file: File, acceptedTypes: string[]): string | null {
  if (acceptedTypes.length === 0) return null
  
  if (!acceptedTypes.includes(file.type)) {
    return `Unsupported file type: ${file.type}. Accepted types: ${acceptedTypes.join(', ')}`
  }
  return null
}

/**
 * Validate that a number is within a range
 * 
 * @param value - Number to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Error message if invalid, null if valid
 */
export function validateRange(value: number, min: number, max: number): string | null {
  if (value < min || value > max) {
    return `Value must be between ${min} and ${max}`
  }
  return null
}

/**
 * Validate that a string matches a pattern
 * 
 * @param str - String to validate
 * @param pattern - Regex pattern
 * @param errorMessage - Custom error message
 * @returns Error message if invalid, null if valid
 */
export function validatePattern(str: string, pattern: RegExp, errorMessage: string): string | null {
  if (!pattern.test(str)) {
    return errorMessage
  }
  return null
}

/**
 * Validate that a string is not empty
 * 
 * @param str - String to validate
 * @param fieldName - Name of the field for error message
 * @returns Error message if invalid, null if valid
 */
export function validateRequired(str: string, fieldName: string = 'This field'): string | null {
  if (!str.trim()) {
    return `${fieldName} is required`
  }
  return null
}

/**
 * Combine multiple validation results
 * 
 * @param validations - Array of validation results (error messages or null)
 * @returns First error message found, or null if all valid
 */
export function combineValidations(validations: (string | null)[]): string | null {
  return validations.find(v => v !== null) || null
}
