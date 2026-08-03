import React, { useState, useCallback, useEffect } from 'react'
import './sql-formatter.css'

type FormatMode = 'format' | 'minify' | 'validate'

interface SqlStats {
  characters: number
  lines: number
  size: string
  keywords: number
  tables: number
  columns: number
}

const SqlFormatter: React.FC = () => {
  const [inputSql, setInputSql] = useState('')
  const [outputSql, setOutputSql] = useState('')
  const [mode, setMode] = useState<FormatMode>('format')
  const [indentSize, setIndentSize] = useState(2)
  const [uppercaseKeywords, setUppercaseKeywords] = useState(true)
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [copyFeedback, setCopyFeedback] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState<SqlStats | null>(null)

  // SQL Keywords for highlighting and validation
  const sqlKeywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER',
    'ON', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL',
    'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
    'ALTER', 'DROP', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION', 'TRIGGER',
    'DATABASE', 'SCHEMA', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE',
    'CHECK', 'DEFAULT', 'AUTO_INCREMENT', 'IDENTITY', 'CONSTRAINT',
    'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'TOP', 'DISTINCT',
    'UNION', 'ALL', 'INTERSECT', 'EXCEPT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'AS', 'ASC', 'DESC', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CAST', 'CONVERT'
  ]

  // Format SQL with proper indentation and keyword casing
  const formatSql = useCallback((sqlString: string, indent: number, uppercase: boolean): string => {
    if (!sqlString.trim()) return ''
    
    try {
      let formatted = sqlString.trim()
      
      // Normalize whitespace
      formatted = formatted.replace(/\s+/g, ' ')
      
      // Handle keyword casing
      if (uppercase) {
        sqlKeywords.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
          formatted = formatted.replace(regex, keyword.toUpperCase())
        })
      } else {
        sqlKeywords.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
          formatted = formatted.replace(regex, keyword.toLowerCase())
        })
      }
      
      // Add line breaks and indentation
      const indentStr = indent === 0 ? '\t' : ' '.repeat(indent)
      
      // Major clauses on new lines
      formatted = formatted.replace(/\b(SELECT|FROM|WHERE|JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|ORDER BY|GROUP BY|HAVING|UNION|INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/gi, '\n$1')
      
      // Subqueries and parentheses
      formatted = formatted.replace(/\(/g, '(\n' + indentStr)
      formatted = formatted.replace(/\)/g, '\n)')
      
      // Commas in SELECT clauses
      formatted = formatted.replace(/,(?=\s*\w)/g, ',\n' + indentStr)
      
      // AND/OR conditions
      formatted = formatted.replace(/\b(AND|OR)\b/gi, '\n' + indentStr + '$1')
      
      // Clean up extra whitespace and empty lines
      formatted = formatted.replace(/\n\s*\n/g, '\n')
      formatted = formatted.replace(/^\s+|\s+$/gm, '')
      
      // Apply consistent indentation
      const lines = formatted.split('\n')
      let indentLevel = 0
      const formattedLines = lines.map(line => {
        const trimmedLine = line.trim()
        if (!trimmedLine) return ''
        
        // Decrease indent for closing parentheses
        if (trimmedLine.startsWith(')')) {
          indentLevel = Math.max(0, indentLevel - 1)
        }
        
        const indentedLine = indentStr.repeat(indentLevel) + trimmedLine
        
        // Increase indent for opening parentheses
        if (trimmedLine.includes('(') && !trimmedLine.includes(')')) {
          indentLevel++
        }
        
        return indentedLine
      })
      
      return formattedLines.join('\n')
    } catch (error) {
      throw new Error(`Error formatting SQL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [sqlKeywords])

  // Minify SQL
  const minifySql = useCallback((sqlString: string): string => {
    if (!sqlString.trim()) return ''
    
    try {
      let minified = sqlString.trim()
      
      // Remove comments
      minified = minified.replace(/--.*$/gm, '')
      minified = minified.replace(/\/\*[\s\S]*?\*\//g, '')
      
      // Normalize whitespace
      minified = minified.replace(/\s+/g, ' ')
      
      // Remove unnecessary spaces around operators and punctuation
      minified = minified.replace(/\s*([(),;=<>!])\s*/g, '$1')
      
      return minified.trim()
    } catch (error) {
      throw new Error(`Error minifying SQL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  // Basic SQL validation
  const validateSql = useCallback((sqlString: string): { valid: boolean; error?: string } => {
    if (!sqlString.trim()) return { valid: true }
    
    try {
      const sql = sqlString.trim().toUpperCase()
      
      // Check for basic SQL structure
      const hasValidStart = /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)/i.test(sql)
      if (!hasValidStart) {
        return { valid: false, error: 'SQL must start with a valid statement (SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, WITH)' }
      }
      
      // Check for balanced parentheses
      let parenCount = 0
      for (const char of sqlString) {
        if (char === '(') parenCount++
        if (char === ')') parenCount--
        if (parenCount < 0) {
          return { valid: false, error: 'Unmatched closing parenthesis' }
        }
      }
      if (parenCount > 0) {
        return { valid: false, error: 'Unmatched opening parenthesis' }
      }
      
      // Check for balanced quotes
      let singleQuoteCount = 0
      let doubleQuoteCount = 0
      for (let i = 0; i < sqlString.length; i++) {
        const char = sqlString[i]
        const prevChar = i > 0 ? sqlString[i - 1] : ''
        
        if (char === "'" && prevChar !== '\\') singleQuoteCount++
        if (char === '"' && prevChar !== '\\') doubleQuoteCount++
      }
      if (singleQuoteCount % 2 !== 0) {
        return { valid: false, error: 'Unmatched single quote' }
      }
      if (doubleQuoteCount % 2 !== 0) {
        return { valid: false, error: 'Unmatched double quote' }
      }
      
      return { valid: true }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown validation error' 
      }
    }
  }, [])

  // Calculate SQL statistics
  const calculateStats = useCallback((sqlString: string): SqlStats | null => {
    if (!sqlString.trim()) return null
    
    try {
      const lines = sqlString.split('\n').length
      const characters = sqlString.length
      const bytes = new TextEncoder().encode(sqlString).length
      
      // Count keywords
      let keywordCount = 0
      sqlKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
        const matches = sqlString.match(regex)
        if (matches) keywordCount += matches.length
      })
      
      // Estimate tables (words after FROM, JOIN, UPDATE, INSERT INTO, etc.)
      const tableRegex = /(?:FROM|JOIN|UPDATE|INSERT\s+INTO)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi
      const tableMatches = sqlString.match(tableRegex)
      const tableCount = tableMatches ? new Set(tableMatches.map(match => match.split(/\s+/).pop()?.toLowerCase())).size : 0
      
      // Estimate columns (words in SELECT clause, SET clause, etc.)
      const columnRegex = /(?:SELECT|SET)\s+([^FROM^WHERE^GROUP^ORDER^HAVING^LIMIT]+)/gi
      const columnMatches = sqlString.match(columnRegex)
      let columnCount = 0
      if (columnMatches) {
        columnMatches.forEach(match => {
          const columns = match.replace(/^(SELECT|SET)\s+/i, '').split(',')
          columnCount += columns.length
        })
      }
      
      return {
        characters,
        lines,
        size: bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`,
        keywords: keywordCount,
        tables: tableCount,
        columns: columnCount
      }
    } catch (error) {
      return null
    }
  }, [sqlKeywords])

  // Process SQL based on current mode
  const processSql = useCallback((sqlString: string): string => {
    try {
      setError('')
      
      if (!sqlString.trim()) {
        setStats(null)
        return ''
      }
      
      // Validate first
      const validation = validateSql(sqlString)
      if (!validation.valid) {
        setError(validation.error || 'Invalid SQL')
        setStats(null)
        return ''
      }
      
      // Calculate stats
      setStats(calculateStats(sqlString))
      
      // Process based on mode
      switch (mode) {
        case 'format':
          return formatSql(sqlString, indentSize, uppercaseKeywords)
        case 'minify':
          return minifySql(sqlString)
        case 'validate':
          return sqlString // Return original for validation mode
        default:
          return sqlString
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      setStats(null)
      return ''
    }
  }, [mode, indentSize, uppercaseKeywords, validateSql, formatSql, minifySql, calculateStats])

  // Handle real-time processing
  useEffect(() => {
    if (realTimeEnabled) {
      setOutputSql(processSql(inputSql))
    }
  }, [inputSql, mode, indentSize, uppercaseKeywords, realTimeEnabled, processSql])

  // Manual processing
  const handleProcess = useCallback(() => {
    setOutputSql(processSql(inputSql))
  }, [inputSql, processSql])

  // Copy output to clipboard
  const copyOutput = useCallback(async () => {
    if (!outputSql.trim()) return
    
    try {
      await navigator.clipboard.writeText(outputSql)
      setCopyFeedback('SQL copied to clipboard!')
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }, [outputSql])

  // Clear all text
  const clearAll = useCallback(() => {
    setInputSql('')
    setOutputSql('')
    setError('')
    setCopyFeedback('')
    setStats(null)
  }, [])

  // Load sample SQL
  const loadSample = useCallback(() => {
    const sampleSql = `SELECT u.id, u.username, u.email, p.title, p.content, p.created_at, c.name as category_name, COUNT(cm.id) as comment_count FROM users u INNER JOIN posts p ON u.id = p.user_id LEFT JOIN categories c ON p.category_id = c.id LEFT JOIN comments cm ON p.id = cm.post_id WHERE u.active = 1 AND p.published = 1 AND p.created_at >= '2024-01-01' GROUP BY u.id, p.id HAVING COUNT(cm.id) > 0 ORDER BY p.created_at DESC, comment_count DESC LIMIT 10;`
    setInputSql(sampleSql)
  }, [])

  return (
    <div className="sql-formatter">
      <h2>SQL Formatter</h2>

      <div className="sql-section sql-controls-section">
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
                      checked={uppercaseKeywords}
                      onChange={(e) => setUppercaseKeywords(e.target.checked)}
                    />
                    Uppercase keywords
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
          <button className="copy-button" onClick={copyOutput} disabled={!outputSql.trim()}>
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

      <div className="sql-section sql-conversion-section">
        <div className="conversion-container">
          <div className="text-field">
            <div className="text-field-header">
              <label className="text-field-label">SQL Input</label>
              <span className="char-count">{inputSql.length} chars</span>
            </div>
            <textarea
              value={inputSql}
              onChange={(e) => setInputSql(e.target.value)}
              placeholder="Enter SQL query here..."
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
                {mode === 'validate' ? 'Validation Result' : 'Processed SQL'}
              </label>
              <span className="char-count">{outputSql.length} chars</span>
            </div>
            <textarea
              value={mode === 'validate' ? (error ? `Invalid: ${error}` : 'Valid SQL ✅') : outputSql}
              readOnly
              placeholder={`${mode === 'format' ? 'Formatted' : mode === 'minify' ? 'Minified' : 'Validation result'} will appear here...`}
              className="output-textarea"
            />
          </div>
        </div>
      </div>

      {stats && (
        <div className="sql-section stats-section">
          <label className="stats-label">SQL Statistics</label>
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
              <span className="stat-label">Keywords:</span>
              <span className="stat-value">{stats.keywords.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tables:</span>
              <span className="stat-value">{stats.tables.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Columns:</span>
              <span className="stat-value">{stats.columns.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SqlFormatter
