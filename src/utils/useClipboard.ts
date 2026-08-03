import { useState, useCallback, useEffect } from 'react'

export interface UseClipboardOptions {
  /**
   * Duration in milliseconds to show the feedback message
   * @default 2000
   */
  feedbackDuration?: number
  
  /**
   * Success message to display when copy succeeds
   * @default "Copied to clipboard!"
   */
  successMessage?: string
  
  /**
   * Error message to display when copy fails
   * @default "Failed to copy to clipboard"
   */
  errorMessage?: string
}

export interface UseClipboardReturn {
  /**
   * Copy text to clipboard
   * @param text - Text to copy
   * @param customMessage - Optional custom success message for this specific copy
   */
  copy: (text: string, customMessage?: string) => Promise<void>
  
  /**
   * Current feedback message (empty string when no feedback)
   */
  feedback: string
  
  /**
   * Whether the last copy was successful
   */
  isSuccess: boolean
  
  /**
   * Clear the feedback message manually
   */
  clearFeedback: () => void
}

/**
 * Hook for copying text to clipboard with automatic feedback
 * 
 * @example
 * ```tsx
 * const { copy, feedback } = useClipboard()
 * 
 * const handleCopy = async () => {
 *   await copy("Hello world!")
 * }
 * 
 * return (
 *   <>
 *     <button onClick={handleCopy}>Copy</button>
 *     {feedback && <div className="feedback">{feedback}</div>}
 *   </>
 * )
 * ```
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const {
    feedbackDuration = 2000,
    successMessage = 'Copied to clipboard!',
    errorMessage = 'Failed to copy to clipboard'
  } = options

  const [feedback, setFeedback] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  // Auto-clear feedback after duration
  useEffect(() => {
    if (feedback) {
      const timeoutId = setTimeout(() => {
        setFeedback('')
        setIsSuccess(false)
      }, feedbackDuration)
      
      return () => clearTimeout(timeoutId)
    }
  }, [feedback, feedbackDuration])

  const copy = useCallback(async (text: string, customMessage?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setFeedback(customMessage || successMessage)
      setIsSuccess(true)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      setFeedback(errorMessage)
      setIsSuccess(false)
    }
  }, [successMessage, errorMessage])

  const clearFeedback = useCallback(() => {
    setFeedback('')
    setIsSuccess(false)
  }, [])

  return {
    copy,
    feedback,
    isSuccess,
    clearFeedback
  }
}
