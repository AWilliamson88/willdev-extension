/**
 * Shared utilities for the WillDev extension
 * 
 * This module provides reusable hooks and functions to eliminate
 * code duplication across components.
 */

// Hooks
export { useClipboard } from './useClipboard'
export type { UseClipboardOptions, UseClipboardReturn } from './useClipboard'

export { useFileUpload } from './useFileUpload'
export type { UseFileUploadOptions, UseFileUploadReturn } from './useFileUpload'

// Format utilities
export {
  formatFileSize,
  formatTime,
  formatNumber,
  formatPercentage,
  truncateString,
  formatDate,
  formatRelativeTime
} from './formatters'

// Validation utilities
export {
  isValidJSON,
  isValidXML,
  isValidJWT,
  isValidURL,
  isValidEmail,
  isValidHexColor,
  validateFileSize,
  validateFileType,
  validateRange,
  validatePattern,
  validateRequired,
  combineValidations
} from './validators'
