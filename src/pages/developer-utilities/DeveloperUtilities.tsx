import React, { useState, useCallback, useEffect, useMemo } from 'react'
import './developer-utilities.css'

type UtilityMode = 'timestamp' | 'lorem' | 'password' | 'uuid' | 'random'

interface TimestampFormats {
  unix: string
  iso: string
  utc: string
  local: string
  relative: string
}

interface PasswordOptions {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeSimilar: boolean
}

const DeveloperUtilities: React.FC = () => {
  const [mode, setMode] = useState<UtilityMode>('timestamp')
  const [copyFeedback, setCopyFeedback] = useState('')

  // Timestamp Converter State
  const [timestampInput, setTimestampInput] = useState('')
  const [timestampFormats, setTimestampFormats] = useState<TimestampFormats | null>(null)
  const [timestampError, setTimestampError] = useState('')

  // Lorem Ipsum State
  const [loremType, setLoremType] = useState<'words' | 'sentences' | 'paragraphs'>('paragraphs')
  const [loremCount, setLoremCount] = useState(3)
  const [loremText, setLoremText] = useState('')

  // Password Generator State
  const [passwordOptions, setPasswordOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false
  })
  const [generatedPasswords, setGeneratedPasswords] = useState<string[]>([])
  const [passwordCount, setPasswordCount] = useState(5)

  // UUID Generator State
  const [uuidCount, setUuidCount] = useState(5)
  const [uuidFormat, setUuidFormat] = useState<'standard' | 'compact' | 'uppercase'>('standard')
  const [generatedUuids, setGeneratedUuids] = useState<string[]>([])

  // Random Data State
  const [randomDataType, setRandomDataType] = useState<'numbers' | 'hex' | 'base64' | 'names'>('numbers')
  const [randomCount, setRandomCount] = useState(10)
  const [randomData, setRandomData] = useState<string[]>([])

  // Lorem Ipsum words
  const loremWords = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
    'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
    'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
    'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
    'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
    'mollit', 'anim', 'id', 'est', 'laborum', 'at', 'vero', 'eos', 'accusamus', 'accusantium',
    'doloremque', 'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo',
    'inventore', 'veritatis', 'et', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta', 'sunt',
    'explicabo', 'nemo', 'ipsam', 'voluptatem', 'quia', 'voluptas', 'aspernatur', 'aut', 'odit',
    'fugit', 'sed', 'quia', 'consequuntur', 'magni', 'dolores', 'ratione', 'sequi', 'nesciunt'
  ]

  // Sample names for random data
  const sampleNames = [
    'John Smith', 'Jane Doe', 'Michael Johnson', 'Sarah Wilson', 'David Brown', 'Emily Davis',
    'Christopher Miller', 'Jessica Garcia', 'Matthew Rodriguez', 'Ashley Martinez', 'Daniel Anderson',
    'Amanda Taylor', 'James Thomas', 'Jennifer Hernandez', 'Robert Moore', 'Elizabeth Martin',
    'William Jackson', 'Stephanie Thompson', 'Joseph White', 'Melissa Lopez', 'Charles Lee',
    'Nicole Gonzalez', 'Thomas Harris', 'Kimberly Clark', 'Christopher Lewis', 'Donna Robinson'
  ]

  // Convert timestamp
  const convertTimestamp = useCallback((input: string) => {
    if (!input.trim()) {
      setTimestampFormats(null)
      setTimestampError('')
      return
    }

    try {
      let date: Date

      // Try to parse as Unix timestamp (seconds or milliseconds)
      if (/^\d+$/.test(input)) {
        const num = parseInt(input)
        // If less than 13 digits, assume seconds; otherwise milliseconds
        date = new Date(num < 10000000000 ? num * 1000 : num)
      } else {
        // Try to parse as date string
        date = new Date(input)
      }

      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format')
      }

      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor(diffMs / (1000 * 60))

      let relative = ''
      if (Math.abs(diffDays) > 0) {
        relative = diffDays > 0 ? `${diffDays} days ago` : `in ${Math.abs(diffDays)} days`
      } else if (Math.abs(diffHours) > 0) {
        relative = diffHours > 0 ? `${diffHours} hours ago` : `in ${Math.abs(diffHours)} hours`
      } else if (Math.abs(diffMinutes) > 0) {
        relative = diffMinutes > 0 ? `${diffMinutes} minutes ago` : `in ${Math.abs(diffMinutes)} minutes`
      } else {
        relative = 'just now'
      }

      setTimestampFormats({
        unix: Math.floor(date.getTime() / 1000).toString(),
        iso: date.toISOString(),
        utc: date.toUTCString(),
        local: date.toLocaleString(),
        relative
      })
      setTimestampError('')
    } catch (error) {
      setTimestampError('Invalid timestamp format')
      setTimestampFormats(null)
    }
  }, [])

  // Generate Lorem Ipsum
  const generateLorem = useCallback(() => {
    const generateWords = (count: number): string => {
      const words = []
      for (let i = 0; i < count; i++) {
        words.push(loremWords[Math.floor(Math.random() * loremWords.length)])
      }
      return words.join(' ')
    }

    const generateSentence = (): string => {
      const wordCount = Math.floor(Math.random() * 10) + 5 // 5-14 words
      const sentence = generateWords(wordCount)
      return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.'
    }

    const generateParagraph = (): string => {
      const sentenceCount = Math.floor(Math.random() * 5) + 3 // 3-7 sentences
      const sentences = []
      for (let i = 0; i < sentenceCount; i++) {
        sentences.push(generateSentence())
      }
      return sentences.join(' ')
    }

    let result = ''
    switch (loremType) {
      case 'words':
        result = generateWords(loremCount)
        break
      case 'sentences':
        const sentences = []
        for (let i = 0; i < loremCount; i++) {
          sentences.push(generateSentence())
        }
        result = sentences.join(' ')
        break
      case 'paragraphs':
        const paragraphs = []
        for (let i = 0; i < loremCount; i++) {
          paragraphs.push(generateParagraph())
        }
        result = paragraphs.join('\n\n')
        break
    }
    setLoremText(result)
  }, [loremType, loremCount, loremWords])

  // Generate Password
  const generatePasswords = useCallback(() => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    const similar = 'il1Lo0O'

    let charset = ''
    if (passwordOptions.includeUppercase) charset += uppercase
    if (passwordOptions.includeLowercase) charset += lowercase
    if (passwordOptions.includeNumbers) charset += numbers
    if (passwordOptions.includeSymbols) charset += symbols

    if (passwordOptions.excludeSimilar) {
      charset = charset.split('').filter(char => !similar.includes(char)).join('')
    }

    if (!charset) {
      setGeneratedPasswords(['Error: No character set selected'])
      return
    }

    const passwords = []
    for (let i = 0; i < passwordCount; i++) {
      let password = ''
      for (let j = 0; j < passwordOptions.length; j++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length))
      }
      passwords.push(password)
    }
    setGeneratedPasswords(passwords)
  }, [passwordOptions, passwordCount])

  // Generate UUIDs
  const generateUuids = useCallback(() => {
    const generateUuid = (): string => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    const formatUuid = (uuid: string): string => {
      switch (uuidFormat) {
        case 'compact':
          return uuid.replace(/-/g, '')
        case 'uppercase':
          return uuid.toUpperCase()
        default:
          return uuid
      }
    }

    const uuids = []
    for (let i = 0; i < uuidCount; i++) {
      uuids.push(formatUuid(generateUuid()))
    }
    setGeneratedUuids(uuids)
  }, [uuidCount, uuidFormat])

  // Generate Random Data
  const generateRandomData = useCallback(() => {
    const data = []
    
    switch (randomDataType) {
      case 'numbers':
        for (let i = 0; i < randomCount; i++) {
          data.push(Math.floor(Math.random() * 1000000).toString())
        }
        break
      case 'hex':
        for (let i = 0; i < randomCount; i++) {
          const hex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
          data.push(`#${hex}`)
        }
        break
      case 'base64':
        for (let i = 0; i < randomCount; i++) {
          const bytes = new Uint8Array(12)
          crypto.getRandomValues(bytes)
          data.push(btoa(String.fromCharCode(...bytes)))
        }
        break
      case 'names':
        for (let i = 0; i < randomCount; i++) {
          data.push(sampleNames[Math.floor(Math.random() * sampleNames.length)])
        }
        break
    }
    setRandomData(data)
  }, [randomDataType, randomCount, sampleNames])

  // Auto-convert timestamp when input changes
  useEffect(() => {
    convertTimestamp(timestampInput)
  }, [timestampInput, convertTimestamp])

  // Auto-generate lorem when settings change
  useEffect(() => {
    generateLorem()
  }, [generateLorem])

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

  // Load current timestamp
  const loadCurrentTimestamp = useCallback(() => {
    setTimestampInput(Math.floor(Date.now() / 1000).toString())
  }, [])

  // Clear all
  const clearAll = useCallback(() => {
    setTimestampInput('')
    setTimestampFormats(null)
    setTimestampError('')
    setLoremText('')
    setGeneratedPasswords([])
    setGeneratedUuids([])
    setRandomData([])
    setCopyFeedback('')
  }, [])

  return (
    <div className="developer-utilities">
      <h2>Developer Utilities</h2>

      <div className="dev-section controls-section">
        <div className="mode-group">
          <label className="mode-label">Utility Type:</label>
          <div className="mode-buttons">
            <button 
              className={`mode-button ${mode === 'timestamp' ? 'active' : ''}`}
              onClick={() => setMode('timestamp')}
            >
              🕒 Timestamp Converter
            </button>
            <button 
              className={`mode-button ${mode === 'lorem' ? 'active' : ''}`}
              onClick={() => setMode('lorem')}
            >
              📝 Lorem Ipsum
            </button>
            <button 
              className={`mode-button ${mode === 'password' ? 'active' : ''}`}
              onClick={() => setMode('password')}
            >
              🔐 Password Generator
            </button>
            <button 
              className={`mode-button ${mode === 'uuid' ? 'active' : ''}`}
              onClick={() => setMode('uuid')}
            >
              🆔 UUID Generator
            </button>
            <button 
              className={`mode-button ${mode === 'random' ? 'active' : ''}`}
              onClick={() => setMode('random')}
            >
              🎲 Random Data
            </button>
          </div>
        </div>

        <div className="action-buttons">
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

      {mode === 'timestamp' && (
        <div className="dev-section timestamp-section">
          <label className="section-label">🕒 Timestamp Converter</label>
          
          <div className="timestamp-input-group">
            <div className="input-row">
              <input
                type="text"
                value={timestampInput}
                onChange={(e) => setTimestampInput(e.target.value)}
                placeholder="Enter Unix timestamp or date string..."
                className="timestamp-input"
              />
              <button className="current-time-button" onClick={loadCurrentTimestamp}>
                📅 Current Time
              </button>
            </div>
            {timestampError && (
              <div className="error-message">{timestampError}</div>
            )}
          </div>

          {timestampFormats && (
            <div className="timestamp-results">
              <div className="format-item">
                <label className="format-label">Unix Timestamp:</label>
                <div className="format-value">
                  <code>{timestampFormats.unix}</code>
                  <button 
                    className="copy-format-button"
                    onClick={() => copyToClipboard(timestampFormats.unix, 'Unix timestamp')}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="format-item">
                <label className="format-label">ISO 8601:</label>
                <div className="format-value">
                  <code>{timestampFormats.iso}</code>
                  <button 
                    className="copy-format-button"
                    onClick={() => copyToClipboard(timestampFormats.iso, 'ISO timestamp')}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="format-item">
                <label className="format-label">UTC:</label>
                <div className="format-value">
                  <code>{timestampFormats.utc}</code>
                  <button 
                    className="copy-format-button"
                    onClick={() => copyToClipboard(timestampFormats.utc, 'UTC timestamp')}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="format-item">
                <label className="format-label">Local:</label>
                <div className="format-value">
                  <code>{timestampFormats.local}</code>
                  <button 
                    className="copy-format-button"
                    onClick={() => copyToClipboard(timestampFormats.local, 'Local timestamp')}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="format-item">
                <label className="format-label">Relative:</label>
                <div className="format-value">
                  <code>{timestampFormats.relative}</code>
                  <button 
                    className="copy-format-button"
                    onClick={() => copyToClipboard(timestampFormats.relative, 'Relative time')}
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'lorem' && (
        <div className="dev-section lorem-section">
          <label className="section-label">📝 Lorem Ipsum Generator</label>
          
          <div className="lorem-controls">
            <div className="lorem-type-group">
              <label className="control-label">Type:</label>
              <select 
                value={loremType} 
                onChange={(e) => setLoremType(e.target.value as any)}
                className="lorem-type-select"
              >
                <option value="words">Words</option>
                <option value="sentences">Sentences</option>
                <option value="paragraphs">Paragraphs</option>
              </select>
            </div>
            <div className="lorem-count-group">
              <label className="control-label">Count:</label>
              <input
                type="number"
                value={loremCount}
                onChange={(e) => setLoremCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="100"
                className="lorem-count-input"
              />
            </div>
            <button className="generate-button" onClick={generateLorem}>
              🔄 Generate
            </button>
          </div>

          {loremText && (
            <div className="lorem-result">
              <div className="result-header">
                <label className="result-label">Generated Text:</label>
                <button 
                  className="copy-result-button"
                  onClick={() => copyToClipboard(loremText, 'Lorem ipsum text')}
                >
                  📋 Copy Text
                </button>
              </div>
              <textarea
                value={loremText}
                readOnly
                className="lorem-textarea"
                rows={8}
              />
            </div>
          )}
        </div>
      )}

      {mode === 'password' && (
        <div className="dev-section password-section">
          <label className="section-label">🔐 Password Generator</label>

          <div className="password-controls">
            <div className="password-options-grid">
              <div className="option-group">
                <label className="control-label">Length:</label>
                <input
                  type="number"
                  value={passwordOptions.length}
                  onChange={(e) => setPasswordOptions(prev => ({ ...prev, length: Math.max(4, Math.min(128, parseInt(e.target.value) || 16)) }))}
                  min="4"
                  max="128"
                  className="length-input"
                />
              </div>
              <div className="option-group">
                <label className="control-label">Count:</label>
                <input
                  type="number"
                  value={passwordCount}
                  onChange={(e) => setPasswordCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                  min="1"
                  max="20"
                  className="count-input"
                />
              </div>
            </div>

            <div className="password-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={passwordOptions.includeUppercase}
                  onChange={(e) => setPasswordOptions(prev => ({ ...prev, includeUppercase: e.target.checked }))}
                />
                Uppercase (A-Z)
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={passwordOptions.includeLowercase}
                  onChange={(e) => setPasswordOptions(prev => ({ ...prev, includeLowercase: e.target.checked }))}
                />
                Lowercase (a-z)
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={passwordOptions.includeNumbers}
                  onChange={(e) => setPasswordOptions(prev => ({ ...prev, includeNumbers: e.target.checked }))}
                />
                Numbers (0-9)
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={passwordOptions.includeSymbols}
                  onChange={(e) => setPasswordOptions(prev => ({ ...prev, includeSymbols: e.target.checked }))}
                />
                Symbols (!@#$...)
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={passwordOptions.excludeSimilar}
                  onChange={(e) => setPasswordOptions(prev => ({ ...prev, excludeSimilar: e.target.checked }))}
                />
                Exclude Similar (il1Lo0O)
              </label>
            </div>

            <button className="generate-button" onClick={generatePasswords}>
              🔄 Generate Passwords
            </button>
          </div>

          {generatedPasswords.length > 0 && (
            <div className="password-results">
              <div className="result-header">
                <label className="result-label">Generated Passwords:</label>
                <button
                  className="copy-result-button"
                  onClick={() => copyToClipboard(generatedPasswords.join('\n'), 'All passwords')}
                >
                  📋 Copy All
                </button>
              </div>
              <div className="password-list">
                {generatedPasswords.map((password, index) => (
                  <div key={index} className="password-item">
                    <code className="password-value">{password}</code>
                    <button
                      className="copy-item-button"
                      onClick={() => copyToClipboard(password, `Password ${index + 1}`)}
                    >
                      📋
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'uuid' && (
        <div className="dev-section uuid-section">
          <label className="section-label">🆔 UUID Generator</label>

          <div className="uuid-controls">
            <div className="uuid-options-grid">
              <div className="option-group">
                <label className="control-label">Count:</label>
                <input
                  type="number"
                  value={uuidCount}
                  onChange={(e) => setUuidCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                  min="1"
                  max="20"
                  className="count-input"
                />
              </div>
              <div className="option-group">
                <label className="control-label">Format:</label>
                <select
                  value={uuidFormat}
                  onChange={(e) => setUuidFormat(e.target.value as any)}
                  className="format-select"
                >
                  <option value="standard">Standard (with hyphens)</option>
                  <option value="compact">Compact (no hyphens)</option>
                  <option value="uppercase">Uppercase</option>
                </select>
              </div>
            </div>

            <button className="generate-button" onClick={generateUuids}>
              🔄 Generate UUIDs
            </button>
          </div>

          {generatedUuids.length > 0 && (
            <div className="uuid-results">
              <div className="result-header">
                <label className="result-label">Generated UUIDs:</label>
                <button
                  className="copy-result-button"
                  onClick={() => copyToClipboard(generatedUuids.join('\n'), 'All UUIDs')}
                >
                  📋 Copy All
                </button>
              </div>
              <div className="uuid-list">
                {generatedUuids.map((uuid, index) => (
                  <div key={index} className="uuid-item">
                    <code className="uuid-value">{uuid}</code>
                    <button
                      className="copy-item-button"
                      onClick={() => copyToClipboard(uuid, `UUID ${index + 1}`)}
                    >
                      📋
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'random' && (
        <div className="dev-section random-section">
          <label className="section-label">🎲 Random Data Generator</label>

          <div className="random-controls">
            <div className="random-options-grid">
              <div className="option-group">
                <label className="control-label">Type:</label>
                <select
                  value={randomDataType}
                  onChange={(e) => setRandomDataType(e.target.value as any)}
                  className="type-select"
                >
                  <option value="numbers">Random Numbers</option>
                  <option value="hex">Hex Colors</option>
                  <option value="base64">Base64 Strings</option>
                  <option value="names">Sample Names</option>
                </select>
              </div>
              <div className="option-group">
                <label className="control-label">Count:</label>
                <input
                  type="number"
                  value={randomCount}
                  onChange={(e) => setRandomCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                  min="1"
                  max="50"
                  className="count-input"
                />
              </div>
            </div>

            <button className="generate-button" onClick={generateRandomData}>
              🔄 Generate Data
            </button>
          </div>

          {randomData.length > 0 && (
            <div className="random-results">
              <div className="result-header">
                <label className="result-label">Generated Data:</label>
                <button
                  className="copy-result-button"
                  onClick={() => copyToClipboard(randomData.join('\n'), 'All random data')}
                >
                  📋 Copy All
                </button>
              </div>
              <div className="random-list">
                {randomData.map((item, index) => (
                  <div key={index} className="random-item">
                    <code className="random-value">{item}</code>
                    <button
                      className="copy-item-button"
                      onClick={() => copyToClipboard(item, `Item ${index + 1}`)}
                    >
                      📋
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DeveloperUtilities
