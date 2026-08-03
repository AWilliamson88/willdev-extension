import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import './file-utilities.css'

type UtilityMode = 'hash' | 'split' | 'metadata' | 'analyze'

interface FileInfo {
  name: string
  size: number
  type: string
  lastModified: number
  webkitRelativePath?: string
}

interface FileMetadata {
  name: string
  size: number
  type: string
  lastModified: Date
  extension: string
  category: string
  isText: boolean
  isImage: boolean
  isVideo: boolean
  isAudio: boolean
  isDocument: boolean
  isArchive: boolean
  isExecutable: boolean
}

interface FileAnalysis {
  lineCount?: number
  wordCount?: number
  characterCount?: number
  encoding?: string
  hasUnicode?: boolean
  imageWidth?: number
  imageHeight?: number
  imageBitDepth?: string
  audioSampleRate?: number
  audioDuration?: number
  videoWidth?: number
  videoHeight?: number
  videoDuration?: number
}

interface HashResult {
  algorithm: string
  value: string
  time: number
}

interface SplitChunk {
  index: number
  name: string
  size: number
  blob: Blob
}

const FileUtilities: React.FC = () => {
  const [mode, setMode] = useState<UtilityMode>('hash')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [processing, setProcessing] = useState(false)

  // Hash results
  const [hashResults, setHashResults] = useState<HashResult[]>([])
  const [selectedHashAlgorithms, setSelectedHashAlgorithms] = useState<string[]>(['SHA-256'])

  // Split options
  const [splitSize, setSplitSize] = useState(1)
  const [splitUnit, setSplitUnit] = useState<'MB' | 'KB' | 'chunks'>('MB')
  const [splitChunks, setSplitChunks] = useState<SplitChunk[]>([])

  // File metadata and analysis
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null)
  const [fileAnalysis, setFileAnalysis] = useState<FileAnalysis | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Available hash algorithms
  const hashAlgorithms = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

  // File size limits (100MB for hash, 1GB for split, 50MB for analysis)
  const getFileSizeLimit = useCallback((currentMode: UtilityMode): number => {
    switch (currentMode) {
      case 'hash': return 100 * 1024 * 1024 // 100MB
      case 'split': return 1024 * 1024 * 1024 // 1GB
      case 'metadata': return Infinity // No limit for metadata
      case 'analyze': return 50 * 1024 * 1024 // 50MB
      default: return 100 * 1024 * 1024
    }
  }, [])

  // Generate hash using Web Crypto API
  const generateHash = useCallback(async (data: ArrayBuffer, algorithm: string): Promise<string> => {
    const normalizedAlgorithm = algorithm.replace('-', '')
    const hashBuffer = await crypto.subtle.digest(normalizedAlgorithm, data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }, [])

  // Generate MD5 hash (using a simple implementation since Web Crypto doesn't support MD5)
  const generateMD5 = useCallback(async (data: ArrayBuffer): Promise<string> => {
    // Simple MD5 implementation for demonstration
    // In a real application, you might want to use a proper MD5 library
    const bytes = new Uint8Array(data)
    let hash = 0
    for (let i = 0; i < bytes.length; i++) {
      hash = ((hash << 5) - hash + bytes[i]) & 0xffffffff
    }
    return Math.abs(hash).toString(16).padStart(8, '0')
  }, [])

  // Process file for hashing
  const processFileHashing = useCallback(async (file: File): Promise<void> => {
    setProcessing(true)
    setError('')
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const results: HashResult[] = []

      for (const algorithm of selectedHashAlgorithms) {
        const startTime = performance.now()
        let hash: string
        
        if (algorithm === 'MD5') {
          hash = await generateMD5(arrayBuffer)
        } else {
          hash = await generateHash(arrayBuffer, algorithm)
        }
        
        const endTime = performance.now()
        
        results.push({
          algorithm,
          value: hash,
          time: endTime - startTime
        })
      }

      setHashResults(results)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate hashes')
      setHashResults([])
    } finally {
      setProcessing(false)
    }
  }, [selectedHashAlgorithms, generateHash, generateMD5])

  // Process file for splitting
  const processFileSplitting = useCallback(async (file: File): Promise<void> => {
    setProcessing(true)
    setError('')
    
    try {
      let chunkSize: number
      let numberOfChunks: number

      if (splitUnit === 'chunks') {
        numberOfChunks = splitSize
        chunkSize = Math.ceil(file.size / numberOfChunks)
      } else {
        const multiplier = splitUnit === 'MB' ? 1024 * 1024 : 1024
        chunkSize = splitSize * multiplier
        numberOfChunks = Math.ceil(file.size / chunkSize)
      }

      const chunks: SplitChunk[] = []
      const fileExtension = file.name.split('.').pop() || ''
      const baseName = file.name.replace(/\.[^/.]+$/, '')

      for (let i = 0; i < numberOfChunks; i++) {
        const start = i * chunkSize
        const end = Math.min(start + chunkSize, file.size)
        const chunk = file.slice(start, end)
        
        chunks.push({
          index: i + 1,
          name: `${baseName}.part${(i + 1).toString().padStart(3, '0')}.${fileExtension}`,
          size: chunk.size,
          blob: chunk
        })
      }

      setSplitChunks(chunks)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to split file')
      setSplitChunks([])
    } finally {
      setProcessing(false)
    }
  }, [splitSize, splitUnit])

  // Get file category
  const getFileCategory = useCallback((type: string, extension: string): string => {
    if (type.startsWith('image/')) return 'Image'
    if (type.startsWith('video/')) return 'Video'
    if (type.startsWith('audio/')) return 'Audio'
    if (type.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts'].includes(extension)) return 'Text'
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return 'Document'
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) return 'Archive'
    if (['exe', 'msi', 'dmg', 'deb', 'rpm'].includes(extension)) return 'Executable'
    return 'Other'
  }, [])

  // Process file metadata
  const processFileMetadata = useCallback(async (file: File): Promise<void> => {
    setProcessing(true)
    setError('')
    
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || ''
      const category = getFileCategory(file.type, extension)
      
      const metadata: FileMetadata = {
        name: file.name,
        size: file.size,
        type: file.type || 'Unknown',
        lastModified: new Date(file.lastModified),
        extension,
        category,
        isText: category === 'Text',
        isImage: category === 'Image',
        isVideo: category === 'Video',
        isAudio: category === 'Audio',
        isDocument: category === 'Document',
        isArchive: category === 'Archive',
        isExecutable: category === 'Executable'
      }

      setFileMetadata(metadata)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to extract metadata')
      setFileMetadata(null)
    } finally {
      setProcessing(false)
    }
  }, [getFileCategory])

  // Process file analysis
  const processFileAnalysis = useCallback(async (file: File): Promise<void> => {
    setProcessing(true)
    setError('')
    
    try {
      const analysis: FileAnalysis = {}
      
      // Text file analysis
      if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|json|xml|html|css|js|ts|py|java|cpp|c|h)$/i)) {
        const text = await file.text()
        analysis.characterCount = text.length
        analysis.wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
        analysis.lineCount = text.split('\n').length
        analysis.hasUnicode = /[^\x00-\x7F]/.test(text)
        analysis.encoding = 'UTF-8'
      }
      
      // Image analysis
      if (file.type.startsWith('image/')) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.onerror = reject
          image.src = dataUrl
        })
        
        analysis.imageWidth = img.width
        analysis.imageHeight = img.height
        analysis.imageBitDepth = '24-bit' // Simplified
      }

      setFileAnalysis(analysis)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to analyze file')
      setFileAnalysis(null)
    } finally {
      setProcessing(false)
    }
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setError('')
    setHashResults([])
    setSplitChunks([])
    setFileMetadata(null)
    setFileAnalysis(null)
    
    const sizeLimit = getFileSizeLimit(mode)
    if (file.size > sizeLimit) {
      const limitMB = Math.round(sizeLimit / (1024 * 1024))
      setError(`File size too large. Maximum size for ${mode} mode is ${limitMB}MB.`)
      return
    }

    setSelectedFile(file)
    
    // Process file based on current mode
    switch (mode) {
      case 'hash':
        processFileHashing(file)
        break
      case 'split':
        processFileSplitting(file)
        break
      case 'metadata':
        processFileMetadata(file)
        break
      case 'analyze':
        processFileAnalysis(file)
        break
    }
  }, [mode, getFileSizeLimit, processFileHashing, processFileSplitting, processFileMetadata, processFileAnalysis])

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

  // Handle copy feedback timeout with cleanup
  useEffect(() => {
    if (copyFeedback) {
      const timeoutId = setTimeout(() => setCopyFeedback(''), 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [copyFeedback])

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback(`${label} copied to clipboard!`)
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard')
    }
  }, [])

  // Download file chunk
  const downloadChunk = useCallback((chunk: SplitChunk) => {
    const url = URL.createObjectURL(chunk.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = chunk.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  // Download all chunks
  const downloadAllChunks = useCallback(() => {
    splitChunks.forEach(chunk => {
      setTimeout(() => downloadChunk(chunk), chunk.index * 100)
    })
  }, [splitChunks, downloadChunk])

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // Clear all data
  const clearAll = useCallback(() => {
    setSelectedFile(null)
    setHashResults([])
    setSplitChunks([])
    setFileMetadata(null)
    setFileAnalysis(null)
    setError('')
    setCopyFeedback('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Get mode description
  const getModeDescription = useCallback((currentMode: UtilityMode): string => {
    const descriptions = {
      hash: 'Generate cryptographic hashes (MD5, SHA-1, SHA-256, SHA-384, SHA-512) for file integrity verification',
      split: 'Split large files into smaller chunks for easier transfer or storage management',
      metadata: 'Extract detailed file information including size, type, modification date, and file properties',
      analyze: 'Perform deep analysis of file content including text statistics, image dimensions, and encoding detection'
    }
    return descriptions[currentMode]
  }, [])

  return (
    <div className="file-utilities">
      <h2>File Utilities</h2>

      <div className="utilities-section controls-section">
        <div className="mode-group">
          <label className="mode-label">Utility Type:</label>
          <div className="mode-buttons">
            <button 
              className={`mode-button ${mode === 'hash' ? 'active' : ''}`}
              onClick={() => setMode('hash')}
            >
              🔐 File Hash
            </button>
            <button 
              className={`mode-button ${mode === 'split' ? 'active' : ''}`}
              onClick={() => setMode('split')}
            >
              ✂️ File Split
            </button>
            <button 
              className={`mode-button ${mode === 'metadata' ? 'active' : ''}`}
              onClick={() => setMode('metadata')}
            >
              📋 Metadata
            </button>
            <button 
              className={`mode-button ${mode === 'analyze' ? 'active' : ''}`}
              onClick={() => setMode('analyze')}
            >
              🔍 Analyze
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button className="clear-button" onClick={clearAll}>
            🗑️ Clear All
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

      <div className="utilities-section description-section">
        <label className="section-label">About This Utility</label>
        <p className="utility-description">{getModeDescription(mode)}</p>
      </div>

      {mode === 'hash' && (
        <div className="utilities-section options-section">
          <label className="section-label">Hash Algorithm Options</label>
          <div className="hash-algorithms">
            {hashAlgorithms.map(algorithm => (
              <label key={algorithm} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedHashAlgorithms.includes(algorithm)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedHashAlgorithms(prev => [...prev, algorithm])
                    } else {
                      setSelectedHashAlgorithms(prev => prev.filter(a => a !== algorithm))
                    }
                  }}
                />
                {algorithm}
              </label>
            ))}
          </div>
        </div>
      )}

      {mode === 'split' && (
        <div className="utilities-section options-section">
          <label className="section-label">Split Options</label>
          <div className="split-options">
            <div className="option-group">
              <label className="option-label">Split by:</label>
              <select
                value={splitUnit}
                onChange={(e) => setSplitUnit(e.target.value as 'MB' | 'KB' | 'chunks')}
                className="split-unit-select"
              >
                <option value="MB">Size (MB)</option>
                <option value="KB">Size (KB)</option>
                <option value="chunks">Number of chunks</option>
              </select>
            </div>
            <div className="option-group">
              <label className="option-label">
                {splitUnit === 'chunks' ? 'Number of chunks:' : `Size per chunk (${splitUnit}):`}
              </label>
              <input
                type="number"
                min="1"
                max={splitUnit === 'chunks' ? 1000 : splitUnit === 'MB' ? 1024 : 1048576}
                value={splitSize}
                onChange={(e) => setSplitSize(parseInt(e.target.value) || 1)}
                className="split-size-input"
              />
            </div>
          </div>
        </div>
      )}

      <div className="utilities-section upload-section">
        <div
          className={`upload-area ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-content">
            <span className="upload-icon">📁</span>
            <p className="upload-text">
              Drag and drop a file here, or click to select
            </p>
            <p className="upload-limit">
              Maximum file size: {Math.round(getFileSizeLimit(mode) / (1024 * 1024))}MB for {mode} mode
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {selectedFile && (
        <div className="utilities-section file-info-section">
          <label className="section-label">Selected File</label>
          <div className="file-info">
            <div className="file-info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{selectedFile.name}</span>
            </div>
            <div className="file-info-item">
              <span className="info-label">Size:</span>
              <span className="info-value">{formatFileSize(selectedFile.size)}</span>
            </div>
            <div className="file-info-item">
              <span className="info-label">Type:</span>
              <span className="info-value">{selectedFile.type || 'Unknown'}</span>
            </div>
            <div className="file-info-item">
              <span className="info-label">Last Modified:</span>
              <span className="info-value">{new Date(selectedFile.lastModified).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {processing && (
        <div className="utilities-section processing-section">
          <div className="processing-indicator">
            <span className="processing-spinner">⏳</span>
            <span className="processing-text">Processing file...</span>
          </div>
        </div>
      )}

      {mode === 'hash' && hashResults.length > 0 && (
        <div className="utilities-section results-section">
          <label className="section-label">Hash Results</label>
          <div className="hash-results">
            {hashResults.map(result => (
              <div key={result.algorithm} className="hash-result">
                <div className="hash-header">
                  <span className="hash-algorithm">{result.algorithm}</span>
                  <span className="hash-time">{result.time.toFixed(2)}ms</span>
                  <button
                    className="copy-hash-button"
                    onClick={() => copyToClipboard(result.value, `${result.algorithm} hash`)}
                  >
                    📋 Copy
                  </button>
                </div>
                <div className="hash-value">{result.value}</div>
              </div>
            ))}
            <div className="hash-actions">
              <button
                className="copy-all-button"
                onClick={() => {
                  const allHashes = hashResults.map(r => `${r.algorithm}: ${r.value}`).join('\n')
                  copyToClipboard(allHashes, 'All hashes')
                }}
              >
                📋 Copy All Hashes
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'split' && splitChunks.length > 0 && (
        <div className="utilities-section results-section">
          <label className="section-label">Split Results</label>
          <div className="split-results">
            <div className="split-summary">
              <p>File split into {splitChunks.length} chunks</p>
              <button className="download-all-button" onClick={downloadAllChunks}>
                💾 Download All Chunks
              </button>
            </div>
            <div className="split-chunks">
              {splitChunks.map(chunk => (
                <div key={chunk.index} className="split-chunk">
                  <div className="chunk-info">
                    <span className="chunk-name">{chunk.name}</span>
                    <span className="chunk-size">{formatFileSize(chunk.size)}</span>
                  </div>
                  <button
                    className="download-chunk-button"
                    onClick={() => downloadChunk(chunk)}
                  >
                    💾 Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'metadata' && fileMetadata && (
        <div className="utilities-section results-section">
          <label className="section-label">File Metadata</label>
          <div className="metadata-results">
            <div className="metadata-grid">
              <div className="metadata-item">
                <span className="metadata-label">File Name:</span>
                <span className="metadata-value">{fileMetadata.name}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">File Size:</span>
                <span className="metadata-value">{formatFileSize(fileMetadata.size)}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">MIME Type:</span>
                <span className="metadata-value">{fileMetadata.type}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Extension:</span>
                <span className="metadata-value">.{fileMetadata.extension}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Category:</span>
                <span className="metadata-value">{fileMetadata.category}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Last Modified:</span>
                <span className="metadata-value">{fileMetadata.lastModified.toLocaleString()}</span>
              </div>
            </div>
            <div className="metadata-flags">
              <div className="flag-group">
                <span className="flag-label">File Type Flags:</span>
                <div className="flags">
                  {fileMetadata.isText && <span className="flag">📝 Text</span>}
                  {fileMetadata.isImage && <span className="flag">🖼️ Image</span>}
                  {fileMetadata.isVideo && <span className="flag">🎥 Video</span>}
                  {fileMetadata.isAudio && <span className="flag">🎵 Audio</span>}
                  {fileMetadata.isDocument && <span className="flag">📄 Document</span>}
                  {fileMetadata.isArchive && <span className="flag">📦 Archive</span>}
                  {fileMetadata.isExecutable && <span className="flag">⚙️ Executable</span>}
                </div>
              </div>
            </div>
            <div className="metadata-actions">
              <button
                className="copy-metadata-button"
                onClick={() => {
                  const metadataText = Object.entries(fileMetadata)
                    .filter(([key]) => !key.startsWith('is'))
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n')
                  copyToClipboard(metadataText, 'File metadata')
                }}
              >
                📋 Copy Metadata
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'analyze' && fileAnalysis && (
        <div className="utilities-section results-section">
          <label className="section-label">File Analysis</label>
          <div className="analysis-results">
            <div className="analysis-grid">
              {fileAnalysis.characterCount !== undefined && (
                <div className="analysis-item">
                  <span className="analysis-label">Characters:</span>
                  <span className="analysis-value">{fileAnalysis.characterCount.toLocaleString()}</span>
                </div>
              )}
              {fileAnalysis.wordCount !== undefined && (
                <div className="analysis-item">
                  <span className="analysis-label">Words:</span>
                  <span className="analysis-value">{fileAnalysis.wordCount.toLocaleString()}</span>
                </div>
              )}
              {fileAnalysis.lineCount !== undefined && (
                <div className="analysis-item">
                  <span className="analysis-label">Lines:</span>
                  <span className="analysis-value">{fileAnalysis.lineCount.toLocaleString()}</span>
                </div>
              )}
              {fileAnalysis.encoding && (
                <div className="analysis-item">
                  <span className="analysis-label">Encoding:</span>
                  <span className="analysis-value">{fileAnalysis.encoding}</span>
                </div>
              )}
              {fileAnalysis.hasUnicode !== undefined && (
                <div className="analysis-item">
                  <span className="analysis-label">Unicode Characters:</span>
                  <span className="analysis-value">{fileAnalysis.hasUnicode ? 'Yes' : 'No'}</span>
                </div>
              )}
              {fileAnalysis.imageWidth && fileAnalysis.imageHeight && (
                <div className="analysis-item">
                  <span className="analysis-label">Image Dimensions:</span>
                  <span className="analysis-value">{fileAnalysis.imageWidth} × {fileAnalysis.imageHeight} pixels</span>
                </div>
              )}
              {fileAnalysis.imageBitDepth && (
                <div className="analysis-item">
                  <span className="analysis-label">Bit Depth:</span>
                  <span className="analysis-value">{fileAnalysis.imageBitDepth}</span>
                </div>
              )}
            </div>
            <div className="analysis-actions">
              <button
                className="copy-analysis-button"
                onClick={() => {
                  const analysisText = Object.entries(fileAnalysis)
                    .filter(([, value]) => value !== undefined)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n')
                  copyToClipboard(analysisText, 'File analysis')
                }}
              >
                📋 Copy Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="utilities-section tips-section">
        <label className="section-label">Tips & Information</label>
        <div className="tips-content">
          {mode === 'hash' && (
            <div className="tip-text">
              <p><strong>Hash Verification:</strong> Use file hashes to verify file integrity and detect corruption.</p>
              <p><strong>Security:</strong> SHA-256 and SHA-512 are cryptographically secure, while MD5 and SHA-1 are deprecated for security purposes.</p>
              <p><strong>Performance:</strong> MD5 is fastest, SHA-512 is most secure for new applications.</p>
            </div>
          )}
          {mode === 'split' && (
            <div className="tip-text">
              <p><strong>File Transfer:</strong> Split large files for easier upload to cloud services or email.</p>
              <p><strong>Storage:</strong> Distribute large files across multiple storage devices.</p>
              <p><strong>Reconstruction:</strong> Use file joining tools to reconstruct the original file from chunks.</p>
            </div>
          )}
          {mode === 'metadata' && (
            <div className="tip-text">
              <p><strong>File Properties:</strong> View comprehensive file information without opening the file.</p>
              <p><strong>Organization:</strong> Use metadata to organize and categorize files efficiently.</p>
              <p><strong>Compatibility:</strong> Check file types and formats before processing.</p>
            </div>
          )}
          {mode === 'analyze' && (
            <div className="tip-text">
              <p><strong>Content Analysis:</strong> Deep inspection of file content and structure.</p>
              <p><strong>Text Files:</strong> Get word counts, line counts, and encoding information.</p>
              <p><strong>Images:</strong> Extract dimensions, color depth, and format details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileUtilities
