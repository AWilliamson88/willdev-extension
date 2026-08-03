import React, { useState, useCallback } from 'react'
import { useClipboard, useFileUpload, formatFileSize } from '../../utils'
import './base64-image.css'

type ConversionMode = 'encode' | 'decode'

interface ImageInfo {
  name: string
  size: number
  type: string
  dimensions?: { width: number; height: number }
}

const Base64Image: React.FC = () => {
  const [mode, setMode] = useState<ConversionMode>('encode')
  const [base64Text, setBase64Text] = useState('')
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null)
  const [error, setError] = useState('')

  // Supported image formats
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml']

  // Handle file selection logic
  const handleFileSelect = useCallback((file: File) => {
    setError('')

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setBase64Text(result)

      // Get image dimensions
      const img = new Image()
      img.onload = () => {
        setImageInfo({
          name: file.name,
          size: file.size,
          type: file.type,
          dimensions: { width: img.width, height: img.height }
        })
      }
      img.src = result
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsDataURL(file)
  }, [])

  // Use clipboard utility
  const { copy, feedback: copyFeedback } = useClipboard({
    successMessage: 'Copied to clipboard!'
  })

  // Use file upload utility
  const fileUpload = useFileUpload({
    acceptedTypes: supportedFormats,
    maxSize: 10 * 1024 * 1024, // 10MB
    onFileSelect: handleFileSelect,
    onError: (err) => setError(err)
  })

  // Handle Base64 text input for decode mode
  const handleBase64Input = useCallback((text: string) => {
    setBase64Text(text)
    setError('')
    setImageInfo(null)

    if (text.trim()) {
      // Validate Base64 data URL format
      const dataUrlRegex = /^data:image\/(jpeg|jpg|png|gif|webp|bmp|svg\+xml);base64,(.+)$/
      const match = text.match(dataUrlRegex)
      
      if (!match) {
        setError('Invalid Base64 image format. Expected format: data:image/[type];base64,[data]')
        return
      }

      const [, imageType, base64Data] = match
      
      // Validate Base64 data
      try {
        atob(base64Data)
        
        // Try to load as image to validate
        const img = new Image()
        img.onload = () => {
          setImageInfo({
            name: `decoded-image.${imageType === 'svg+xml' ? 'svg' : imageType}`,
            size: Math.round((base64Data.length * 3) / 4), // Approximate original size
            type: `image/${imageType}`,
            dimensions: { width: img.width, height: img.height }
          })
        }
        img.onerror = () => {
          setError('Invalid image data')
        }
        img.src = text
      } catch (e) {
        setError('Invalid Base64 data')
      }
    }
  }, [])

  // Copy Base64 to clipboard
  const copyBase64 = useCallback(async () => {
    if (!base64Text.trim()) return
    await copy(base64Text, 'Base64 data copied to clipboard!')
  }, [base64Text, copy])

  // Download image from Base64
  const downloadImage = useCallback(() => {
    if (!base64Text.trim() || !imageInfo) return
    
    const link = document.createElement('a')
    link.href = base64Text
    link.download = imageInfo.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [base64Text, imageInfo])

  // Clear all data
  const clearAll = useCallback(() => {
    setBase64Text('')
    setImageInfo(null)
    setError('')
    fileUpload.clearFiles()
  }, [fileUpload])

  return (
    <div className="base64-image">
      <h2>Base64 Image Encoder/Decoder</h2>

      <div className="base64-section base64-controls-section">
        <div className="mode-toggle">
          <label className="mode-label">Mode:</label>
          <button 
            className={`mode-button ${mode === 'encode' ? 'active' : ''}`}
            onClick={() => setMode('encode')}
          >
            Encode
          </button>
          <button 
            className={`mode-button ${mode === 'decode' ? 'active' : ''}`}
            onClick={() => setMode('decode')}
          >
            Decode
          </button>
        </div>

        <div className="action-buttons">
          <button className="copy-button" onClick={copyBase64} disabled={!base64Text.trim()}>
            📋 Copy Base64
          </button>
          {mode === 'decode' && imageInfo && (
            <button className="download-button" onClick={downloadImage}>
              💾 Download Image
            </button>
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
          {error}
        </div>
      )}

      {mode === 'encode' ? (
        <div className="base64-section upload-section">
          <div
            className={`upload-area ${fileUpload.isDragOver ? 'drag-over' : ''}`}
            {...fileUpload.dragDropProps}
            onClick={fileUpload.openFilePicker}
          >
            <div className="upload-content">
              <span className="upload-icon">📁</span>
              <p className="upload-text">
                Drag and drop an image here, or click to select
              </p>
              <p className="upload-formats">
                Supported formats: JPEG, PNG, GIF, WebP, BMP, SVG
              </p>
              <p className="upload-limit">
                Maximum file size: 10MB
              </p>
            </div>
            <input
              {...fileUpload.inputProps}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      ) : (
        <div className="base64-section decode-section">
          <label className="decode-label">Base64 Image Data</label>
          <textarea
            value={base64Text}
            onChange={(e) => handleBase64Input(e.target.value)}
            placeholder="Paste Base64 image data here (data:image/[type];base64,[data])"
            className="base64-textarea"
          />
        </div>
      )}

      {imageInfo && (
        <div className="base64-section image-info-section">
          <label className="info-label">Image Information</label>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-key">Name:</span>
              <span className="info-value">{imageInfo.name}</span>
            </div>
            <div className="info-item">
              <span className="info-key">Type:</span>
              <span className="info-value">{imageInfo.type}</span>
            </div>
            <div className="info-item">
              <span className="info-key">Size:</span>
              <span className="info-value">{formatFileSize(imageInfo.size)}</span>
            </div>
            {imageInfo.dimensions && (
              <div className="info-item">
                <span className="info-key">Dimensions:</span>
                <span className="info-value">{imageInfo.dimensions.width} × {imageInfo.dimensions.height}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-key">Base64 Length:</span>
              <span className="info-value">{base64Text.length.toLocaleString()} chars</span>
            </div>
          </div>
        </div>
      )}

      {base64Text && (
        <div className="base64-section preview-section">
          <label className="preview-label">Image Preview</label>
          <div className="image-preview">
            <img 
              src={base64Text} 
              alt="Preview" 
              className="preview-image"
              onError={() => setError('Failed to display image')}
            />
          </div>
        </div>
      )}

      {base64Text && (
        <div className="base64-section base64-output-section">
          <label className="output-label">Base64 Data ({base64Text.length.toLocaleString()} characters)</label>
          <textarea
            value={base64Text}
            readOnly
            className="base64-output"
            placeholder="Base64 data will appear here..."
          />
        </div>
      )}
    </div>
  )
}

export default Base64Image
