import React, { useState, useCallback, useEffect } from 'react'
import './json-formatter.css'

type FormatMode = 'format' | 'minify' | 'validate'

interface JsonStats {
  characters: number
  lines: number
  size: string
  keys: number
  arrays: number
  objects: number
}

const JsonFormatter: React.FC = () => {
  const [inputJson, setInputJson] = useState('')
  const [outputJson, setOutputJson] = useState('')
  const [mode, setMode] = useState<FormatMode>('format')
  const [indentSize, setIndentSize] = useState(2)
  const [sortKeys, setSortKeys] = useState(false)
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [copyFeedback, setCopyFeedback] = useState('')
  const [error, setError] = useState('')
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [stats, setStats] = useState<JsonStats | null>(null)

  // Format JSON with specified indentation
  const formatJson = useCallback((jsonString: string, indent: number, sort: boolean): string => {
    if (!jsonString.trim()) return ''
    
    try {
      const parsed = JSON.parse(jsonString)
      const formatted = JSON.stringify(parsed, sort ? Object.keys(parsed).sort() : null, indent)
      return formatted
    } catch (error) {
      throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  // Minify JSON
  const minifyJson = useCallback((jsonString: string): string => {
    if (!jsonString.trim()) return ''
    
    try {
      const parsed = JSON.parse(jsonString)
      return JSON.stringify(parsed)
    } catch (error) {
      throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  // Validate JSON
  const validateJson = useCallback((jsonString: string): { valid: boolean; error?: string } => {
    if (!jsonString.trim()) return { valid: true }
    
    try {
      JSON.parse(jsonString)
      return { valid: true }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }, [])

  // Calculate JSON statistics
  const calculateStats = useCallback((jsonString: string): JsonStats | null => {
    if (!jsonString.trim()) return null
    
    try {
      const parsed = JSON.parse(jsonString)
      
      const countElements = (obj: any): { keys: number; arrays: number; objects: number } => {
        let keys = 0
        let arrays = 0
        let objects = 0
        
        if (Array.isArray(obj)) {
          arrays++
          obj.forEach(item => {
            const counts = countElements(item)
            keys += counts.keys
            arrays += counts.arrays
            objects += counts.objects
          })
        } else if (obj && typeof obj === 'object') {
          objects++
          Object.keys(obj).forEach(key => {
            keys++
            const counts = countElements(obj[key])
            keys += counts.keys
            arrays += counts.arrays
            objects += counts.objects
          })
        }
        
        return { keys, arrays, objects }
      }
      
      const counts = countElements(parsed)
      const lines = jsonString.split('\n').length
      const characters = jsonString.length
      const bytes = new TextEncoder().encode(jsonString).length
      
      return {
        characters,
        lines,
        size: bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`,
        keys: counts.keys,
        arrays: counts.arrays,
        objects: counts.objects
      }
    } catch (error) {
      return null
    }
  }, [])

  // Process JSON based on current mode
  const processJson = useCallback((jsonString: string): string => {
    try {
      setError('')
      setIsValid(null)
      
      if (!jsonString.trim()) {
        setIsValid(null)
        setStats(null)
        return ''
      }
      
      // Validate first
      const validation = validateJson(jsonString)
      setIsValid(validation.valid)
      
      if (!validation.valid) {
        setError(validation.error || 'Invalid JSON')
        setStats(null)
        return ''
      }
      
      // Calculate stats
      setStats(calculateStats(jsonString))
      
      // Process based on mode
      switch (mode) {
        case 'format':
          return formatJson(jsonString, indentSize, sortKeys)
        case 'minify':
          return minifyJson(jsonString)
        case 'validate':
          return jsonString // Return original for validation mode
        default:
          return jsonString
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      setIsValid(false)
      setStats(null)
      return ''
    }
  }, [mode, indentSize, sortKeys, validateJson, formatJson, minifyJson, calculateStats])

  // Handle real-time processing
  useEffect(() => {
    if (realTimeEnabled) {
      setOutputJson(processJson(inputJson))
    }
  }, [inputJson, mode, indentSize, sortKeys, realTimeEnabled, processJson])

  // Manual processing
  const handleProcess = useCallback(() => {
    setOutputJson(processJson(inputJson))
  }, [inputJson, processJson])

  // Copy output to clipboard
  const copyOutput = useCallback(async () => {
    if (!outputJson.trim()) return
    
    try {
      await navigator.clipboard.writeText(outputJson)
      setCopyFeedback('JSON copied to clipboard!')
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }, [outputJson])

  // Clear all text
  const clearAll = useCallback(() => {
    setInputJson('')
    setOutputJson('')
    setError('')
    setCopyFeedback('')
    setIsValid(null)
    setStats(null)
  }, [])

  // Load sample JSON
  const loadSample = useCallback(() => {
    const sampleJson = {
      "name": "John Doe",
      "age": 30,
      "email": "john.doe@example.com",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "zipCode": "10001",
        "country": "USA"
      },
      "hobbies": ["reading", "swimming", "coding"],
      "isActive": true,
      "lastLogin": "2024-01-15T10:30:00Z",
      "preferences": {
        "theme": "dark",
        "notifications": {
          "email": true,
          "push": false,
          "sms": true
        }
      }
    }
    setInputJson(JSON.stringify(sampleJson, null, 2))
  }, [])

  return (
    <div className="json-formatter">
      <h2>JSON Formatter</h2>

      <div className="json-section json-controls-section">
        <div className="controls-grid">
          <div className="mode-toggle">
            <label className="mode-label">Mode:</label>
            <button 
              className={`mode-button ${mode === 'format' ? 'active' : ''}`}
              onClick={() => setMode('format')}
            >
              Format
            </button>
            <button 
              className={`mode-button ${mode === 'minify' ? 'active' : ''}`}
              onClick={() => setMode('minify')}
            >
              Minify
            </button>
            <button 
              className={`mode-button ${mode === 'validate' ? 'active' : ''}`}
              onClick={() => setMode('validate')}
            >
              Validate
            </button>
          </div>

          <div className="format-options">
            {mode === 'format' && (
              <>
                <div className="option-group">
                  <label className="option-label">Indent:</label>
                  <select 
                    value={indentSize} 
                    onChange={(e) => setIndentSize(Number(e.target.value))}
                    className="indent-select"
                  >
                    <option value={2}>2 spaces</option>
                    <option value={4}>4 spaces</option>
                    <option value={8}>8 spaces</option>
                    <option value={0}>Tabs</option>
                  </select>
                </div>
                <div className="option-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={sortKeys}
                      onChange={(e) => setSortKeys(e.target.checked)}
                    />
                    Sort keys
                  </label>
                </div>
              </>
            )}
            <div className="option-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={realTimeEnabled}
                  onChange={(e) => setRealTimeEnabled(e.target.checked)}
                />
                Real-time processing
              </label>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          {!realTimeEnabled && (
            <button className="process-button" onClick={handleProcess}>
              {mode === 'format' ? 'Format' : mode === 'minify' ? 'Minify' : 'Validate'}
            </button>
          )}
          <button className="sample-button" onClick={loadSample}>
            📄 Load Sample
          </button>
          <button className="copy-button" onClick={copyOutput} disabled={!outputJson.trim()}>
            📋 Copy Output
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

      {isValid !== null && (
        <div className={`validation-feedback ${isValid ? 'valid' : 'invalid'}`}>
          {isValid ? '✅ Valid JSON' : '❌ Invalid JSON'}
        </div>
      )}

      <div className="json-section json-conversion-section">
        <div className="conversion-container">
          <div className="text-field">
            <div className="text-field-header">
              <label className="text-field-label">JSON Input</label>
              <span className="char-count">{inputJson.length} chars</span>
            </div>
            <textarea
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              placeholder="Enter JSON here..."
              className="input-textarea"
            />
          </div>

          <div className="conversion-arrow">
            <span className="arrow-icon">→</span>
            <span className="conversion-label">
              {mode === 'format' ? 'Format' : mode === 'minify' ? 'Minify' : 'Validate'}
            </span>
          </div>

          <div className="text-field">
            <div className="text-field-header">
              <label className="text-field-label">
                {mode === 'validate' ? 'Validation Result' : 'Processed JSON'}
              </label>
              <span className="char-count">{outputJson.length} chars</span>
            </div>
            <textarea
              value={mode === 'validate' ? (isValid ? 'Valid JSON ✅' : error ? `Invalid: ${error}` : '') : outputJson}
              readOnly
              placeholder={`${mode === 'format' ? 'Formatted' : mode === 'minify' ? 'Minified' : 'Validation result'} will appear here...`}
              className="output-textarea"
            />
          </div>
        </div>
      </div>

      {stats && (
        <div className="json-section stats-section">
          <label className="stats-label">JSON Statistics</label>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Characters:</span>
              <span className="stat-value">{stats.characters.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Lines:</span>
              <span className="stat-value">{stats.lines.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Size:</span>
              <span className="stat-value">{stats.size}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Keys:</span>
              <span className="stat-value">{stats.keys.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Objects:</span>
              <span className="stat-value">{stats.objects.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Arrays:</span>
              <span className="stat-value">{stats.arrays.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JsonFormatter
