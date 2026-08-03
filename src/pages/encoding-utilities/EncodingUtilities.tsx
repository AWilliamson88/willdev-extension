import React, { useState, useCallback, useEffect, useMemo } from 'react'
import './encoding-utilities.css'

type EncodingMode = 'hex' | 'binary' | 'ascii' | 'unicode' | 'morse'
type ConversionDirection = 'encode' | 'decode'

interface EncodingStats {
  originalSize: number
  encodedSize: number
  efficiency: number
}

const EncodingUtilities: React.FC = () => {
  const [mode, setMode] = useState<EncodingMode>('hex')
  const [direction, setDirection] = useState<ConversionDirection>('encode')
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [copyFeedback, setCopyFeedback] = useState('')
  const [error, setError] = useState('')

  // Morse code mapping
  const morseCode: Record<string, string> = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', ' ': '/', '.': '.-.-.-', ',': '--..--',
    '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.',
    ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
    '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-',
    '@': '.--.-.'
  }

  // Reverse morse code mapping
  const reverseMorseCode = useMemo(() => {
    const reverse: Record<string, string> = {}
    Object.entries(morseCode).forEach(([char, code]) => {
      reverse[code] = char
    })
    return reverse
  }, [morseCode])

  // Hex encoding/decoding
  const hexEncode = useCallback((text: string): string => {
    if (!text.trim()) return ''
    try {
      const encoder = new TextEncoder()
      const bytes = encoder.encode(text)
      return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(' ')
    } catch (error) {
      throw new Error('Failed to encode to hex')
    }
  }, [])

  const hexDecode = useCallback((text: string): string => {
    if (!text.trim()) return ''
    try {
      const hexString = text.replace(/\s/g, '')
      if (!/^[0-9a-fA-F]*$/.test(hexString)) {
        throw new Error('Invalid hex format')
      }
      if (hexString.length % 2 !== 0) {
        throw new Error('Hex string must have even length')
      }
      
      const bytes = new Uint8Array(hexString.length / 2)
      for (let i = 0; i < hexString.length; i += 2) {
        bytes[i / 2] = parseInt(hexString.substr(i, 2), 16)
      }
      
      const decoder = new TextDecoder()
      return decoder.decode(bytes)
    } catch (error) {
      throw new Error('Failed to decode hex: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }, [])

  // Binary encoding/decoding
  const binaryEncode = useCallback((text: string): string => {
    if (!text.trim()) return ''
    try {
      const encoder = new TextEncoder()
      const bytes = encoder.encode(text)
      return Array.from(bytes, byte => byte.toString(2).padStart(8, '0')).join(' ')
    } catch (error) {
      throw new Error('Failed to encode to binary')
    }
  }, [])

  const binaryDecode = useCallback((text: string): string => {
    if (!text.trim()) return ''
    try {
      const binaryString = text.replace(/\s/g, '')
      if (!/^[01]*$/.test(binaryString)) {
        throw new Error('Invalid binary format')
      }
      if (binaryString.length % 8 !== 0) {
        throw new Error('Binary string length must be multiple of 8')
      }
      
      const bytes = new Uint8Array(binaryString.length / 8)
      for (let i = 0; i < binaryString.length; i += 8) {
        bytes[i / 8] = parseInt(binaryString.substr(i, 8), 2)
      }
      
      const decoder = new TextDecoder()
      return decoder.decode(bytes)
    } catch (error) {
      throw new Error('Failed to decode binary: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }, [])

  // ASCII encoding/decoding
  const asciiEncode = useCallback((text: string): string => {
    if (!text.trim()) return ''
    try {
      return Array.from(text, char => {
        const code = char.charCodeAt(0)
        if (code > 127) {
          throw new Error(`Non-ASCII character found: ${char} (${code})`)
        }
        return code.toString()
      }).join(' ')
    } catch (error) {
      throw new Error('Failed to encode to ASCII: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }, [])

  const asciiDecode = useCallback((text: string): string => {
    if (!text.trim()) return ''
    try {
      const codes = text.split(/\s+/).filter(code => code.length > 0)
      return codes.map(code => {
        const num = parseInt(code, 10)
        if (isNaN(num) || num < 0 || num > 127) {
          throw new Error(`Invalid ASCII code: ${code}`)
        }
        return String.fromCharCode(num)
      }).join('')
    } catch (error) {
      throw new Error('Failed to decode ASCII: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }, [])

  // Unicode encoding/decoding
  const unicodeEncode = useCallback((text: string): string => {
    if (!text.trim()) return ''
    try {
      return Array.from(text, char => {
        const code = char.codePointAt(0)
        return `U+${code?.toString(16).toUpperCase().padStart(4, '0')}`
      }).join(' ')
    } catch (error) {
      throw new Error('Failed to encode to Unicode')
    }
  }, [])

  const unicodeDecode = useCallback((text: string): string => {
    if (!text.trim()) return ''
    try {
      const codes = text.split(/\s+/).filter(code => code.length > 0)
      return codes.map(code => {
        const match = code.match(/^U\+([0-9A-Fa-f]+)$/)
        if (!match) {
          throw new Error(`Invalid Unicode format: ${code}`)
        }
        const num = parseInt(match[1], 16)
        return String.fromCodePoint(num)
      }).join('')
    } catch (error) {
      throw new Error('Failed to decode Unicode: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }, [])

  // Morse code encoding/decoding
  const morseEncode = useCallback((text: string): string => {
    if (!text.trim()) return ''
    try {
      return text.toUpperCase().split('').map(char => {
        if (morseCode[char]) {
          return morseCode[char]
        } else if (char === ' ') {
          return '/'
        } else {
          throw new Error(`Character not supported in Morse code: ${char}`)
        }
      }).join(' ')
    } catch (error) {
      throw new Error('Failed to encode to Morse: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }, [morseCode])

  const morseDecode = useCallback((text: string): string => {
    if (!text.trim()) return ''
    try {
      const codes = text.split(/\s+/).filter(code => code.length > 0)
      return codes.map(code => {
        if (code === '/') {
          return ' '
        } else if (reverseMorseCode[code]) {
          return reverseMorseCode[code]
        } else {
          throw new Error(`Invalid Morse code: ${code}`)
        }
      }).join('')
    } catch (error) {
      throw new Error('Failed to decode Morse: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }, [reverseMorseCode])

  // Main conversion function
  const convertText = useCallback((text: string): string => {
    if (!text.trim()) return ''

    try {
      switch (mode) {
        case 'hex':
          return direction === 'encode' ? hexEncode(text) : hexDecode(text)
        case 'binary':
          return direction === 'encode' ? binaryEncode(text) : binaryDecode(text)
        case 'ascii':
          return direction === 'encode' ? asciiEncode(text) : asciiDecode(text)
        case 'unicode':
          return direction === 'encode' ? unicodeEncode(text) : unicodeDecode(text)
        case 'morse':
          return direction === 'encode' ? morseEncode(text) : morseDecode(text)
        default:
          return text
      }
    } catch (error) {
      throw error
    }
  }, [mode, direction, hexEncode, hexDecode, binaryEncode, binaryDecode, asciiEncode, asciiDecode, unicodeEncode, unicodeDecode, morseEncode, morseDecode])

  // Handle real-time conversion
  useEffect(() => {
    if (realTimeEnabled) {
      try {
        setOutputText(convertText(inputText))
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Conversion failed')
        setOutputText('')
      }
    }
  }, [inputText, mode, direction, realTimeEnabled, convertText])

  // Handle copy feedback timeout with cleanup
  useEffect(() => {
    if (copyFeedback) {
      const timeoutId = setTimeout(() => setCopyFeedback(''), 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [copyFeedback])

  // Manual conversion
  const handleConvert = useCallback(() => {
    try {
      setOutputText(convertText(inputText))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed')
      setOutputText('')
    }
  }, [inputText, convertText])

  // Toggle direction
  const toggleDirection = useCallback(() => {
    setDirection(prev => prev === 'encode' ? 'decode' : 'encode')
    // Swap input and output when toggling direction
    const temp = inputText
    setInputText(outputText)
    setOutputText(temp)
    setError('')
  }, [inputText, outputText])

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback(`${label} copied to clipboard!`)
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard')
    }
  }, [])

  // Load sample data
  const loadSample = useCallback(() => {
    const samples = {
      hex: 'Hello, World! 🌍',
      binary: 'Binary encoding test 101',
      ascii: 'ASCII text only',
      unicode: 'Unicode: 🚀 ⭐ 🎉 ❤️',
      morse: 'HELLO WORLD'
    }
    setInputText(samples[mode])
    setDirection('encode')
    setError('')
  }, [mode])

  // Clear all
  const clearAll = useCallback(() => {
    setInputText('')
    setOutputText('')
    setError('')
    setCopyFeedback('')
  }, [])

  // Calculate encoding statistics
  const encodingStats = useMemo((): EncodingStats | null => {
    if (!inputText.trim() || !outputText.trim() || error) return null

    const originalSize = new TextEncoder().encode(inputText).length
    const encodedSize = new TextEncoder().encode(outputText).length
    const efficiency = originalSize > 0 ? ((encodedSize - originalSize) / originalSize * 100) : 0

    return {
      originalSize,
      encodedSize,
      efficiency
    }
  }, [inputText, outputText, error])

  // Get mode description
  const getModeDescription = useCallback((currentMode: EncodingMode): string => {
    const descriptions = {
      hex: 'Hexadecimal encoding converts text to base-16 representation using digits 0-9 and letters A-F',
      binary: 'Binary encoding converts text to base-2 representation using only 0s and 1s',
      ascii: 'ASCII encoding converts text to numeric codes (0-127) representing standard ASCII characters',
      unicode: 'Unicode encoding shows the Unicode code points (U+XXXX) for each character',
      morse: 'Morse code converts text to dots (.) and dashes (-) used in telegraph communication'
    }
    return descriptions[currentMode]
  }, [])

  return (
    <div className="encoding-utilities">
      <h2>Encoding Utilities</h2>

      <div className="encoding-section controls-section">
        <div className="mode-group">
          <label className="mode-label">Encoding Type:</label>
          <div className="mode-buttons">
            <button 
              className={`mode-button ${mode === 'hex' ? 'active' : ''}`}
              onClick={() => setMode('hex')}
            >
              🔢 Hexadecimal
            </button>
            <button 
              className={`mode-button ${mode === 'binary' ? 'active' : ''}`}
              onClick={() => setMode('binary')}
            >
              💾 Binary
            </button>
            <button 
              className={`mode-button ${mode === 'ascii' ? 'active' : ''}`}
              onClick={() => setMode('ascii')}
            >
              📝 ASCII
            </button>
            <button 
              className={`mode-button ${mode === 'unicode' ? 'active' : ''}`}
              onClick={() => setMode('unicode')}
            >
              🌐 Unicode
            </button>
            <button 
              className={`mode-button ${mode === 'morse' ? 'active' : ''}`}
              onClick={() => setMode('morse')}
            >
              📡 Morse Code
            </button>
          </div>
        </div>

        <div className="direction-group">
          <label className="direction-label">Direction:</label>
          <div className="direction-buttons">
            <button 
              className={`direction-button ${direction === 'encode' ? 'active' : ''}`}
              onClick={() => setDirection('encode')}
            >
              Encode
            </button>
            <button 
              className={`direction-button ${direction === 'decode' ? 'active' : ''}`}
              onClick={() => setDirection('decode')}
            >
              Decode
            </button>
            <button className="swap-button" onClick={toggleDirection}>
              🔄 Swap
            </button>
          </div>
        </div>

        <div className="options-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={realTimeEnabled}
              onChange={(e) => setRealTimeEnabled(e.target.checked)}
            />
            Real-time conversion
          </label>
        </div>

        <div className="action-buttons">
          {!realTimeEnabled && (
            <button className="convert-button" onClick={handleConvert}>
              🔄 Convert
            </button>
          )}
          <button className="sample-button" onClick={loadSample}>
            📄 Load Sample
          </button>
          <button className="copy-output-button" onClick={() => copyToClipboard(outputText, 'Output')}>
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

      <div className="encoding-section description-section">
        <label className="section-label">About {mode.charAt(0).toUpperCase() + mode.slice(1)}</label>
        <p className="mode-description">{getModeDescription(mode)}</p>
      </div>

      <div className="encoding-section conversion-section">
        <div className="text-fields">
          <div className="text-field">
            <div className="text-field-header">
              <label className="text-field-label">
                {direction === 'encode' ? 'Plain Text (Input)' : `${mode.charAt(0).toUpperCase() + mode.slice(1)} Encoded (Input)`}
              </label>
              <span className="char-count">{inputText.length} chars</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={direction === 'encode'
                ? `Enter text to encode to ${mode}...`
                : `Enter ${mode} encoded text to decode...`
              }
              className="input-textarea"
              rows={6}
            />
          </div>

          <div className="conversion-arrow">
            <span className="arrow-icon">
              {direction === 'encode' ? '→' : '←'}
            </span>
            <span className="conversion-label">
              {direction === 'encode' ? 'Encode' : 'Decode'}
            </span>
          </div>

          <div className="text-field">
            <div className="text-field-header">
              <label className="text-field-label">
                {direction === 'encode' ? `${mode.charAt(0).toUpperCase() + mode.slice(1)} Encoded (Output)` : 'Plain Text (Output)'}
              </label>
              <span className="char-count">{outputText.length} chars</span>
            </div>
            <textarea
              value={outputText}
              readOnly
              placeholder={`${direction === 'encode' ? 'Encoded' : 'Decoded'} text will appear here...`}
              className="output-textarea"
              rows={6}
            />
          </div>
        </div>
      </div>

      {encodingStats && (
        <div className="encoding-section stats-section">
          <label className="section-label">Encoding Statistics</label>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Original size:</span>
              <span className="stat-value">{encodingStats.originalSize} bytes</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Encoded size:</span>
              <span className="stat-value">{encodingStats.encodedSize} bytes</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Size change:</span>
              <span className={`stat-value ${encodingStats.efficiency > 0 ? 'increase' : 'decrease'}`}>
                {encodingStats.efficiency > 0 ? '+' : ''}{encodingStats.efficiency.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="encoding-section examples-section">
        <label className="section-label">Examples & Format Guide</label>
        <div className="examples-grid">
          {mode === 'hex' && (
            <div className="example-item">
              <div className="example-label">Hex Format:</div>
              <div className="example-value">
                <code>48 65 6c 6c 6f</code> (space-separated bytes)
              </div>
            </div>
          )}
          {mode === 'binary' && (
            <div className="example-item">
              <div className="example-label">Binary Format:</div>
              <div className="example-value">
                <code>01001000 01100101 01101100</code> (8-bit bytes)
              </div>
            </div>
          )}
          {mode === 'ascii' && (
            <div className="example-item">
              <div className="example-label">ASCII Format:</div>
              <div className="example-value">
                <code>72 101 108 108 111</code> (decimal codes 0-127)
              </div>
            </div>
          )}
          {mode === 'unicode' && (
            <div className="example-item">
              <div className="example-label">Unicode Format:</div>
              <div className="example-value">
                <code>U+0048 U+0065 U+006C U+006C U+006F</code>
              </div>
            </div>
          )}
          {mode === 'morse' && (
            <div className="example-item">
              <div className="example-label">Morse Format:</div>
              <div className="example-value">
                <code>.... . .-.. .-.. ---</code> (dots, dashes, spaces)
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="encoding-section reference-section">
        <label className="section-label">Quick Reference</label>
        <div className="reference-content">
          {mode === 'hex' && (
            <div className="reference-text">
              <p><strong>Hexadecimal:</strong> Base-16 numbering system using 0-9 and A-F</p>
              <p><strong>Use cases:</strong> Color codes, memory addresses, binary data representation</p>
              <p><strong>Format:</strong> Each byte represented as 2 hex digits (00-FF)</p>
            </div>
          )}
          {mode === 'binary' && (
            <div className="reference-text">
              <p><strong>Binary:</strong> Base-2 numbering system using only 0 and 1</p>
              <p><strong>Use cases:</strong> Computer data representation, digital logic, bit manipulation</p>
              <p><strong>Format:</strong> Each byte represented as 8 binary digits (00000000-11111111)</p>
            </div>
          )}
          {mode === 'ascii' && (
            <div className="reference-text">
              <p><strong>ASCII:</strong> American Standard Code for Information Interchange</p>
              <p><strong>Use cases:</strong> Text encoding, character codes, legacy systems</p>
              <p><strong>Range:</strong> 0-127 (128 characters including control characters)</p>
            </div>
          )}
          {mode === 'unicode' && (
            <div className="reference-text">
              <p><strong>Unicode:</strong> Universal character encoding standard</p>
              <p><strong>Use cases:</strong> International text, emojis, special symbols</p>
              <p><strong>Format:</strong> U+XXXX notation for code points (U+0000 to U+10FFFF)</p>
            </div>
          )}
          {mode === 'morse' && (
            <div className="reference-text">
              <p><strong>Morse Code:</strong> Telegraph communication using dots and dashes</p>
              <p><strong>Use cases:</strong> Radio communication, emergency signaling, historical encoding</p>
              <p><strong>Format:</strong> Dots (.), dashes (-), spaces between letters, / for word breaks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EncodingUtilities
