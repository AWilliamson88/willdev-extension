import React, { useState, useCallback, useEffect } from 'react'
import './text-tools.css'

type ToolMode = 'case' | 'escape' | 'encode' | 'transform'

interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  lines: number
  paragraphs: number
  sentences: number
}

const TextTools: React.FC = () => {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [mode, setMode] = useState<ToolMode>('case')
  const [selectedTool, setSelectedTool] = useState('uppercase')
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [copyFeedback, setCopyFeedback] = useState('')
  const [stats, setStats] = useState<TextStats | null>(null)

  // Case conversion tools
  const caseTools = {
    uppercase: (text: string) => text.toUpperCase(),
    lowercase: (text: string) => text.toLowerCase(),
    titlecase: (text: string) => text.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    ),
    sentencecase: (text: string) => text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase()),
    camelcase: (text: string) => text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    ).replace(/\s+/g, ''),
    pascalcase: (text: string) => text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => 
      word.toUpperCase()
    ).replace(/\s+/g, ''),
    snakecase: (text: string) => text.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, ''),
    kebabcase: (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
    constantcase: (text: string) => text.toUpperCase().replace(/\s+/g, '_').replace(/[^\w_]/g, ''),
    alternatingcase: (text: string) => text.split('').map((char, index) => 
      index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
    ).join(''),
    inversecase: (text: string) => text.split('').map(char => 
      char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
    ).join('')
  }

  // Escape/Unescape tools
  const escapeTools = {
    html: (text: string) => text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;'),
    unescapehtml: (text: string) => text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'"),
    javascript: (text: string) => JSON.stringify(text).slice(1, -1),
    unescapejavascript: (text: string) => {
      try {
        return JSON.parse('"' + text + '"')
      } catch {
        return text
      }
    },
    csv: (text: string) => '"' + text.replace(/"/g, '""') + '"',
    unescapecsv: (text: string) => text.startsWith('"') && text.endsWith('"') 
      ? text.slice(1, -1).replace(/""/g, '"') 
      : text,
    regex: (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    sql: (text: string) => text.replace(/'/g, "''"),
    unescapesql: (text: string) => text.replace(/''/g, "'")
  }

  // Encoding tools
  const encodeTools = {
    uri: (text: string) => encodeURI(text),
    uricomponent: (text: string) => encodeURIComponent(text),
    decodeuri: (text: string) => {
      try {
        return decodeURI(text)
      } catch {
        return text
      }
    },
    decodeuricomponent: (text: string) => {
      try {
        return decodeURIComponent(text)
      } catch {
        return text
      }
    }
  }

  // Transform tools
  const transformTools = {
    reverse: (text: string) => text.split('').reverse().join(''),
    removeextraspaces: (text: string) => text.replace(/\s+/g, ' ').trim(),
    removespaces: (text: string) => text.replace(/\s/g, ''),
    removelinebreaks: (text: string) => text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim(),
    addlinebreaks: (text: string) => text.replace(/\.\s+/g, '.\n'),
    removenumbers: (text: string) => text.replace(/\d/g, ''),
    removespecialchars: (text: string) => text.replace(/[^\w\s]/g, ''),
    extractnumbers: (text: string) => text.match(/\d+/g)?.join(' ') || '',
    extractemails: (text: string) => text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g)?.join('\n') || '',
    extracturls: (text: string) => text.match(/https?:\/\/[^\s]+/g)?.join('\n') || '',
    sortlines: (text: string) => text.split('\n').sort().join('\n'),
    shufflelines: (text: string) => {
      const lines = text.split('\n')
      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]]
      }
      return lines.join('\n')
    },
    uniquelines: (text: string) => [...new Set(text.split('\n'))].join('\n'),
    numberedlines: (text: string) => text.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n')
  }

  // Get available tools for current mode
  const getAvailableTools = useCallback(() => {
    switch (mode) {
      case 'case':
        return Object.keys(caseTools)
      case 'escape':
        return Object.keys(escapeTools)
      case 'encode':
        return Object.keys(encodeTools)
      case 'transform':
        return Object.keys(transformTools)
      default:
        return []
    }
  }, [mode])

  // Get tool display name
  const getToolDisplayName = useCallback((tool: string) => {
    const names: Record<string, string> = {
      uppercase: 'UPPERCASE',
      lowercase: 'lowercase',
      titlecase: 'Title Case',
      sentencecase: 'Sentence case',
      camelcase: 'camelCase',
      pascalcase: 'PascalCase',
      snakecase: 'snake_case',
      kebabcase: 'kebab-case',
      constantcase: 'CONSTANT_CASE',
      alternatingcase: 'aLtErNaTiNg CaSe',
      inversecase: 'iNVERSE cASE',
      html: 'HTML Escape',
      unescapehtml: 'HTML Unescape',
      javascript: 'JavaScript Escape',
      unescapejavascript: 'JavaScript Unescape',
      csv: 'CSV Escape',
      unescapecsv: 'CSV Unescape',
      regex: 'Regex Escape',
      sql: 'SQL Escape',
      unescapesql: 'SQL Unescape',
      uri: 'URI Encode',
      uricomponent: 'URI Component Encode',
      decodeuri: 'URI Decode',
      decodeuricomponent: 'URI Component Decode',
      reverse: 'Reverse Text',
      removeextraspaces: 'Remove Extra Spaces',
      removespaces: 'Remove All Spaces',
      removelinebreaks: 'Remove Line Breaks',
      addlinebreaks: 'Add Line Breaks',
      removenumbers: 'Remove Numbers',
      removespecialchars: 'Remove Special Characters',
      extractnumbers: 'Extract Numbers',
      extractemails: 'Extract Email Addresses',
      extracturls: 'Extract URLs',
      sortlines: 'Sort Lines',
      shufflelines: 'Shuffle Lines',
      uniquelines: 'Remove Duplicate Lines',
      numberedlines: 'Add Line Numbers'
    }
    return names[tool] || tool
  }, [])

  // Process text based on current mode and tool
  const processText = useCallback((text: string): string => {
    if (!text) return ''
    
    try {
      switch (mode) {
        case 'case':
          return caseTools[selectedTool as keyof typeof caseTools]?.(text) || text
        case 'escape':
          return escapeTools[selectedTool as keyof typeof escapeTools]?.(text) || text
        case 'encode':
          return encodeTools[selectedTool as keyof typeof encodeTools]?.(text) || text
        case 'transform':
          return transformTools[selectedTool as keyof typeof transformTools]?.(text) || text
        default:
          return text
      }
    } catch (error) {
      return text
    }
  }, [mode, selectedTool])

  // Calculate text statistics
  const calculateStats = useCallback((text: string): TextStats => {
    const characters = text.length
    const charactersNoSpaces = text.replace(/\s/g, '').length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const lines = text.split('\n').length
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).length : 0
    const sentences = text.trim() ? (text.match(/[.!?]+/g) || []).length : 0
    
    return {
      characters,
      charactersNoSpaces,
      words,
      lines,
      paragraphs,
      sentences
    }
  }, [])

  // Handle real-time processing
  useEffect(() => {
    if (realTimeEnabled) {
      setOutputText(processText(inputText))
    }
    setStats(calculateStats(inputText))
  }, [inputText, mode, selectedTool, realTimeEnabled, processText, calculateStats])

  // Handle mode change
  useEffect(() => {
    const availableTools = getAvailableTools()
    if (availableTools.length > 0 && !availableTools.includes(selectedTool)) {
      setSelectedTool(availableTools[0])
    }
  }, [mode, selectedTool, getAvailableTools])

  // Manual processing
  const handleProcess = useCallback(() => {
    setOutputText(processText(inputText))
  }, [inputText, processText])

  // Copy output to clipboard
  const copyOutput = useCallback(async () => {
    if (!outputText.trim()) return
    
    try {
      await navigator.clipboard.writeText(outputText)
      setCopyFeedback('Text copied to clipboard!')
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
    setStats(null)
  }, [])

  // Load sample text
  const loadSample = useCallback(() => {
    const sampleText = `Hello World! This is a sample text for testing various text manipulation tools.

It contains multiple paragraphs, different cases like UPPERCASE, lowercase, and Mixed Case.

You can test email extraction: john.doe@example.com, jane.smith@test.org
URL extraction: https://www.example.com, http://test.site.com

Numbers: 123, 456, 789
Special characters: @#$%^&*()

This text has multiple    spaces   and
line breaks for testing purposes.`
    setInputText(sampleText)
  }, [])

  return (
    <div className="text-tools">
      <h2>Text Tools</h2>

      <div className="text-section text-controls-section">
        <div className="controls-grid">
          <div className="mode-toggle">
            <label className="mode-label">Category:</label>
            <button 
              className={`mode-button ${mode === 'case' ? 'active' : ''}`}
              onClick={() => setMode('case')}
            >
              Case
            </button>
            <button 
              className={`mode-button ${mode === 'escape' ? 'active' : ''}`}
              onClick={() => setMode('escape')}
            >
              Escape
            </button>
            <button 
              className={`mode-button ${mode === 'encode' ? 'active' : ''}`}
              onClick={() => setMode('encode')}
            >
              Encode
            </button>
            <button 
              className={`mode-button ${mode === 'transform' ? 'active' : ''}`}
              onClick={() => setMode('transform')}
            >
              Transform
            </button>
          </div>

          <div className="tool-selector">
            <label className="tool-label">Tool:</label>
            <select 
              value={selectedTool} 
              onChange={(e) => setSelectedTool(e.target.value)}
              className="tool-select"
            >
              {getAvailableTools().map(tool => (
                <option key={tool} value={tool}>
                  {getToolDisplayName(tool)}
                </option>
              ))}
            </select>
          </div>

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

        <div className="action-buttons">
          {!realTimeEnabled && (
            <button className="process-button" onClick={handleProcess}>
              Process
            </button>
          )}
          <button className="sample-button" onClick={loadSample}>
            📄 Load Sample
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

      <div className="text-section text-conversion-section">
        <div className="conversion-container">
          <div className="text-field">
            <div className="text-field-header">
              <label className="text-field-label">Input Text</label>
              <span className="char-count">{inputText.length} chars</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text here..."
              className="input-textarea"
            />
          </div>

          <div className="conversion-arrow">
            <span className="arrow-icon">→</span>
            <span className="conversion-label">
              {getToolDisplayName(selectedTool)}
            </span>
          </div>

          <div className="text-field">
            <div className="text-field-header">
              <label className="text-field-label">Processed Text</label>
              <span className="char-count">{outputText.length} chars</span>
            </div>
            <textarea
              value={outputText}
              readOnly
              placeholder="Processed text will appear here..."
              className="output-textarea"
            />
          </div>
        </div>
      </div>

      {stats && (
        <div className="text-section stats-section">
          <label className="stats-label">Text Statistics</label>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Characters:</span>
              <span className="stat-value">{stats.characters.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Characters (no spaces):</span>
              <span className="stat-value">{stats.charactersNoSpaces.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Words:</span>
              <span className="stat-value">{stats.words.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Lines:</span>
              <span className="stat-value">{stats.lines.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Paragraphs:</span>
              <span className="stat-value">{stats.paragraphs.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sentences:</span>
              <span className="stat-value">{stats.sentences.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TextTools
