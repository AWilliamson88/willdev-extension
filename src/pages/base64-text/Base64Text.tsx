import React, { useState, useCallback, useEffect } from 'react'
import './base64-text.css'

type ConversionMode = 'encode' | 'decode'

const Base64Text: React.FC = () => {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [mode, setMode] = useState<ConversionMode>('encode')
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [copyFeedback, setCopyFeedback] = useState('')

  // Encode text to Base64
  const encodeBase64 = useCallback((text: string): string => {
    if (!text.trim()) return ''
    
    try {
      // Handle UTF-8 characters properly
      const utf8Bytes = new TextEncoder().encode(text)
      const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('')
      return btoa(binaryString)
    } catch (error) {
      return 'Error: Invalid input for Base64 encoding'
    }
  }, [])

  // Decode Base64 to text
  const decodeBase64 = useCallback((text: string): string => {
    if (!text.trim()) return ''
    
    try {
      // Remove whitespace and validate Base64 format
      const cleanedText = text.replace(/\s/g, '')
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanedText)) {
        return 'Error: Invalid Base64 format'
      }
      
      const binaryString = atob(cleanedText)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      return new TextDecoder().decode(bytes)
    } catch (error) {
      return 'Error: Invalid Base64 string'
    }
  }, [])

  // Convert text based on current mode
  const convertText = useCallback((text: string): string => {
    return mode === 'encode' ? encodeBase64(text) : decodeBase64(text)
  }, [mode, encodeBase64, decodeBase64])

  // Handle real-time conversion
  useEffect(() => {
    if (realTimeEnabled) {
      setOutputText(convertText(inputText))
    }
  }, [inputText, mode, realTimeEnabled, convertText])

  // Manual conversion
  const handleConvert = useCallback(() => {
    setOutputText(convertText(inputText))
  }, [inputText, convertText])

  // Copy output to clipboard
  const copyOutput = useCallback(async () => {
    if (!outputText.trim()) return
    
    try {
      await navigator.clipboard.writeText(outputText)
      setCopyFeedback('Copied to clipboard!')
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }, [outputText])

  // Clear all text
  const clearAll = useCallback(() => {
    setInputText('')
    setOutputText('')
    setCopyFeedback('')
  }, [])

  // Calculate Base64 size info
  const getEncodingInfo = useCallback(() => {
    if (mode === 'encode' && inputText.trim()) {
      const originalBytes = new TextEncoder().encode(inputText).length
      const base64Length = Math.ceil(originalBytes / 3) * 4
      const overhead = ((base64Length - originalBytes) / originalBytes * 100).toFixed(1)
      return {
        originalSize: originalBytes,
        encodedSize: base64Length,
        overhead: overhead
      }
    }
    return null
  }, [mode, inputText])

  const encodingInfo = getEncodingInfo()

  return (
    <div className="base64-text">
      <h2>Base64 Text Encoder/Decoder</h2>

      <div className="base64-section base64-controls-section">
        <div className="controls-grid">
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

          <div className="option-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.target.checked)}
              />
              Real-time conversion
            </label>
          </div>
        </div>

        <div className="action-buttons">
          {!realTimeEnabled && (
            <button className="convert-button" onClick={handleConvert}>
              Convert
            </button>
          )}
          <button className="copy-button" onClick={copyOutput} disabled={!outputText.trim()}>
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

      <div className="base64-section base64-conversion-section">
        <div className="conversion-container">
          <div className="text-field">
            <div className="text-field-header">
              <label className="text-field-label">
                {mode === 'encode' ? 'Plain Text (Input)' : 'Base64 Encoded Text (Input)'}
              </label>
              <span className="char-count">{inputText.length} chars</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={mode === 'encode' 
                ? 'Enter plain text to encode to Base64...' 
                : 'Enter Base64 encoded text to decode...'
              }
              className="input-textarea"
            />
          </div>

          <div className="conversion-arrow">
            <span className="arrow-icon">
              {mode === 'encode' ? '→' : '←'}
            </span>
            <span className="conversion-label">
              {mode === 'encode' ? 'Encode' : 'Decode'}
            </span>
          </div>

          <div className="text-field">
            <div className="text-field-header">
              <label className="text-field-label">
                {mode === 'encode' ? 'Base64 Encoded Text (Output)' : 'Plain Text (Output)'}
              </label>
              <span className="char-count">{outputText.length} chars</span>
            </div>
            <textarea
              value={outputText}
              readOnly
              placeholder={`${mode === 'encode' ? 'Encoded' : 'Decoded'} text will appear here...`}
              className="output-textarea"
            />
          </div>
        </div>

        {encodingInfo && (
          <div className="encoding-info">
            <div className="info-item">
              <span className="info-label">Original size:</span>
              <span className="info-value">{encodingInfo.originalSize} bytes</span>
            </div>
            <div className="info-item">
              <span className="info-label">Base64 size:</span>
              <span className="info-value">{encodingInfo.encodedSize} bytes</span>
            </div>
            <div className="info-item">
              <span className="info-label">Size overhead:</span>
              <span className="info-value">+{encodingInfo.overhead}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="base64-section base64-examples-section">
        <label className="examples-label">Base64 Encoding Examples</label>
        <div className="examples-grid">
          <div className="example-item">
            <code>Hello</code> → <code>SGVsbG8=</code>
          </div>
          <div className="example-item">
            <code>World</code> → <code>V29ybGQ=</code>
          </div>
          <div className="example-item">
            <code>123</code> → <code>MTIz</code>
          </div>
          <div className="example-item">
            <code>ABC</code> → <code>QUJD</code>
          </div>
          <div className="example-item">
            <code>@#$</code> → <code>QCMk</code>
          </div>
          <div className="example-item">
            <code>🚀</code> → <code>8J+agA==</code>
          </div>
        </div>
        
        <div className="base64-info">
          <p><strong>Base64 Encoding:</strong> Converts binary data to ASCII text using 64 printable characters (A-Z, a-z, 0-9, +, /)</p>
          <p><strong>UTF-8 Support:</strong> Properly handles Unicode characters including emojis and special symbols</p>
          <p><strong>Padding:</strong> Uses = characters for padding when input length is not divisible by 3</p>
        </div>
      </div>
    </div>
  )
}

export default Base64Text
