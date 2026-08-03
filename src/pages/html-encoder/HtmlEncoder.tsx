import React, { useState, useCallback, useEffect } from 'react'
import './html-encoder.css'

type ConversionMode = 'encode' | 'decode'

const HtmlEncoder: React.FC = () => {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [mode, setMode] = useState<ConversionMode>('encode')
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [copyFeedback, setCopyFeedback] = useState('')

  // HTML entity mappings for encoding
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
    ' ': '&nbsp;', // Non-breaking space (optional)
    '¡': '&iexcl;',
    '¢': '&cent;',
    '£': '&pound;',
    '¤': '&curren;',
    '¥': '&yen;',
    '¦': '&brvbar;',
    '§': '&sect;',
    '¨': '&uml;',
    '©': '&copy;',
    'ª': '&ordf;',
    '«': '&laquo;',
    '¬': '&not;',
    '®': '&reg;',
    '¯': '&macr;',
    '°': '&deg;',
    '±': '&plusmn;',
    '²': '&sup2;',
    '³': '&sup3;',
    '´': '&acute;',
    'µ': '&micro;',
    '¶': '&para;',
    '·': '&middot;',
    '¸': '&cedil;',
    '¹': '&sup1;',
    'º': '&ordm;',
    '»': '&raquo;',
    '¼': '&frac14;',
    '½': '&frac12;',
    '¾': '&frac34;',
    '¿': '&iquest;'
  }

  // Encode HTML entities
  const encodeHtml = useCallback((text: string): string => {
    return text.replace(/[&<>"'`=\/]/g, (match) => htmlEntities[match] || match)
  }, [])

  // Decode HTML entities
  const decodeHtml = useCallback((text: string): string => {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = text
    return textarea.value
  }, [])

  // Convert text based on current mode
  const convertText = useCallback((text: string): string => {
    if (!text.trim()) return ''
    
    try {
      return mode === 'encode' ? encodeHtml(text) : decodeHtml(text)
    } catch (error) {
      return 'Error: Invalid input for ' + mode + ' operation'
    }
  }, [mode, encodeHtml, decodeHtml])

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

  // Swap input and output
  const swapTexts = useCallback(() => {
    const temp = inputText
    setInputText(outputText)
    setOutputText(temp)
  }, [inputText, outputText])

  return (
    <div className="html-encoder">
      <h2>HTML Encoder/Decoder</h2>

      <div className="html-section html-controls-section">
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
          <button className="swap-button" onClick={swapTexts}>
            ⇅ Swap
          </button>
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

      <div className="html-section html-conversion-section">
        <div className="conversion-container">
          <div className="text-field">
            <div className="text-field-header">
              <label className="text-field-label">
                {mode === 'encode' ? 'Plain Text (Input)' : 'HTML Encoded Text (Input)'}
              </label>
              <span className="char-count">{inputText.length} chars</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={mode === 'encode' 
                ? 'Enter plain text to encode HTML entities...' 
                : 'Enter HTML encoded text to decode...'
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
                {mode === 'encode' ? 'HTML Encoded Text (Output)' : 'Plain Text (Output)'}
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

      <div className="html-section html-examples-section">
        <label className="examples-label">Common HTML Entities</label>
        <div className="examples-grid">
          <div className="example-item">
            <code>&amp;</code> → <code>&amp;amp;</code>
          </div>
          <div className="example-item">
            <code>&lt;</code> → <code>&amp;lt;</code>
          </div>
          <div className="example-item">
            <code>&gt;</code> → <code>&amp;gt;</code>
          </div>
          <div className="example-item">
            <code>"</code> → <code>&amp;quot;</code>
          </div>
          <div className="example-item">
            <code>'</code> → <code>&amp;#x27;</code>
          </div>
          <div className="example-item">
            <code>©</code> → <code>&amp;copy;</code>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HtmlEncoder
