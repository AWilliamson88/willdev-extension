import React, { useState, useCallback, useEffect, useRef } from 'react'
import SparkMD5 from 'spark-md5'
import './hash-generators.css'

type HashType = 'md5' | 'sha1' | 'sha256' | 'sha512'
type InputMode = 'text' | 'file'

interface HashResult {
  type: HashType
  value: string
  time: number
}

interface FileInfo {
  name: string
  size: number
  type: string
}

const HashGenerators: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [inputText, setInputText] = useState('')
  const [selectedHashes, setSelectedHashes] = useState<HashType[]>(['md5', 'sha1', 'sha256', 'sha512'])
  const [hashResults, setHashResults] = useState<HashResult[]>([])
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [copyFeedback, setCopyFeedback] = useState('')
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMountedRef = useRef(true)

  // Hash type configurations
  const hashConfigs = {
    md5: { name: 'MD5', algorithm: 'MD5', color: '#e74c3c' },
    sha1: { name: 'SHA-1', algorithm: 'SHA-1', color: '#f39c12' },
    sha256: { name: 'SHA-256', algorithm: 'SHA-256', color: '#27ae60' },
    sha512: { name: 'SHA-512', algorithm: 'SHA-512', color: '#8e44ad' }
  }

  // MD5 hash generation using spark-md5 (battle-tested library)
  const generateMD5 = useCallback((data: ArrayBuffer): string => {
    const spark = new SparkMD5.ArrayBuffer()
    spark.append(data)
    return spark.end()
  }, [])

  // Generate hash using Web Crypto API or spark-md5 for MD5
  const generateHash = useCallback(async (data: ArrayBuffer, algorithm: string): Promise<string> => {
    if (algorithm === 'MD5') {
      // Use spark-md5 library (Web Crypto API doesn't support MD5)
      return generateMD5(data)
    }

    try {
      const hashBuffer = await crypto.subtle.digest(algorithm, data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      throw new Error(`Failed to generate ${algorithm} hash: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [generateMD5])

  // Process text input
  const processTextInput = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) {
      setHashResults([])
      return
    }

    setIsProcessing(true)
    setError('')
    
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      const results: HashResult[] = []

      for (const hashType of selectedHashes) {
        const startTime = performance.now()
        const hash = await generateHash(data, hashConfigs[hashType].algorithm)
        const endTime = performance.now()
        
        results.push({
          type: hashType,
          value: hash,
          time: endTime - startTime
        })
      }

      if (isMountedRef.current) {
        setHashResults(results)
      }
    } catch (error) {
      if (isMountedRef.current) {
        setError(error instanceof Error ? error.message : 'Failed to generate hashes')
        setHashResults([])
      }
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false)
      }
    }
  }, [selectedHashes, generateHash, hashConfigs])

  // Process file input
  const processFileInput = useCallback(async (file: File): Promise<void> => {
    setIsProcessing(true)
    setError('')
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const results: HashResult[] = []

      for (const hashType of selectedHashes) {
        const startTime = performance.now()
        const hash = await generateHash(arrayBuffer, hashConfigs[hashType].algorithm)
        const endTime = performance.now()
        
        results.push({
          type: hashType,
          value: hash,
          time: endTime - startTime
        })
      }

      if (isMountedRef.current) {
        setHashResults(results)
        setFileInfo({
          name: file.name,
          size: file.size,
          type: file.type || 'Unknown'
        })
      }
    } catch (error) {
      if (isMountedRef.current) {
        setError(error instanceof Error ? error.message : 'Failed to generate hashes')
        setHashResults([])
        setFileInfo(null)
      }
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false)
      }
    }
  }, [selectedHashes, generateHash, hashConfigs])

  // Handle real-time processing for text
  useEffect(() => {
    if (realTimeEnabled && inputMode === 'text') {
      processTextInput(inputText)
    }
  }, [inputText, selectedHashes, realTimeEnabled, inputMode, processTextInput])

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

  // Handle manual processing
  const handleProcess = useCallback(() => {
    if (inputMode === 'text') {
      processTextInput(inputText)
    }
  }, [inputMode, inputText, processTextInput])

  // Handle hash type selection
  const toggleHashType = useCallback((hashType: HashType) => {
    setSelectedHashes(prev => 
      prev.includes(hashType) 
        ? prev.filter(h => h !== hashType)
        : [...prev, hashType]
    )
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setError('')
    
    // 100MB limit for hash generation
    if (file.size > 100 * 1024 * 1024) {
      setError('File size too large. Maximum size is 100MB.')
      return
    }

    processFileInput(file)
  }, [processFileInput])

  // Handle drag and drop
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

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Copy hash to clipboard
  const copyHash = useCallback(async (hash: string, type: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopyFeedback(`${type} hash copied to clipboard!`)
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard')
    }
  }, [])

  // Copy all hashes
  const copyAllHashes = useCallback(async () => {
    if (hashResults.length === 0) return

    const allHashes = hashResults.map(result =>
      `${hashConfigs[result.type].name}: ${result.value}`
    ).join('\n')

    try {
      await navigator.clipboard.writeText(allHashes)
      setCopyFeedback('All hashes copied to clipboard!')
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard')
    }
  }, [hashResults, hashConfigs])

  // Clear all
  const clearAll = useCallback(() => {
    setInputText('')
    setHashResults([])
    setError('')
    setCopyFeedback('')
    setFileInfo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Load sample text
  const loadSample = useCallback(() => {
    const sampleText = `Hello, World! This is a sample text for hash generation.
It contains multiple lines and various characters: 123456789
Special characters: !@#$%^&*()_+-=[]{}|;:,.<>?
Unicode characters: 🔒🔑💻🌟✨`
    setInputText(sampleText)
    setInputMode('text')
  }, [])

  return (
    <div className="hash-generators">
      <h2>Hash Generators</h2>

      <div className="hash-section controls-section">
        <div className="controls-grid">
          <div className="input-mode-toggle">
            <label className="mode-label">Input Mode:</label>
            <button 
              className={`mode-button ${inputMode === 'text' ? 'active' : ''}`}
              onClick={() => setInputMode('text')}
            >
              📝 Text
            </button>
            <button 
              className={`mode-button ${inputMode === 'file' ? 'active' : ''}`}
              onClick={() => setInputMode('file')}
            >
              📁 File
            </button>
          </div>

          <div className="hash-type-selection">
            <label className="selection-label">Hash Types:</label>
            <div className="hash-checkboxes">
              {(Object.keys(hashConfigs) as HashType[]).map(hashType => (
                <label key={hashType} className="hash-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedHashes.includes(hashType)}
                    onChange={() => toggleHashType(hashType)}
                  />
                  <span 
                    className="checkbox-label"
                    style={{ color: hashConfigs[hashType].color }}
                  >
                    {hashConfigs[hashType].name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {inputMode === 'text' && (
            <div className="text-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={realTimeEnabled}
                  onChange={(e) => setRealTimeEnabled(e.target.checked)}
                />
                Real-time processing
              </label>
            </div>
          )}
        </div>

        <div className="action-buttons">
          {!realTimeEnabled && inputMode === 'text' && (
            <button className="process-button" onClick={handleProcess} disabled={isProcessing}>
              {isProcessing ? '⏳ Processing...' : '🔄 Generate Hashes'}
            </button>
          )}
          <button className="sample-button" onClick={loadSample}>
            📄 Load Sample
          </button>
          <button 
            className="copy-button" 
            onClick={copyAllHashes} 
            disabled={hashResults.length === 0}
          >
            📋 Copy All
          </button>
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

      {inputMode === 'text' ? (
        <div className="hash-section input-section">
          <div className="text-field">
            <div className="text-field-header">
              <label className="text-field-label">Text Input</label>
              <span className="char-count">{inputText.length} chars</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to generate hashes..."
              className="input-textarea"
              rows={8}
            />
          </div>
        </div>
      ) : (
        <div className="hash-section upload-section">
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
                Maximum file size: 100MB
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
      )}

      {fileInfo && (
        <div className="hash-section file-info-section">
          <label className="section-label">File Information</label>
          <div className="file-info-grid">
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{fileInfo.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Size:</span>
              <span className="info-value">
                {fileInfo.size < 1024 ? `${fileInfo.size} B` : 
                 fileInfo.size < 1024 * 1024 ? `${(fileInfo.size / 1024).toFixed(1)} KB` : 
                 `${(fileInfo.size / (1024 * 1024)).toFixed(1)} MB`}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Type:</span>
              <span className="info-value">{fileInfo.type}</span>
            </div>
          </div>
        </div>
      )}

      {hashResults.length > 0 && (
        <div className="hash-section results-section">
          <label className="section-label">Hash Results</label>
          <div className="hash-results">
            {hashResults.map((result) => (
              <div key={result.type} className="hash-result-item">
                <div className="hash-header">
                  <span 
                    className="hash-type"
                    style={{ color: hashConfigs[result.type].color }}
                  >
                    {hashConfigs[result.type].name}
                  </span>
                  <div className="hash-actions">
                    <span className="hash-time">
                      {result.time.toFixed(2)}ms
                    </span>
                    <button 
                      className="copy-hash-button"
                      onClick={() => copyHash(result.value, hashConfigs[result.type].name)}
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div className="hash-value">
                  {result.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedHashes.length === 0 && (
        <div className="hash-section warning-section">
          <div className="warning-message">
            ⚠️ Please select at least one hash type to generate hashes.
          </div>
        </div>
      )}
    </div>
  )
}

export default HashGenerators
