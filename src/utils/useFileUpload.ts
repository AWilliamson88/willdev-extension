import { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react'

export interface UseFileUploadOptions {
  /**
   * Accepted file types (MIME types)
   * @example ['image/png', 'image/jpeg']
   */
  acceptedTypes?: string[]
  
  /**
   * Maximum file size in bytes
   * @example 10 * 1024 * 1024 // 10MB
   */
  maxSize?: number
  
  /**
   * Allow multiple file selection
   * @default false
   */
  multiple?: boolean
  
  /**
   * Callback when file is selected
   */
  onFileSelect?: (file: File) => void
  
  /**
   * Callback when files are selected (multiple mode)
   */
  onFilesSelect?: (files: File[]) => void
  
  /**
   * Callback when validation fails
   */
  onError?: (error: string) => void
}

export interface UseFileUploadReturn {
  /**
   * Whether drag is currently over the drop zone
   */
  isDragOver: boolean
  
  /**
   * Error message (empty string when no error)
   */
  error: string
  
  /**
   * Currently selected file (single mode)
   */
  selectedFile: File | null
  
  /**
   * Currently selected files (multiple mode)
   */
  selectedFiles: File[]
  
  /**
   * File input ref to attach to <input type="file">
   */
  fileInputRef: React.RefObject<HTMLInputElement>
  
  /**
   * Props to spread on drag-drop container
   */
  dragDropProps: {
    onDragOver: (e: DragEvent) => void
    onDragEnter: (e: DragEvent) => void
    onDragLeave: (e: DragEvent) => void
    onDrop: (e: DragEvent) => void
  }
  
  /**
   * Props to spread on file input
   */
  inputProps: {
    ref: React.RefObject<HTMLInputElement>
    type: 'file'
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    accept?: string
    multiple?: boolean
  }
  
  /**
   * Clear selected file(s)
   */
  clearFiles: () => void
  
  /**
   * Clear error message
   */
  clearError: () => void
  
  /**
   * Trigger file input click programmatically
   */
  openFilePicker: () => void
}

/**
 * Hook for file upload with drag-and-drop support and validation
 * 
 * @example
 * ```tsx
 * const { dragDropProps, inputProps, isDragOver, error } = useFileUpload({
 *   acceptedTypes: ['image/png', 'image/jpeg'],
 *   maxSize: 10 * 1024 * 1024,
 *   onFileSelect: (file) => console.log(file)
 * })
 * 
 * return (
 *   <div {...dragDropProps} className={isDragOver ? 'drag-over' : ''}>
 *     <input {...inputProps} style={{ display: 'none' }} />
 *     <p>Drag and drop or click to upload</p>
 *     {error && <p className="error">{error}</p>}
 *   </div>
 * )
 * ```
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    acceptedTypes = [],
    maxSize,
    multiple = false,
    onFileSelect,
    onFilesSelect,
    onError
  } = options

  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      return `Unsupported file type: ${file.type}. Accepted types: ${acceptedTypes.join(', ')}`
    }
    
    // Check file size
    if (maxSize && file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
      return `File size too large. Maximum size is ${maxSizeMB}MB.`
    }
    
    return null
  }, [acceptedTypes, maxSize])

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const validationError = validateFile(fileArray[0])
    
    if (validationError) {
      setError(validationError)
      if (onError) onError(validationError)
      return
    }

    setError('')
    
    if (multiple) {
      setSelectedFiles(fileArray)
      if (onFilesSelect) onFilesSelect(fileArray)
    } else {
      setSelectedFile(fileArray[0])
      if (onFileSelect) onFileSelect(fileArray[0])
    }
  }, [multiple, validateFile, onFileSelect, onFilesSelect, onError])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    dragCounterRef.current = 0

    const files = e.dataTransfer?.files
    handleFiles(files)
  }, [handleFiles])

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }, [handleFiles])

  const clearFiles = useCallback(() => {
    setSelectedFile(null)
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const clearError = useCallback(() => {
    setError('')
  }, [])

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return {
    isDragOver,
    error,
    selectedFile,
    selectedFiles,
    fileInputRef,
    dragDropProps: {
      onDragOver: handleDragOver,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop
    },
    inputProps: {
      ref: fileInputRef,
      type: 'file' as const,
      onChange: handleInputChange,
      accept: acceptedTypes.length > 0 ? acceptedTypes.join(',') : undefined,
      multiple
    },
    clearFiles,
    clearError,
    openFilePicker
  }
}
