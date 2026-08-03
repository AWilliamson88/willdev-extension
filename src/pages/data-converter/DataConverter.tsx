import React, { useState, useCallback, useEffect, useMemo } from 'react'
import './data-converter.css'

type ConversionMode = 'csv-json' | 'json-csv' | 'xml-json' | 'json-xml' | 'yaml-json' | 'json-yaml' | 'tsv-json' | 'json-tsv'

interface ConversionStats {
  inputSize: number
  outputSize: number
  inputLines: number
  outputLines: number
  conversionTime: number
}

const DataConverter: React.FC = () => {
  const [mode, setMode] = useState<ConversionMode>('csv-json')
  const [inputData, setInputData] = useState('')
  const [outputData, setOutputData] = useState('')
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [copyFeedback, setCopyFeedback] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState<ConversionStats | null>(null)

  // CSV parsing options
  const [csvOptions, setCsvOptions] = useState({
    delimiter: ',',
    hasHeaders: true,
    skipEmptyLines: true,
    trimWhitespace: true
  })

  // JSON formatting options
  const [jsonOptions, setJsonOptions] = useState({
    indent: 2,
    sortKeys: false
  })

  // Parse CSV to JSON
  const csvToJson = useCallback((csvText: string): string => {
    if (!csvText.trim()) return ''

    try {
      const lines = csvText.split('\n').filter(line => 
        csvOptions.skipEmptyLines ? line.trim() : true
      )
      
      if (lines.length === 0) return '[]'

      const delimiter = csvOptions.delimiter
      const parseRow = (row: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < row.length; i++) {
          const char = row[i]
          const nextChar = row[i + 1]
          
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"'
              i++ // Skip next quote
            } else {
              inQuotes = !inQuotes
            }
          } else if (char === delimiter && !inQuotes) {
            result.push(csvOptions.trimWhitespace ? current.trim() : current)
            current = ''
          } else {
            current += char
          }
        }
        
        result.push(csvOptions.trimWhitespace ? current.trim() : current)
        return result
      }

      const rows = lines.map(parseRow)
      
      if (csvOptions.hasHeaders && rows.length > 0) {
        const headers = rows[0]
        const dataRows = rows.slice(1)
        
        const jsonArray = dataRows.map(row => {
          const obj: Record<string, string> = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        })
        
        return JSON.stringify(jsonArray, jsonOptions.sortKeys ? Object.keys(jsonArray[0] || {}).sort() : null, jsonOptions.indent)
      } else {
        return JSON.stringify(rows, null, jsonOptions.indent)
      }
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [csvOptions, jsonOptions])

  // Parse JSON to CSV
  const jsonToCsv = useCallback((jsonText: string): string => {
    if (!jsonText.trim()) return ''

    try {
      const data = JSON.parse(jsonText)
      
      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of objects for CSV conversion')
      }
      
      if (data.length === 0) return ''

      const delimiter = csvOptions.delimiter
      const escapeField = (field: string): string => {
        const stringField = String(field)
        if (stringField.includes(delimiter) || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`
        }
        return stringField
      }

      // Get all unique keys from all objects
      const allKeys = new Set<string>()
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => allKeys.add(key))
        }
      })
      
      const headers = Array.from(allKeys)
      const csvLines: string[] = []
      
      if (csvOptions.hasHeaders) {
        csvLines.push(headers.map(escapeField).join(delimiter))
      }
      
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          const row = headers.map(header => escapeField(item[header] || ''))
          csvLines.push(row.join(delimiter))
        } else {
          csvLines.push(escapeField(item))
        }
      })
      
      return csvLines.join('\n')
    } catch (error) {
      throw new Error(`JSON to CSV conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [csvOptions])

  // Parse XML to JSON
  const xmlToJson = useCallback((xmlText: string): string => {
    if (!xmlText.trim()) return ''

    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      
      const parserError = xmlDoc.querySelector('parsererror')
      if (parserError) {
        throw new Error('Invalid XML: ' + parserError.textContent)
      }

      const xmlToObject = (node: Element): any => {
        const obj: any = {}
        
        // Add attributes
        if (node.attributes.length > 0) {
          obj['@attributes'] = {}
          Array.from(node.attributes).forEach(attr => {
            obj['@attributes'][attr.name] = attr.value
          })
        }
        
        // Process child nodes
        const children = Array.from(node.childNodes)
        const textContent = children
          .filter(child => child.nodeType === Node.TEXT_NODE)
          .map(child => child.textContent?.trim())
          .filter(text => text)
          .join('')
        
        const elementChildren = children.filter(child => child.nodeType === Node.ELEMENT_NODE) as Element[]
        
        if (elementChildren.length === 0) {
          return textContent || (Object.keys(obj).length > 0 ? obj : null)
        }
        
        if (textContent) {
          obj['#text'] = textContent
        }
        
        elementChildren.forEach(child => {
          const childName = child.tagName
          const childValue = xmlToObject(child)
          
          if (obj[childName]) {
            if (!Array.isArray(obj[childName])) {
              obj[childName] = [obj[childName]]
            }
            obj[childName].push(childValue)
          } else {
            obj[childName] = childValue
          }
        })
        
        return obj
      }

      const result = xmlToObject(xmlDoc.documentElement)
      return JSON.stringify({ [xmlDoc.documentElement.tagName]: result }, null, jsonOptions.indent)
    } catch (error) {
      throw new Error(`XML to JSON conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [jsonOptions])

  // Parse JSON to XML
  const jsonToXml = useCallback((jsonText: string): string => {
    if (!jsonText.trim()) return ''

    try {
      const data = JSON.parse(jsonText)
      
      const objectToXml = (obj: any, rootName: string = 'root'): string => {
        if (obj === null || obj === undefined) {
          return `<${rootName}/>`
        }
        
        if (typeof obj !== 'object') {
          return `<${rootName}>${String(obj).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</${rootName}>`
        }
        
        if (Array.isArray(obj)) {
          return obj.map(item => objectToXml(item, 'item')).join('\n')
        }
        
        let xml = `<${rootName}`
        let content = ''
        
        // Handle attributes
        if (obj['@attributes']) {
          Object.entries(obj['@attributes']).forEach(([key, value]) => {
            xml += ` ${key}="${String(value).replace(/"/g, '&quot;')}"`
          })
        }
        
        // Handle text content
        if (obj['#text']) {
          content = String(obj['#text']).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        }
        
        // Handle child elements
        Object.entries(obj).forEach(([key, value]) => {
          if (key !== '@attributes' && key !== '#text') {
            if (Array.isArray(value)) {
              value.forEach(item => {
                content += '\n  ' + objectToXml(item, key).replace(/\n/g, '\n  ')
              })
            } else {
              content += '\n  ' + objectToXml(value, key).replace(/\n/g, '\n  ')
            }
          }
        })
        
        if (content) {
          xml += `>${content}\n</${rootName}>`
        } else {
          xml += '/>'
        }
        
        return xml
      }

      const rootKey = Object.keys(data)[0] || 'root'
      return `<?xml version="1.0" encoding="UTF-8"?>\n${objectToXml(data[rootKey] || data, rootKey)}`
    } catch (error) {
      throw new Error(`JSON to XML conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  // Simple YAML to JSON converter
  const yamlToJson = useCallback((yamlText: string): string => {
    if (!yamlText.trim()) return ''

    try {
      // This is a simplified YAML parser for basic structures
      const lines = yamlText.split('\n')
      const result: any = {}
      const stack: any[] = [result]
      let currentIndent = 0

      lines.forEach(line => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) return

        const indent = line.length - line.trimStart().length
        
        if (trimmed.includes(':')) {
          const [key, ...valueParts] = trimmed.split(':')
          const value = valueParts.join(':').trim()
          
          // Adjust stack based on indentation
          while (stack.length > 1 && indent <= currentIndent) {
            stack.pop()
            currentIndent -= 2
          }
          
          const current = stack[stack.length - 1]
          
          if (value) {
            // Parse value
            if (value === 'true' || value === 'false') {
              current[key.trim()] = value === 'true'
            } else if (!isNaN(Number(value))) {
              current[key.trim()] = Number(value)
            } else if (value.startsWith('"') && value.endsWith('"')) {
              current[key.trim()] = value.slice(1, -1)
            } else {
              current[key.trim()] = value
            }
          } else {
            // Object or array
            current[key.trim()] = {}
            stack.push(current[key.trim()])
            currentIndent = indent
          }
        } else if (trimmed.startsWith('-')) {
          // Array item
          const current = stack[stack.length - 1]
          if (!Array.isArray(current)) {
            // Convert to array
            const parent = stack[stack.length - 2]
            const keys = Object.keys(parent)
            const lastKey = keys[keys.length - 1]
            parent[lastKey] = [current]
            stack[stack.length - 1] = parent[lastKey]
          }
          
          const value = trimmed.slice(1).trim()
          if (value === 'true' || value === 'false') {
            current.push(value === 'true')
          } else if (!isNaN(Number(value))) {
            current.push(Number(value))
          } else {
            current.push(value)
          }
        }
      })

      return JSON.stringify(result, null, jsonOptions.indent)
    } catch (error) {
      throw new Error(`YAML to JSON conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [jsonOptions])

  // Simple JSON to YAML converter
  const jsonToYaml = useCallback((jsonText: string): string => {
    if (!jsonText.trim()) return ''

    try {
      const data = JSON.parse(jsonText)
      
      const objectToYaml = (obj: any, indent: number = 0): string => {
        const spaces = '  '.repeat(indent)
        
        if (obj === null || obj === undefined) {
          return 'null'
        }
        
        if (typeof obj === 'string') {
          return obj.includes('\n') || obj.includes(':') || obj.includes('#') ? `"${obj}"` : obj
        }
        
        if (typeof obj === 'number' || typeof obj === 'boolean') {
          return String(obj)
        }
        
        if (Array.isArray(obj)) {
          if (obj.length === 0) return '[]'
          return obj.map(item => `${spaces}- ${objectToYaml(item, indent + 1)}`).join('\n')
        }
        
        if (typeof obj === 'object') {
          const entries = Object.entries(obj)
          if (entries.length === 0) return '{}'
          
          return entries.map(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              return `${spaces}${key}:\n${objectToYaml(value, indent + 1)}`
            } else if (Array.isArray(value)) {
              if (value.length === 0) {
                return `${spaces}${key}: []`
              }
              return `${spaces}${key}:\n${objectToYaml(value, indent + 1)}`
            } else {
              return `${spaces}${key}: ${objectToYaml(value, indent)}`
            }
          }).join('\n')
        }
        
        return String(obj)
      }

      return objectToYaml(data)
    } catch (error) {
      throw new Error(`JSON to YAML conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  // TSV conversion (Tab-Separated Values)
  const tsvToJson = useCallback((tsvText: string): string => {
    const csvText = tsvText.replace(/\t/g, ',')
    return csvToJson(csvText)
  }, [csvToJson])

  const jsonToTsv = useCallback((jsonText: string): string => {
    const csvText = jsonToCsv(jsonText)
    return csvText.replace(/,/g, '\t')
  }, [jsonToCsv])

  // Main conversion function
  const convertData = useCallback((inputText: string): string => {
    if (!inputText.trim()) return ''

    const startTime = performance.now()
    
    try {
      let result = ''
      
      switch (mode) {
        case 'csv-json':
          result = csvToJson(inputText)
          break
        case 'json-csv':
          result = jsonToCsv(inputText)
          break
        case 'xml-json':
          result = xmlToJson(inputText)
          break
        case 'json-xml':
          result = jsonToXml(inputText)
          break
        case 'yaml-json':
          result = yamlToJson(inputText)
          break
        case 'json-yaml':
          result = jsonToYaml(inputText)
          break
        case 'tsv-json':
          result = tsvToJson(inputText)
          break
        case 'json-tsv':
          result = jsonToTsv(inputText)
          break
        default:
          result = inputText
      }
      
      const endTime = performance.now()
      
      // Calculate stats
      setStats({
        inputSize: new TextEncoder().encode(inputText).length,
        outputSize: new TextEncoder().encode(result).length,
        inputLines: inputText.split('\n').length,
        outputLines: result.split('\n').length,
        conversionTime: endTime - startTime
      })
      
      return result
    } catch (error) {
      throw error
    }
  }, [mode, csvToJson, jsonToCsv, xmlToJson, jsonToXml, yamlToJson, jsonToYaml, tsvToJson, jsonToTsv])

  // Handle real-time conversion
  useEffect(() => {
    if (realTimeEnabled) {
      try {
        setOutputData(convertData(inputData))
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Conversion failed')
        setOutputData('')
        setStats(null)
      }
    }
  }, [inputData, mode, csvOptions, jsonOptions, realTimeEnabled, convertData])

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
      setOutputData(convertData(inputData))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed')
      setOutputData('')
      setStats(null)
    }
  }, [inputData, convertData])

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
      'csv-json': 'name,age,city\nJohn,30,New York\nJane,25,Los Angeles\nBob,35,Chicago',
      'json-csv': '[\n  {"name": "John", "age": 30, "city": "New York"},\n  {"name": "Jane", "age": 25, "city": "Los Angeles"},\n  {"name": "Bob", "age": 35, "city": "Chicago"}\n]',
      'xml-json': '<?xml version="1.0"?>\n<users>\n  <user id="1">\n    <name>John</name>\n    <age>30</age>\n  </user>\n  <user id="2">\n    <name>Jane</name>\n    <age>25</age>\n  </user>\n</users>',
      'json-xml': '{\n  "users": {\n    "user": [\n      {"@attributes": {"id": "1"}, "name": "John", "age": "30"},\n      {"@attributes": {"id": "2"}, "name": "Jane", "age": "25"}\n    ]\n  }\n}',
      'yaml-json': 'users:\n  - name: John\n    age: 30\n    city: New York\n  - name: Jane\n    age: 25\n    city: Los Angeles',
      'json-yaml': '{\n  "users": [\n    {"name": "John", "age": 30, "city": "New York"},\n    {"name": "Jane", "age": 25, "city": "Los Angeles"}\n  ]\n}',
      'tsv-json': 'name\tage\tcity\nJohn\t30\tNew York\nJane\t25\tLos Angeles',
      'json-tsv': '[\n  {"name": "John", "age": 30, "city": "New York"},\n  {"name": "Jane", "age": 25, "city": "Los Angeles"}\n]'
    }
    setInputData(samples[mode])
    setError('')
  }, [mode])

  // Clear all
  const clearAll = useCallback(() => {
    setInputData('')
    setOutputData('')
    setError('')
    setCopyFeedback('')
    setStats(null)
  }, [])

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // Get conversion description
  const getConversionDescription = useCallback((currentMode: ConversionMode): string => {
    const descriptions = {
      'csv-json': 'Convert CSV (Comma-Separated Values) to JSON format with configurable parsing options',
      'json-csv': 'Convert JSON arrays to CSV format with proper escaping and delimiter handling',
      'xml-json': 'Convert XML documents to JSON with attribute and text content preservation',
      'json-xml': 'Convert JSON objects to well-formed XML with attribute and element support',
      'yaml-json': 'Convert YAML (YAML Ain\'t Markup Language) to JSON with type preservation',
      'json-yaml': 'Convert JSON to human-readable YAML format with proper indentation',
      'tsv-json': 'Convert TSV (Tab-Separated Values) to JSON format using tab delimiters',
      'json-tsv': 'Convert JSON arrays to TSV format with tab-separated columns'
    }
    return descriptions[currentMode]
  }, [])

  return (
    <div className="data-converter">
      <h2>Data Conversion Tools</h2>

      <div className="converter-section controls-section">
        <div className="mode-group">
          <label className="mode-label">Conversion Type:</label>
          <div className="mode-buttons">
            <button 
              className={`mode-button ${mode === 'csv-json' ? 'active' : ''}`}
              onClick={() => setMode('csv-json')}
            >
              📊 CSV → JSON
            </button>
            <button 
              className={`mode-button ${mode === 'json-csv' ? 'active' : ''}`}
              onClick={() => setMode('json-csv')}
            >
              📋 JSON → CSV
            </button>
            <button 
              className={`mode-button ${mode === 'xml-json' ? 'active' : ''}`}
              onClick={() => setMode('xml-json')}
            >
              🏷️ XML → JSON
            </button>
            <button 
              className={`mode-button ${mode === 'json-xml' ? 'active' : ''}`}
              onClick={() => setMode('json-xml')}
            >
              📄 JSON → XML
            </button>
            <button 
              className={`mode-button ${mode === 'yaml-json' ? 'active' : ''}`}
              onClick={() => setMode('yaml-json')}
            >
              📝 YAML → JSON
            </button>
            <button 
              className={`mode-button ${mode === 'json-yaml' ? 'active' : ''}`}
              onClick={() => setMode('json-yaml')}
            >
              📋 JSON → YAML
            </button>
            <button 
              className={`mode-button ${mode === 'tsv-json' ? 'active' : ''}`}
              onClick={() => setMode('tsv-json')}
            >
              📊 TSV → JSON
            </button>
            <button 
              className={`mode-button ${mode === 'json-tsv' ? 'active' : ''}`}
              onClick={() => setMode('json-tsv')}
            >
              📋 JSON → TSV
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
          <button className="copy-output-button" onClick={() => copyToClipboard(outputData, 'Output')}>
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

      <div className="converter-section description-section">
        <label className="section-label">About This Conversion</label>
        <p className="conversion-description">{getConversionDescription(mode)}</p>
      </div>

      {(mode.includes('csv') || mode.includes('tsv')) && (
        <div className="converter-section options-section">
          <label className="section-label">CSV/TSV Options</label>
          <div className="options-grid">
            <div className="option-group">
              <label className="option-label">Delimiter:</label>
              <select
                value={csvOptions.delimiter}
                onChange={(e) => setCsvOptions(prev => ({ ...prev, delimiter: e.target.value }))}
                className="delimiter-select"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab (\t)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>
            <div className="option-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={csvOptions.hasHeaders}
                  onChange={(e) => setCsvOptions(prev => ({ ...prev, hasHeaders: e.target.checked }))}
                />
                First row contains headers
              </label>
            </div>
            <div className="option-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={csvOptions.skipEmptyLines}
                  onChange={(e) => setCsvOptions(prev => ({ ...prev, skipEmptyLines: e.target.checked }))}
                />
                Skip empty lines
              </label>
            </div>
            <div className="option-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={csvOptions.trimWhitespace}
                  onChange={(e) => setCsvOptions(prev => ({ ...prev, trimWhitespace: e.target.checked }))}
                />
                Trim whitespace
              </label>
            </div>
          </div>
        </div>
      )}

      {mode.includes('json') && (
        <div className="converter-section options-section">
          <label className="section-label">JSON Options</label>
          <div className="options-grid">
            <div className="option-group">
              <label className="option-label">Indentation:</label>
              <select
                value={jsonOptions.indent}
                onChange={(e) => setJsonOptions(prev => ({ ...prev, indent: parseInt(e.target.value) }))}
                className="indent-select"
              >
                <option value="0">Minified</option>
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="8">8 spaces</option>
              </select>
            </div>
            <div className="option-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={jsonOptions.sortKeys}
                  onChange={(e) => setJsonOptions(prev => ({ ...prev, sortKeys: e.target.checked }))}
                />
                Sort object keys
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="converter-section conversion-section">
        <div className="text-fields">
          <div className="text-field">
            <div className="text-field-header">
              <label className="text-field-label">
                {mode.split('-')[0].toUpperCase()} Input
              </label>
              <span className="char-count">{inputData.length} chars</span>
            </div>
            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder={`Enter ${mode.split('-')[0].toUpperCase()} data here...`}
              className="input-textarea"
              rows={12}
            />
          </div>

          <div className="conversion-arrow">
            <span className="arrow-icon">→</span>
            <span className="conversion-label">
              {mode.split('-')[0].toUpperCase()} to {mode.split('-')[1].toUpperCase()}
            </span>
          </div>

          <div className="text-field">
            <div className="text-field-header">
              <label className="text-field-label">
                {mode.split('-')[1].toUpperCase()} Output
              </label>
              <span className="char-count">{outputData.length} chars</span>
            </div>
            <textarea
              value={outputData}
              readOnly
              placeholder={`Converted ${mode.split('-')[1].toUpperCase()} data will appear here...`}
              className="output-textarea"
              rows={12}
            />
          </div>
        </div>
      </div>

      {stats && (
        <div className="converter-section stats-section">
          <label className="section-label">Conversion Statistics</label>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Input size:</span>
              <span className="stat-value">{formatFileSize(stats.inputSize)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Output size:</span>
              <span className="stat-value">{formatFileSize(stats.outputSize)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Input lines:</span>
              <span className="stat-value">{stats.inputLines.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Output lines:</span>
              <span className="stat-value">{stats.outputLines.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Conversion time:</span>
              <span className="stat-value">{stats.conversionTime.toFixed(2)}ms</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Size change:</span>
              <span className={`stat-value ${stats.outputSize > stats.inputSize ? 'increase' : 'decrease'}`}>
                {stats.outputSize > stats.inputSize ? '+' : ''}
                {((stats.outputSize - stats.inputSize) / stats.inputSize * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="converter-section examples-section">
        <label className="section-label">Format Examples & Tips</label>
        <div className="examples-content">
          {mode === 'csv-json' && (
            <div className="example-text">
              <p><strong>CSV Format:</strong> Comma-separated values with optional headers</p>
              <p><strong>Example:</strong> <code>name,age,city\nJohn,30,&quot;New York&quot;</code></p>
              <p><strong>Tips:</strong> Use quotes for values containing commas or newlines</p>
            </div>
          )}
          {mode === 'json-csv' && (
            <div className="example-text">
              <p><strong>JSON Format:</strong> Array of objects with consistent properties</p>
              <p><strong>Example:</strong> <code>[{`{"name": "John", "age": 30}`}]</code></p>
              <p><strong>Tips:</strong> All objects should have the same structure for best results</p>
            </div>
          )}
          {mode === 'xml-json' && (
            <div className="example-text">
              <p><strong>XML Format:</strong> Well-formed XML with elements and attributes</p>
              <p><strong>Attributes:</strong> Converted to @attributes object</p>
              <p><strong>Text content:</strong> Stored in #text property when mixed with elements</p>
            </div>
          )}
          {mode === 'json-xml' && (
            <div className="example-text">
              <p><strong>JSON Format:</strong> Objects with @attributes for XML attributes</p>
              <p><strong>Example:</strong> <code>{`{"@attributes": {"id": "1"}, "name": "John"}`}</code></p>
              <p><strong>Tips:</strong> Use @attributes for XML attributes, #text for text content</p>
            </div>
          )}
          {mode === 'yaml-json' && (
            <div className="example-text">
              <p><strong>YAML Format:</strong> Indented structure with key-value pairs</p>
              <p><strong>Example:</strong> <code>name: John\nage: 30</code></p>
              <p><strong>Tips:</strong> Use consistent indentation (2 spaces recommended)</p>
            </div>
          )}
          {mode === 'json-yaml' && (
            <div className="example-text">
              <p><strong>JSON Format:</strong> Standard JSON objects and arrays</p>
              <p><strong>Output:</strong> Human-readable YAML with proper indentation</p>
              <p><strong>Tips:</strong> Complex nested structures are supported</p>
            </div>
          )}
          {(mode === 'tsv-json' || mode === 'json-tsv') && (
            <div className="example-text">
              <p><strong>TSV Format:</strong> Tab-separated values, similar to CSV but with tabs</p>
              <p><strong>Use case:</strong> Common in data science and spreadsheet exports</p>
              <p><strong>Tips:</strong> Tabs are automatically handled as delimiters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DataConverter
