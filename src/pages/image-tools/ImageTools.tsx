import React, { useState, useCallback, useRef, useEffect } from 'react'
import './image-tools.css'

type ToolMode = 'resize' | 'convert' | 'compress' | 'crop' | 'filter'
type ResizeMode = 'percentage' | 'pixels' | 'preset'
type OutputFormat = 'jpeg' | 'png' | 'webp' | 'bmp'
type FilterType = 'grayscale' | 'sepia' | 'blur' | 'brightness' | 'contrast' | 'saturate' | 'invert'

interface ImageInfo {
  name: string
  size: number
  type: string
  width: number
  height: number
  dataUrl: string
}

interface ResizeOptions {
  mode: ResizeMode
  percentage: number
  width: number
  height: number
  maintainAspectRatio: boolean
  preset: string
}

interface CompressOptions {
  quality: number
  format: OutputFormat
}

interface CropOptions {
  x: number
  y: number
  width: number
  height: number
}

interface FilterOptions {
  type: FilterType
  intensity: number
}

const ImageTools: React.FC = () => {
  const [mode, setMode] = useState<ToolMode>('resize')
  const [originalImage, setOriginalImage] = useState<ImageInfo | null>(null)
  const [processedImage, setProcessedImage] = useState<ImageInfo | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [processing, setProcessing] = useState(false)
  const isMountedRef = useRef(true)

  // Tool options
  const [resizeOptions, setResizeOptions] = useState<ResizeOptions>({
    mode: 'percentage',
    percentage: 50,
    width: 800,
    height: 600,
    maintainAspectRatio: true,
    preset: '1920x1080'
  })

  const [compressOptions, setCompressOptions] = useState<CompressOptions>({
    quality: 80,
    format: 'jpeg'
  })

  const [cropOptions, setCropOptions] = useState<CropOptions>({
    x: 0,
    y: 0,
    width: 100,
    height: 100
  })

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    type: 'grayscale',
    intensity: 100
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Supported formats
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']

  // Preset sizes
  const presetSizes = {
    '1920x1080': { width: 1920, height: 1080, name: 'Full HD' },
    '1280x720': { width: 1280, height: 720, name: 'HD' },
    '800x600': { width: 800, height: 600, name: 'SVGA' },
    '640x480': { width: 640, height: 480, name: 'VGA' },
    '1080x1080': { width: 1080, height: 1080, name: 'Instagram Square' },
    '1200x630': { width: 1200, height: 630, name: 'Facebook Cover' },
    '1024x512': { width: 1024, height: 512, name: 'Twitter Header' }
  }

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setError('')
    
    if (!supportedFormats.includes(file.type)) {
      setError(`Unsupported file format: ${file.type}. Supported formats: JPEG, PNG, GIF, WebP, BMP`)
      return
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File size too large. Maximum size is 50MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      
      const img = new Image()
      img.onload = () => {
        const imageInfo: ImageInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          width: img.width,
          height: img.height,
          dataUrl: dataUrl
        }
        if (isMountedRef.current) {
          setOriginalImage(imageInfo)
          setProcessedImage(null)

          // Update resize options with original dimensions
          setResizeOptions(prev => ({
            ...prev,
            width: img.width,
            height: img.height
          }))

          // Update crop options with original dimensions
          setCropOptions(prev => ({
            ...prev,
            width: Math.min(img.width, 200),
            height: Math.min(img.height, 200)
          }))
        }
      }
      img.onerror = () => {
        if (isMountedRef.current) {
          setError('Failed to load image')
        }
      }
      img.src = dataUrl
    }
    reader.onerror = () => {
      if (isMountedRef.current) {
        setError('Failed to read file')
      }
    }
    reader.readAsDataURL(file)
  }, [supportedFormats])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // File input change handler
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Resize image
  const resizeImage = useCallback((image: ImageInfo, options: ResizeOptions): Promise<ImageInfo> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current
      if (!canvas) {
        reject(new Error('Canvas not available'))
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      const img = new Image()
      img.onload = () => {
        let newWidth: number
        let newHeight: number

        switch (options.mode) {
          case 'percentage':
            newWidth = Math.round(img.width * (options.percentage / 100))
            newHeight = Math.round(img.height * (options.percentage / 100))
            break
          case 'pixels':
            if (options.maintainAspectRatio) {
              const aspectRatio = img.width / img.height
              if (options.width / options.height > aspectRatio) {
                newHeight = options.height
                newWidth = Math.round(newHeight * aspectRatio)
              } else {
                newWidth = options.width
                newHeight = Math.round(newWidth / aspectRatio)
              }
            } else {
              newWidth = options.width
              newHeight = options.height
            }
            break
          case 'preset':
            const preset = presetSizes[options.preset as keyof typeof presetSizes]
            if (options.maintainAspectRatio) {
              const aspectRatio = img.width / img.height
              if (preset.width / preset.height > aspectRatio) {
                newHeight = preset.height
                newWidth = Math.round(newHeight * aspectRatio)
              } else {
                newWidth = preset.width
                newHeight = Math.round(newWidth / aspectRatio)
              }
            } else {
              newWidth = preset.width
              newHeight = preset.height
            }
            break
          default:
            newWidth = img.width
            newHeight = img.height
        }

        canvas.width = newWidth
        canvas.height = newHeight

        // Use high-quality scaling
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        ctx.drawImage(img, 0, 0, newWidth, newHeight)

        const dataUrl = canvas.toDataURL('image/png')
        const newSize = Math.round((dataUrl.length * 3) / 4) // Approximate size

        resolve({
          name: `resized_${image.name}`,
          size: newSize,
          type: 'image/png',
          width: newWidth,
          height: newHeight,
          dataUrl: dataUrl
        })
      }
      img.onerror = () => reject(new Error('Failed to load image for resizing'))
      img.src = image.dataUrl
    })
  }, [])

  // Convert image format
  const convertImage = useCallback((image: ImageInfo, format: OutputFormat, quality: number = 0.9): Promise<ImageInfo> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current
      if (!canvas) {
        reject(new Error('Canvas not available'))
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      const img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height

        // For JPEG, fill with white background
        if (format === 'jpeg') {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        ctx.drawImage(img, 0, 0)

        const mimeType = `image/${format}`
        const dataUrl = canvas.toDataURL(mimeType, quality / 100)
        const newSize = Math.round((dataUrl.length * 3) / 4)

        const extension = format === 'jpeg' ? 'jpg' : format
        const newName = image.name.replace(/\.[^/.]+$/, `.${extension}`)

        resolve({
          name: newName,
          size: newSize,
          type: mimeType,
          width: img.width,
          height: img.height,
          dataUrl: dataUrl
        })
      }
      img.onerror = () => reject(new Error('Failed to load image for conversion'))
      img.src = image.dataUrl
    })
  }, [])

  // Crop image
  const cropImage = useCallback((image: ImageInfo, options: CropOptions): Promise<ImageInfo> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current
      if (!canvas) {
        reject(new Error('Canvas not available'))
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      const img = new Image()
      img.onload = () => {
        canvas.width = options.width
        canvas.height = options.height

        ctx.drawImage(
          img,
          options.x, options.y, options.width, options.height,
          0, 0, options.width, options.height
        )

        const dataUrl = canvas.toDataURL('image/png')
        const newSize = Math.round((dataUrl.length * 3) / 4)

        resolve({
          name: `cropped_${image.name}`,
          size: newSize,
          type: 'image/png',
          width: options.width,
          height: options.height,
          dataUrl: dataUrl
        })
      }
      img.onerror = () => reject(new Error('Failed to load image for cropping'))
      img.src = image.dataUrl
    })
  }, [])

  // Apply filter to image
  const applyFilter = useCallback((image: ImageInfo, options: FilterOptions): Promise<ImageInfo> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current
      if (!canvas) {
        reject(new Error('Canvas not available'))
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      const img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height

        // Apply CSS filter
        const intensity = options.intensity / 100
        let filter = ''

        switch (options.type) {
          case 'grayscale':
            filter = `grayscale(${intensity})`
            break
          case 'sepia':
            filter = `sepia(${intensity})`
            break
          case 'blur':
            filter = `blur(${intensity * 10}px)`
            break
          case 'brightness':
            filter = `brightness(${intensity * 2})`
            break
          case 'contrast':
            filter = `contrast(${intensity * 2})`
            break
          case 'saturate':
            filter = `saturate(${intensity * 2})`
            break
          case 'invert':
            filter = `invert(${intensity})`
            break
        }

        ctx.filter = filter
        ctx.drawImage(img, 0, 0)

        const dataUrl = canvas.toDataURL('image/png')
        const newSize = Math.round((dataUrl.length * 3) / 4)

        resolve({
          name: `filtered_${image.name}`,
          size: newSize,
          type: 'image/png',
          width: img.width,
          height: img.height,
          dataUrl: dataUrl
        })
      }
      img.onerror = () => reject(new Error('Failed to load image for filtering'))
      img.src = image.dataUrl
    })
  }, [])

  // Process image based on current mode
  const processImage = useCallback(async () => {
    if (!originalImage) return

    setProcessing(true)
    setError('')

    try {
      let result: ImageInfo

      switch (mode) {
        case 'resize':
          result = await resizeImage(originalImage, resizeOptions)
          break
        case 'convert':
          result = await convertImage(originalImage, compressOptions.format, compressOptions.quality)
          break
        case 'compress':
          result = await convertImage(originalImage, compressOptions.format, compressOptions.quality)
          break
        case 'crop':
          result = await cropImage(originalImage, cropOptions)
          break
        case 'filter':
          result = await applyFilter(originalImage, filterOptions)
          break
        default:
          throw new Error('Unknown processing mode')
      }

      if (isMountedRef.current) {
        setProcessedImage(result)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Processing failed')
      }
    } finally {
      if (isMountedRef.current) {
        setProcessing(false)
      }
    }
  }, [originalImage, mode, resizeOptions, compressOptions, cropOptions, filterOptions, resizeImage, convertImage, cropImage, applyFilter])

  // Auto-process when options change
  useEffect(() => {
    if (originalImage) {
      processImage()
    }
  }, [originalImage, mode, resizeOptions, compressOptions, cropOptions, filterOptions, processImage])

  // Handle copy feedback timeout with cleanup
  useEffect(() => {
    if (copyFeedback) {
      const timeoutId = setTimeout(() => setCopyFeedback(''), 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [copyFeedback])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Copy to clipboard
  const copyToClipboard = useCallback(async (dataUrl: string, label: string) => {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ])
      
      setCopyFeedback(`${label} copied to clipboard!`)
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard')
    }
  }, [])

  // Download image
  const downloadImage = useCallback((image: ImageInfo) => {
    const link = document.createElement('a')
    link.href = image.dataUrl
    link.download = image.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  // Clear all
  const clearAll = useCallback(() => {
    setOriginalImage(null)
    setProcessedImage(null)
    setError('')
    setCopyFeedback('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  return (
    <div className="image-tools">
      <h2>Image Manipulation Tools</h2>

      <div className="image-section controls-section">
        <div className="mode-group">
          <label className="mode-label">Tool:</label>
          <div className="mode-buttons">
            <button 
              className={`mode-button ${mode === 'resize' ? 'active' : ''}`}
              onClick={() => setMode('resize')}
            >
              📏 Resize
            </button>
            <button 
              className={`mode-button ${mode === 'convert' ? 'active' : ''}`}
              onClick={() => setMode('convert')}
            >
              🔄 Convert
            </button>
            <button 
              className={`mode-button ${mode === 'compress' ? 'active' : ''}`}
              onClick={() => setMode('compress')}
            >
              🗜️ Compress
            </button>
            <button 
              className={`mode-button ${mode === 'crop' ? 'active' : ''}`}
              onClick={() => setMode('crop')}
            >
              ✂️ Crop
            </button>
            <button 
              className={`mode-button ${mode === 'filter' ? 'active' : ''}`}
              onClick={() => setMode('filter')}
            >
              🎨 Filter
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button className="process-button" onClick={processImage} disabled={!originalImage || processing}>
            {processing ? '⏳ Processing...' : '🔄 Process'}
          </button>
          {processedImage && (
            <>
              <button className="copy-button" onClick={() => copyToClipboard(processedImage.dataUrl, 'Image')}>
                📋 Copy Image
              </button>
              <button className="download-button" onClick={() => downloadImage(processedImage)}>
                💾 Download
              </button>
            </>
          )}
          <button className="clear-button" onClick={clearAll}>
            Clear All
          </button>
        </div>
      </div>

      {copyFeedback && (
        <div className="copy-feedback">
          {copyFeedback}
        </div>
      )}

      {error && (
        <div className="error-feedback">
          ❌ {error}
        </div>
      )}

      {!originalImage && (
        <div className="image-section upload-section">
          <div
            className={`upload-area ${dragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-content">
              <span className="upload-icon">🖼️</span>
              <p className="upload-text">
                Drag and drop an image here, or click to select
              </p>
              <p className="upload-formats">
                Supported formats: JPEG, PNG, GIF, WebP, BMP
              </p>
              <p className="upload-limit">
                Maximum file size: 50MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      )}

      {originalImage && (
        <div className="image-section options-section">
          <label className="section-label">Tool Options</label>

          {mode === 'resize' && (
            <div className="resize-options">
              <div className="option-group">
                <label className="option-label">Resize Mode:</label>
                <select
                  value={resizeOptions.mode}
                  onChange={(e) => setResizeOptions(prev => ({ ...prev, mode: e.target.value as ResizeMode }))}
                  className="mode-select"
                >
                  <option value="percentage">Percentage</option>
                  <option value="pixels">Custom Pixels</option>
                  <option value="preset">Preset Sizes</option>
                </select>
              </div>

              {resizeOptions.mode === 'percentage' && (
                <div className="option-group">
                  <label className="option-label">Scale: {resizeOptions.percentage}%</label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={resizeOptions.percentage}
                    onChange={(e) => setResizeOptions(prev => ({ ...prev, percentage: parseInt(e.target.value) }))}
                    className="percentage-slider"
                  />
                </div>
              )}

              {resizeOptions.mode === 'pixels' && (
                <div className="pixels-options">
                  <div className="option-group">
                    <label className="option-label">Width:</label>
                    <input
                      type="number"
                      value={resizeOptions.width}
                      onChange={(e) => setResizeOptions(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max="10000"
                      className="dimension-input"
                    />
                  </div>
                  <div className="option-group">
                    <label className="option-label">Height:</label>
                    <input
                      type="number"
                      value={resizeOptions.height}
                      onChange={(e) => setResizeOptions(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max="10000"
                      className="dimension-input"
                    />
                  </div>
                </div>
              )}

              {resizeOptions.mode === 'preset' && (
                <div className="option-group">
                  <label className="option-label">Preset Size:</label>
                  <select
                    value={resizeOptions.preset}
                    onChange={(e) => setResizeOptions(prev => ({ ...prev, preset: e.target.value }))}
                    className="preset-select"
                  >
                    {Object.entries(presetSizes).map(([key, preset]) => (
                      <option key={key} value={key}>
                        {preset.name} ({preset.width}×{preset.height})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="option-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={resizeOptions.maintainAspectRatio}
                    onChange={(e) => setResizeOptions(prev => ({ ...prev, maintainAspectRatio: e.target.checked }))}
                  />
                  Maintain aspect ratio
                </label>
              </div>
            </div>
          )}

          {(mode === 'convert' || mode === 'compress') && (
            <div className="convert-options">
              <div className="option-group">
                <label className="option-label">Output Format:</label>
                <select
                  value={compressOptions.format}
                  onChange={(e) => setCompressOptions(prev => ({ ...prev, format: e.target.value as OutputFormat }))}
                  className="format-select"
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                  <option value="bmp">BMP</option>
                </select>
              </div>

              {(compressOptions.format === 'jpeg' || compressOptions.format === 'webp') && (
                <div className="option-group">
                  <label className="option-label">Quality: {compressOptions.quality}%</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={compressOptions.quality}
                    onChange={(e) => setCompressOptions(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                    className="quality-slider"
                  />
                </div>
              )}
            </div>
          )}

          {mode === 'crop' && (
            <div className="crop-options">
              <div className="crop-grid">
                <div className="option-group">
                  <label className="option-label">X Position:</label>
                  <input
                    type="number"
                    value={cropOptions.x}
                    onChange={(e) => setCropOptions(prev => ({ ...prev, x: Math.max(0, parseInt(e.target.value) || 0) }))}
                    min="0"
                    max={originalImage.width - cropOptions.width}
                    className="crop-input"
                  />
                </div>
                <div className="option-group">
                  <label className="option-label">Y Position:</label>
                  <input
                    type="number"
                    value={cropOptions.y}
                    onChange={(e) => setCropOptions(prev => ({ ...prev, y: Math.max(0, parseInt(e.target.value) || 0) }))}
                    min="0"
                    max={originalImage.height - cropOptions.height}
                    className="crop-input"
                  />
                </div>
                <div className="option-group">
                  <label className="option-label">Width:</label>
                  <input
                    type="number"
                    value={cropOptions.width}
                    onChange={(e) => setCropOptions(prev => ({ ...prev, width: Math.min(originalImage.width - prev.x, parseInt(e.target.value) || 1) }))}
                    min="1"
                    max={originalImage.width}
                    className="crop-input"
                  />
                </div>
                <div className="option-group">
                  <label className="option-label">Height:</label>
                  <input
                    type="number"
                    value={cropOptions.height}
                    onChange={(e) => setCropOptions(prev => ({ ...prev, height: Math.min(originalImage.height - prev.y, parseInt(e.target.value) || 1) }))}
                    min="1"
                    max={originalImage.height}
                    className="crop-input"
                  />
                </div>
              </div>
            </div>
          )}

          {mode === 'filter' && (
            <div className="filter-options">
              <div className="option-group">
                <label className="option-label">Filter Type:</label>
                <select
                  value={filterOptions.type}
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, type: e.target.value as FilterType }))}
                  className="filter-select"
                >
                  <option value="grayscale">Grayscale</option>
                  <option value="sepia">Sepia</option>
                  <option value="blur">Blur</option>
                  <option value="brightness">Brightness</option>
                  <option value="contrast">Contrast</option>
                  <option value="saturate">Saturation</option>
                  <option value="invert">Invert</option>
                </select>
              </div>

              <div className="option-group">
                <label className="option-label">Intensity: {filterOptions.intensity}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filterOptions.intensity}
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, intensity: parseInt(e.target.value) }))}
                  className="intensity-slider"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {originalImage && (
        <div className="image-section preview-section">
          <div className="image-previews">
            <div className="preview-container">
              <label className="preview-label">Original Image</label>
              <div className="image-preview">
                <img
                  src={originalImage.dataUrl}
                  alt="Original"
                  className="preview-image"
                />
              </div>
              <div className="image-info">
                <div className="info-item">
                  <span className="info-label">Size:</span>
                  <span className="info-value">{formatFileSize(originalImage.size)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Dimensions:</span>
                  <span className="info-value">{originalImage.width}×{originalImage.height}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Format:</span>
                  <span className="info-value">{originalImage.type}</span>
                </div>
              </div>
            </div>

            {processedImage && (
              <div className="preview-container">
                <label className="preview-label">Processed Image</label>
                <div className="image-preview">
                  <img
                    src={processedImage.dataUrl}
                    alt="Processed"
                    className="preview-image"
                  />
                </div>
                <div className="image-info">
                  <div className="info-item">
                    <span className="info-label">Size:</span>
                    <span className="info-value">{formatFileSize(processedImage.size)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Dimensions:</span>
                    <span className="info-value">{processedImage.width}×{processedImage.height}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Format:</span>
                    <span className="info-value">{processedImage.type}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Size Change:</span>
                    <span className={`info-value ${processedImage.size < originalImage.size ? 'decrease' : 'increase'}`}>
                      {processedImage.size < originalImage.size ? '-' : '+'}
                      {Math.abs(((processedImage.size - originalImage.size) / originalImage.size * 100)).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default ImageTools
