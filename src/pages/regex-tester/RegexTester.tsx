import React, { useState, useCallback, useEffect, useMemo } from 'react'
import './regex-tester.css'

interface RegexMatch {
  match: string
  index: number
  groups: string[]
  namedGroups: Record<string, string>
}

interface RegexFlags {
  global: boolean
  ignoreCase: boolean
  multiline: boolean
  dotAll: boolean
  unicode: boolean
  sticky: boolean
}

interface CommonPattern {
  name: string
  pattern: string
  description: string
  flags: string
}

const RegexTester: React.FC = () => {
  const [pattern, setPattern] = useState('')
  const [testText, setTestText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [flags, setFlags] = useState<RegexFlags>({
    global: true,
    ignoreCase: false,
    multiline: false,
    dotAll: false,
    unicode: false,
    sticky: false
  })
  const [matches, setMatches] = useState<RegexMatch[]>([])
  const [replacedText, setReplacedText] = useState('')
  const [error, setError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [highlightedText, setHighlightedText] = useState('')

  // Common regex patterns
  const commonPatterns: CommonPattern[] = [
    {
      name: 'Email Address',
      pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
      description: 'Matches email addresses',
      flags: 'gi'
    },
    {
      name: 'URL',
      pattern: 'https?:\\/\\/[^\\s]+',
      description: 'Matches HTTP/HTTPS URLs',
      flags: 'gi'
    },
    {
      name: 'Phone Number (US)',
      pattern: '\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})',
      description: 'Matches US phone numbers',
      flags: 'g'
    },
    {
      name: 'IP Address',
      pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
      description: 'Matches IPv4 addresses',
      flags: 'g'
    },
    {
      name: 'Hexadecimal Color',
      pattern: '#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})',
      description: 'Matches hex color codes',
      flags: 'gi'
    },
    {
      name: 'Credit Card',
      pattern: '\\b(?:\\d{4}[-\\s]?){3}\\d{4}\\b',
      description: 'Matches credit card numbers',
      flags: 'g'
    },
    {
      name: 'Date (MM/DD/YYYY)',
      pattern: '\\b(0?[1-9]|1[0-2])\\/(0?[1-9]|[12][0-9]|3[01])\\/(19|20)\\d{2}\\b',
      description: 'Matches MM/DD/YYYY date format',
      flags: 'g'
    },
    {
      name: 'Time (24-hour)',
      pattern: '\\b([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?\\b',
      description: 'Matches 24-hour time format',
      flags: 'g'
    },
    {
      name: 'HTML Tags',
      pattern: '<\\/?[a-z][a-z0-9]*[^<>]*>',
      description: 'Matches HTML tags',
      flags: 'gi'
    },
    {
      name: 'Numbers',
      pattern: '-?\\d+(\\.\\d+)?',
      description: 'Matches integers and decimals',
      flags: 'g'
    }
  ]

  // Build regex flags string
  const getFlagsString = useCallback((flagsObj: RegexFlags): string => {
    let flagsStr = ''
    if (flagsObj.global) flagsStr += 'g'
    if (flagsObj.ignoreCase) flagsStr += 'i'
    if (flagsObj.multiline) flagsStr += 'm'
    if (flagsObj.dotAll) flagsStr += 's'
    if (flagsObj.unicode) flagsStr += 'u'
    if (flagsObj.sticky) flagsStr += 'y'
    return flagsStr
  }, [])

  // Parse flags string to object
  const parseFlagsString = useCallback((flagsStr: string): RegexFlags => {
    return {
      global: flagsStr.includes('g'),
      ignoreCase: flagsStr.includes('i'),
      multiline: flagsStr.includes('m'),
      dotAll: flagsStr.includes('s'),
      unicode: flagsStr.includes('u'),
      sticky: flagsStr.includes('y')
    }
  }, [])

  // Test regex pattern
  const testRegex = useCallback(() => {
    if (!pattern.trim()) {
      setMatches([])
      setHighlightedText('')
      setError('')
      return
    }

    try {
      const flagsStr = getFlagsString(flags)
      const regex = new RegExp(pattern, flagsStr)
      const foundMatches: RegexMatch[] = []
      let match

      if (flags.global) {
        while ((match = regex.exec(testText)) !== null) {
          foundMatches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
            namedGroups: match.groups || {}
          })
          
          // Prevent infinite loop on zero-length matches
          if (match.index === regex.lastIndex) {
            regex.lastIndex++
          }
        }
      } else {
        match = regex.exec(testText)
        if (match) {
          foundMatches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
            namedGroups: match.groups || {}
          })
        }
      }

      setMatches(foundMatches)
      setError('')
      
      // Create highlighted text
      if (foundMatches.length > 0) {
        let highlighted = testText
        let offset = 0
        
        foundMatches.forEach((m, index) => {
          const start = m.index + offset
          const end = start + m.match.length
          const highlightClass = `match-highlight match-${index % 5}`
          const replacement = `<span class="${highlightClass}" data-match="${index}">${m.match}</span>`
          
          highlighted = highlighted.slice(0, start) + replacement + highlighted.slice(end)
          offset += replacement.length - m.match.length
        })
        
        setHighlightedText(highlighted)
      } else {
        setHighlightedText(testText)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid regular expression')
      setMatches([])
      setHighlightedText('')
    }
  }, [pattern, testText, flags, getFlagsString])

  // Test regex replacement
  const testReplace = useCallback(() => {
    if (!pattern.trim() || !replaceText) {
      setReplacedText('')
      return
    }

    try {
      const flagsStr = getFlagsString(flags)
      const regex = new RegExp(pattern, flagsStr)
      const result = testText.replace(regex, replaceText)
      setReplacedText(result)
    } catch (err) {
      setReplacedText('Error: ' + (err instanceof Error ? err.message : 'Invalid replacement'))
    }
  }, [pattern, testText, replaceText, flags, getFlagsString])

  // Auto-test when inputs change
  useEffect(() => {
    testRegex()
  }, [testRegex])

  useEffect(() => {
    testReplace()
  }, [testReplace])

  // Load common pattern
  const loadPattern = useCallback((commonPattern: CommonPattern) => {
    setPattern(commonPattern.pattern)
    setFlags(parseFlagsString(commonPattern.flags))
  }, [parseFlagsString])

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback(`${label} copied to clipboard!`)
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }, [])

  // Load sample data
  const loadSample = useCallback(() => {
    setPattern('\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b')
    setTestText(`Contact us at support@example.com or sales@company.org
You can also reach admin@test.net for technical issues.
Invalid emails: notanemail, @invalid.com, test@`)
    setReplaceText('[EMAIL]')
    setFlags({
      global: true,
      ignoreCase: true,
      multiline: false,
      dotAll: false,
      unicode: false,
      sticky: false
    })
  }, [])

  // Clear all
  const clearAll = useCallback(() => {
    setPattern('')
    setTestText('')
    setReplaceText('')
    setMatches([])
    setReplacedText('')
    setError('')
    setCopyFeedback('')
    setHighlightedText('')
    setFlags({
      global: true,
      ignoreCase: false,
      multiline: false,
      dotAll: false,
      unicode: false,
      sticky: false
    })
  }, [])

  // Memoized regex info
  const regexInfo = useMemo(() => {
    if (!pattern.trim()) return null
    
    try {
      const flagsStr = getFlagsString(flags)
      const regex = new RegExp(pattern, flagsStr)
      return {
        pattern: regex.source,
        flags: regex.flags,
        global: regex.global,
        ignoreCase: regex.ignoreCase,
        multiline: regex.multiline,
        dotAll: regex.dotAll,
        unicode: regex.unicode,
        sticky: regex.sticky
      }
    } catch {
      return null
    }
  }, [pattern, flags, getFlagsString])

  return (
    <div className="regex-tester">
      <h2>Regex Tester</h2>

      <div className="regex-section controls-section">
        <div className="pattern-group">
          <label className="pattern-label">Regular Expression Pattern:</label>
          <div className="pattern-input-container">
            <span className="pattern-delimiter">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Enter regex pattern..."
              className="pattern-input"
            />
            <span className="pattern-delimiter">/</span>
            <span className="flags-display">{getFlagsString(flags)}</span>
          </div>
        </div>

        <div className="flags-group">
          <label className="flags-label">Flags:</label>
          <div className="flags-checkboxes">
            <label className="flag-checkbox">
              <input
                type="checkbox"
                checked={flags.global}
                onChange={(e) => setFlags(prev => ({ ...prev, global: e.target.checked }))}
              />
              <span className="flag-name">g</span>
              <span className="flag-desc">Global</span>
            </label>
            <label className="flag-checkbox">
              <input
                type="checkbox"
                checked={flags.ignoreCase}
                onChange={(e) => setFlags(prev => ({ ...prev, ignoreCase: e.target.checked }))}
              />
              <span className="flag-name">i</span>
              <span className="flag-desc">Ignore Case</span>
            </label>
            <label className="flag-checkbox">
              <input
                type="checkbox"
                checked={flags.multiline}
                onChange={(e) => setFlags(prev => ({ ...prev, multiline: e.target.checked }))}
              />
              <span className="flag-name">m</span>
              <span className="flag-desc">Multiline</span>
            </label>
            <label className="flag-checkbox">
              <input
                type="checkbox"
                checked={flags.dotAll}
                onChange={(e) => setFlags(prev => ({ ...prev, dotAll: e.target.checked }))}
              />
              <span className="flag-name">s</span>
              <span className="flag-desc">Dot All</span>
            </label>
            <label className="flag-checkbox">
              <input
                type="checkbox"
                checked={flags.unicode}
                onChange={(e) => setFlags(prev => ({ ...prev, unicode: e.target.checked }))}
              />
              <span className="flag-name">u</span>
              <span className="flag-desc">Unicode</span>
            </label>
            <label className="flag-checkbox">
              <input
                type="checkbox"
                checked={flags.sticky}
                onChange={(e) => setFlags(prev => ({ ...prev, sticky: e.target.checked }))}
              />
              <span className="flag-name">y</span>
              <span className="flag-desc">Sticky</span>
            </label>
          </div>
        </div>

        <div className="action-buttons">
          <button className="test-button" onClick={testRegex}>
            🔍 Test Regex
          </button>
          <button className="sample-button" onClick={loadSample}>
            📄 Load Sample
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

      <div className="regex-section input-section">
        <label className="section-label">Test Text</label>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="Enter text to test against the regex pattern..."
          className="test-textarea"
          rows={8}
        />
      </div>

      {highlightedText && (
        <div className="regex-section highlight-section">
          <div className="highlight-header">
            <label className="section-label">Highlighted Matches</label>
            <span className="match-count">{matches.length} match{matches.length !== 1 ? 'es' : ''}</span>
          </div>
          <div 
            className="highlighted-text"
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />
        </div>
      )}

      {matches.length > 0 && (
        <div className="regex-section matches-section">
          <label className="section-label">Match Details</label>
          <div className="matches-list">
            {matches.map((match, index) => (
              <div key={index} className="match-item">
                <div className="match-header">
                  <span className="match-index">Match {index + 1}</span>
                  <span className="match-position">Position: {match.index}-{match.index + match.match.length}</span>
                  <button 
                    className="copy-match-button"
                    onClick={() => copyToClipboard(match.match, 'Match')}
                  >
                    📋
                  </button>
                </div>
                <div className="match-content">
                  <div className="match-text">
                    <strong>Match:</strong> <code>{match.match}</code>
                  </div>
                  {match.groups.length > 0 && (
                    <div className="match-groups">
                      <strong>Groups:</strong>
                      <ul className="groups-list">
                        {match.groups.map((group, groupIndex) => (
                          <li key={groupIndex} className="group-item">
                            <span className="group-index">${groupIndex + 1}:</span>
                            <code>{group || '(empty)'}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Object.keys(match.namedGroups).length > 0 && (
                    <div className="named-groups">
                      <strong>Named Groups:</strong>
                      <ul className="groups-list">
                        {Object.entries(match.namedGroups).map(([name, value]) => (
                          <li key={name} className="group-item">
                            <span className="group-name">{name}:</span>
                            <code>{value || '(empty)'}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="regex-section replace-section">
        <label className="section-label">Replace Test</label>
        <div className="replace-input-group">
          <label className="replace-label">Replacement Text:</label>
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Enter replacement text (use $1, $2 for groups)..."
            className="replace-input"
          />
        </div>
        {replacedText && (
          <div className="replace-result">
            <div className="replace-header">
              <label className="replace-result-label">Replacement Result:</label>
              <button 
                className="copy-replace-button"
                onClick={() => copyToClipboard(replacedText, 'Replacement result')}
              >
                📋 Copy Result
              </button>
            </div>
            <textarea
              value={replacedText}
              readOnly
              className="replace-textarea"
              rows={6}
            />
          </div>
        )}
      </div>

      <div className="regex-section patterns-section">
        <label className="section-label">Common Patterns</label>
        <div className="patterns-grid">
          {commonPatterns.map((commonPattern, index) => (
            <div key={index} className="pattern-card">
              <div className="pattern-card-header">
                <span className="pattern-name">{commonPattern.name}</span>
                <button 
                  className="load-pattern-button"
                  onClick={() => loadPattern(commonPattern)}
                >
                  Load
                </button>
              </div>
              <div className="pattern-description">{commonPattern.description}</div>
              <div className="pattern-code">
                <code>/{commonPattern.pattern}/{commonPattern.flags}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {regexInfo && (
        <div className="regex-section info-section">
          <label className="section-label">Regex Information</label>
          <div className="regex-info-grid">
            <div className="info-item">
              <span className="info-label">Pattern:</span>
              <code className="info-value">/{regexInfo.pattern}/{regexInfo.flags}</code>
            </div>
            <div className="info-item">
              <span className="info-label">Flags:</span>
              <span className="info-value">{regexInfo.flags || 'none'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Global:</span>
              <span className="info-value">{regexInfo.global ? 'Yes' : 'No'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Case Insensitive:</span>
              <span className="info-value">{regexInfo.ignoreCase ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegexTester
