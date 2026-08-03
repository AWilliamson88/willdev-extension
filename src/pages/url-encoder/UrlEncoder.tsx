import React, { useState, useCallback, useEffect } from 'react'
import './url-encoder.css'

type ConversionMode = 'encode' | 'decode'
type EncodingType = 'component' | 'full'

const UrlEncoder: React.FC = () => {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [mode, setMode] = useState<ConversionMode>('encode')
  const [encodingType, setEncodingType] = useState<EncodingType>('component')
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [copyFeedback, setCopyFeedback] = useState('')

  // Encode URL based on type
  const encodeUrl = useCallback((text: string): string => {
    if (!text.trim()) return ''
    
    try {
      if (encodingType === 'component') {
        return encodeURIComponent(text)
      } else {
        return encodeURI(text)
      }
    } catch (error) {
      return 'Error: Invalid input for encoding'
    }
  }, [encodingType])

  // Decode URL
  const decodeUrl = useCallback((text: string): string => {
    if (!text.trim()) return ''
    
    try {
      return decodeURIComponent(text)
    } catch (error) {
      return 'Error: Invalid URL encoding'
    }
  }, [])

  // Convert text based on current mode
  const convertText = useCallback((text: string): string => {
    return mode === 'encode' ? encodeUrl(text) : decodeUrl(text)
  }, [mode, encodeUrl, decodeUrl])

  // Handle real-time conversion
  useEffect(() => {
    if (realTimeEnabled) {
      setOutputText(convertText(inputText))
    }
  }, [inputText, mode, encodingType, realTimeEnabled, convertText])

  // Manual conversion
  const handleConvert = useCallback(() => {
    setOutputText(convertText(inputText))
  }, [inputText, convertText])

  // Toggle conversion mode
  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'encode' ? 'decode' : 'encode')
    // Swap input and output when toggling mode
    const temp = inputText
    setInputText(outputText)
    setOutputText(temp)
  }, [inputText, outputText])

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



  return (
    <div className="url-encoder">
      <h2>URL Encoder/Decoder</h2>

      <div className="url-section url-controls-section">
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

          <div className="encoding-type-toggle">
            <label className="encoding-type-label">Encoding Type:</label>
            <button 
              className={`encoding-type-button ${encodingType === 'component' ? 'active' : ''}`}
              onClick={() => setEncodingType('component')}
              disabled={mode === 'decode'}
            >
              Component
            </button>
            <button 
              className={`encoding-type-button ${encodingType === 'full' ? 'active' : ''}`}
              onClick={() => setEncodingType('full')}
              disabled={mode === 'decode'}
            >
              Full URL
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

      <div className="url-section url-conversion-section">
        <div className="conversion-container">
          <div className="text-field">
            <div className="text-field-header">
              <label className="text-field-label">
                {mode === 'encode' ? 'Plain Text/URL (Input)' : 'URL Encoded Text (Input)'}
              </label>
              <span className="char-count">{inputText.length} chars</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={mode === 'encode' 
                ? 'Enter text or URL to encode...' 
                : 'Enter URL encoded text to decode...'
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
                {mode === 'encode' ? 'URL Encoded Text (Output)' : 'Plain Text/URL (Output)'}
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
      </div>

      <div className="url-section url-examples-section">
        <label className="examples-label">Common URL Encoding Examples</label>
        <div className="examples-grid">
          <div className="example-item">
            <code>space</code> → <code>%20</code>
          </div>
          <div className="example-item">
            <code>!</code> → <code>%21</code>
          </div>
          <div className="example-item">
            <code>"</code> → <code>%22</code>
          </div>
          <div className="example-item">
            <code>#</code> → <code>%23</code>
          </div>
          <div className="example-item">
            <code>$</code> → <code>%24</code>
          </div>
          <div className="example-item">
            <code>%</code> → <code>%25</code>
          </div>
          <div className="example-item">
            <code>&</code> → <code>%26</code>
          </div>
          <div className="example-item">
            <code>+</code> → <code>%2B</code>
          </div>
          <div className="example-item">
            <code>=</code> → <code>%3D</code>
          </div>
          <div className="example-item">
            <code>?</code> → <code>%3F</code>
          </div>
          <div className="example-item">
            <code>@</code> → <code>%40</code>
          </div>
          <div className="example-item">
            <code>[</code> → <code>%5B</code>
          </div>
        </div>
        
        <div className="encoding-info">
          <p><strong>Component Encoding:</strong> Encodes all special characters including / : ? # [ ] @</p>
          <p><strong>Full URL Encoding:</strong> Preserves URL structure, only encodes characters that would break the URL</p>
        </div>
      </div>
    </div>
  )
}

export default UrlEncoder
