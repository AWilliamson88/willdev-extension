import React, { useState, useCallback, useEffect } from 'react'
import './xml-formatter.css'

type FormatMode = 'format' | 'minify' | 'validate'

interface XmlStats {
  characters: number
  lines: number
  size: string
  elements: number
  attributes: number
  textNodes: number
}

const XmlFormatter: React.FC = () => {
  const [inputXml, setInputXml] = useState('')
  const [outputXml, setOutputXml] = useState('')
  const [mode, setMode] = useState<FormatMode>('format')
  const [indentSize, setIndentSize] = useState(2)
  const [sortAttributes, setSortAttributes] = useState(false)
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [copyFeedback, setCopyFeedback] = useState('')
  const [error, setError] = useState('')
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [stats, setStats] = useState<XmlStats | null>(null)

  // Format XML with proper indentation
  const formatXml = useCallback((xmlString: string, indent: number, sortAttrs: boolean): string => {
    if (!xmlString.trim()) return ''
    
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror')
      if (parserError) {
        throw new Error('Invalid XML: ' + parserError.textContent)
      }
      
      const indentStr = indent === 0 ? '\t' : ' '.repeat(indent)
      
      const formatNode = (node: Node, level: number = 0): string => {
        const currentIndent = indentStr.repeat(level)
        const nextIndent = indentStr.repeat(level + 1)
        
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element
          let result = currentIndent + '<' + element.tagName
          
          // Handle attributes
          const attributes = Array.from(element.attributes)
          if (sortAttrs) {
            attributes.sort((a, b) => a.name.localeCompare(b.name))
          }
          
          attributes.forEach(attr => {
            result += ` ${attr.name}="${attr.value}"`
          })
          
          if (element.childNodes.length === 0) {
            result += '/>'
          } else {
            result += '>'
            
            // Check if element has only text content
            const hasOnlyText = element.childNodes.length === 1 && 
                               element.childNodes[0].nodeType === Node.TEXT_NODE &&
                               element.childNodes[0].textContent?.trim()
            
            if (hasOnlyText) {
              result += element.textContent?.trim()
              result += '</' + element.tagName + '>'
            } else {
              let hasElementChildren = false
              for (const child of Array.from(element.childNodes)) {
                if (child.nodeType === Node.ELEMENT_NODE) {
                  hasElementChildren = true
                  result += '\n' + formatNode(child, level + 1)
                } else if (child.nodeType === Node.TEXT_NODE) {
                  const text = child.textContent?.trim()
                  if (text) {
                    result += '\n' + nextIndent + text
                  }
                } else if (child.nodeType === Node.CDATA_SECTION_NODE) {
                  result += '\n' + nextIndent + '<![CDATA[' + child.textContent + ']]>'
                } else if (child.nodeType === Node.COMMENT_NODE) {
                  result += '\n' + nextIndent + '<!--' + child.textContent + '-->'
                }
              }
              if (hasElementChildren || element.childNodes.length > 1) {
                result += '\n' + currentIndent
              }
              result += '</' + element.tagName + '>'
            }
          }
          return result
        } else if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim()
          return text ? currentIndent + text : ''
        } else if (node.nodeType === Node.COMMENT_NODE) {
          return currentIndent + '<!--' + node.textContent + '-->'
        } else if (node.nodeType === Node.CDATA_SECTION_NODE) {
          return currentIndent + '<![CDATA[' + node.textContent + ']]>'
        }
        
        return ''
      }
      
      let formatted = ''
      
      // Handle XML declaration
      if (xmlString.trim().startsWith('<?xml')) {
        const declarationMatch = xmlString.match(/<\?xml[^>]*\?>/)
        if (declarationMatch) {
          formatted += declarationMatch[0] + '\n'
        }
      }
      
      // Format document element and its children
      for (const child of Array.from(xmlDoc.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          formatted += formatNode(child, 0)
        } else if (child.nodeType === Node.COMMENT_NODE) {
          formatted += '<!--' + child.textContent + '-->\n'
        }
      }
      
      return formatted
    } catch (error) {
      throw new Error(`Error formatting XML: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  // Minify XML
  const minifyXml = useCallback((xmlString: string): string => {
    if (!xmlString.trim()) return ''
    
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror')
      if (parserError) {
        throw new Error('Invalid XML: ' + parserError.textContent)
      }
      
      const minifyNode = (node: Node): string => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element
          let result = '<' + element.tagName
          
          // Add attributes
          Array.from(element.attributes).forEach(attr => {
            result += ` ${attr.name}="${attr.value}"`
          })
          
          if (element.childNodes.length === 0) {
            result += '/>'
          } else {
            result += '>'
            
            for (const child of Array.from(element.childNodes)) {
              if (child.nodeType === Node.ELEMENT_NODE) {
                result += minifyNode(child)
              } else if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent?.trim()
                if (text) {
                  result += text
                }
              } else if (child.nodeType === Node.CDATA_SECTION_NODE) {
                result += '<![CDATA[' + child.textContent + ']]>'
              }
              // Skip comments in minified version
            }
            
            result += '</' + element.tagName + '>'
          }
          return result
        } else if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent?.trim() || ''
        } else if (node.nodeType === Node.CDATA_SECTION_NODE) {
          return '<![CDATA[' + node.textContent + ']]>'
        }
        
        return ''
      }
      
      let minified = ''
      
      // Handle XML declaration
      if (xmlString.trim().startsWith('<?xml')) {
        const declarationMatch = xmlString.match(/<\?xml[^>]*\?>/)
        if (declarationMatch) {
          minified += declarationMatch[0]
        }
      }
      
      // Minify document element and its children
      for (const child of Array.from(xmlDoc.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          minified += minifyNode(child)
        }
      }
      
      return minified
    } catch (error) {
      throw new Error(`Error minifying XML: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  // Validate XML
  const validateXml = useCallback((xmlString: string): { valid: boolean; error?: string } => {
    if (!xmlString.trim()) return { valid: true }
    
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror')
      if (parserError) {
        return { 
          valid: false, 
          error: parserError.textContent || 'XML parsing error' 
        }
      }
      
      return { valid: true }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown validation error' 
      }
    }
  }, [])

  // Calculate XML statistics
  const calculateStats = useCallback((xmlString: string): XmlStats | null => {
    if (!xmlString.trim()) return null
    
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror')
      if (parserError) return null
      
      const lines = xmlString.split('\n').length
      const characters = xmlString.length
      const bytes = new TextEncoder().encode(xmlString).length
      
      let elements = 0
      let attributes = 0
      let textNodes = 0
      
      const countNodes = (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          elements++
          const element = node as Element
          attributes += element.attributes.length
          
          for (const child of Array.from(node.childNodes)) {
            countNodes(child)
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim()
          if (text) {
            textNodes++
          }
        }
      }
      
      for (const child of Array.from(xmlDoc.childNodes)) {
        countNodes(child)
      }
      
      return {
        characters,
        lines,
        size: bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`,
        elements,
        attributes,
        textNodes
      }
    } catch (error) {
      return null
    }
  }, [])

  // Process XML based on current mode
  const processXml = useCallback((xmlString: string): string => {
    try {
      setError('')
      setIsValid(null)
      
      if (!xmlString.trim()) {
        setIsValid(null)
        setStats(null)
        return ''
      }
      
      // Validate first
      const validation = validateXml(xmlString)
      setIsValid(validation.valid)
      
      if (!validation.valid) {
        setError(validation.error || 'Invalid XML')
        setStats(null)
        return ''
      }
      
      // Calculate stats
      setStats(calculateStats(xmlString))
      
      // Process based on mode
      switch (mode) {
        case 'format':
          return formatXml(xmlString, indentSize, sortAttributes)
        case 'minify':
          return minifyXml(xmlString)
        case 'validate':
          return xmlString // Return original for validation mode
        default:
          return xmlString
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      setIsValid(false)
      setStats(null)
      return ''
    }
  }, [mode, indentSize, sortAttributes, validateXml, formatXml, minifyXml, calculateStats])

  // Handle real-time processing
  useEffect(() => {
    if (realTimeEnabled) {
      setOutputXml(processXml(inputXml))
    }
  }, [inputXml, mode, indentSize, sortAttributes, realTimeEnabled, processXml])

  // Manual processing
  const handleProcess = useCallback(() => {
    setOutputXml(processXml(inputXml))
  }, [inputXml, processXml])

  // Copy output to clipboard
  const copyOutput = useCallback(async () => {
    if (!outputXml.trim()) return
    
    try {
      await navigator.clipboard.writeText(outputXml)
      setCopyFeedback('XML copied to clipboard!')
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }, [outputXml])

  // Clear all text
  const clearAll = useCallback(() => {
    setInputXml('')
    setOutputXml('')
    setError('')
    setCopyFeedback('')
    setIsValid(null)
    setStats(null)
  }, [])

  // Load sample XML
  const loadSample = useCallback(() => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore xmlns="http://example.com/bookstore" xmlns:author="http://example.com/author">
  <!-- Book catalog -->
  <book id="1" category="fiction" available="true">
    <title lang="en">The Great Gatsby</title>
    <author:name>F. Scott Fitzgerald</author:name>
    <author:birth-year>1896</author:birth-year>
    <price currency="USD">12.99</price>
    <description><![CDATA[A classic American novel set in the Jazz Age.]]></description>
    <tags>
      <tag>classic</tag>
      <tag>american</tag>
      <tag>fiction</tag>
    </tags>
  </book>
  <book id="2" category="science" available="false">
    <title lang="en">A Brief History of Time</title>
    <author:name>Stephen Hawking</author:name>
    <author:birth-year>1942</author:birth-year>
    <price currency="USD">15.99</price>
    <description>An exploration of cosmology and theoretical physics.</description>
    <tags>
      <tag>science</tag>
      <tag>physics</tag>
      <tag>cosmology</tag>
    </tags>
  </book>
</bookstore>`
    setInputXml(sampleXml)
  }, [])

  return (
    <div className="xml-formatter">
      <h2>XML Formatter</h2>

      <div className="xml-section xml-controls-section">
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
                      checked={sortAttributes}
                      onChange={(e) => setSortAttributes(e.target.checked)}
                    />
                    Sort attributes
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
          <button className="copy-button" onClick={copyOutput} disabled={!outputXml.trim()}>
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
          {isValid ? '✅ Valid XML' : '❌ Invalid XML'}
        </div>
      )}

      <div className="xml-section xml-conversion-section">
        <div className="conversion-container">
          <div className="text-field">
            <div className="text-field-header">
              <label className="text-field-label">XML Input</label>
              <span className="char-count">{inputXml.length} chars</span>
            </div>
            <textarea
              value={inputXml}
              onChange={(e) => setInputXml(e.target.value)}
              placeholder="Enter XML here..."
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
                {mode === 'validate' ? 'Validation Result' : 'Processed XML'}
              </label>
              <span className="char-count">{outputXml.length} chars</span>
            </div>
            <textarea
              value={mode === 'validate' ? (isValid ? 'Valid XML ✅' : error ? `Invalid: ${error}` : '') : outputXml}
              readOnly
              placeholder={`${mode === 'format' ? 'Formatted' : mode === 'minify' ? 'Minified' : 'Validation result'} will appear here...`}
              className="output-textarea"
            />
          </div>
        </div>
      </div>

      {stats && (
        <div className="xml-section stats-section">
          <label className="stats-label">XML Statistics</label>
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
              <span className="stat-label">Elements:</span>
              <span className="stat-value">{stats.elements.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Attributes:</span>
              <span className="stat-value">{stats.attributes.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Text Nodes:</span>
              <span className="stat-value">{stats.textNodes.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default XmlFormatter
