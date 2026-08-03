import React, { useState, useCallback } from 'react'
import './guid-generator.css'

interface GuidOptions {
  includeHyphens: boolean
  uppercase: boolean
  quantity: number
}

const GuidGenerator: React.FC = () => {
  const [guids, setGuids] = useState<string[]>([])
  const [options, setOptions] = useState<GuidOptions>({
    includeHyphens: true,
    uppercase: false,
    quantity: 1
  })
  const [copyFeedback, setCopyFeedback] = useState<string>('')

  // Generate a single UUID v4
  const generateUUID = useCallback((): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }, [])

  // Format GUID according to options
  const formatGuid = useCallback((guid: string): string => {
    let formatted = guid
    
    if (!options.includeHyphens) {
      formatted = formatted.replace(/-/g, '')
    }
    
    if (options.uppercase) {
      formatted = formatted.toUpperCase()
    }
    
    return formatted
  }, [options])

  // Generate GUIDs based on current options
  const generateGuids = useCallback(() => {
    const newGuids: string[] = []
    
    for (let i = 0; i < options.quantity; i++) {
      const rawGuid = generateUUID()
      const formattedGuid = formatGuid(rawGuid)
      newGuids.push(formattedGuid)
    }
    
    setGuids(newGuids)
    setCopyFeedback('')
  }, [generateUUID, formatGuid, options.quantity])

  // Copy single GUID to clipboard
  const copyGuid = useCallback(async (guid: string) => {
    try {
      await navigator.clipboard.writeText(guid)
      setCopyFeedback(`Copied: ${guid}`)
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }, [])

  // Copy all GUIDs to clipboard
  const copyAllGuids = useCallback(async () => {
    if (guids.length === 0) return
    
    try {
      const allGuids = guids.join('\n')
      await navigator.clipboard.writeText(allGuids)
      setCopyFeedback(`Copied ${guids.length} GUIDs to clipboard`)
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }, [guids])

  // Clear all generated GUIDs
  const clearGuids = useCallback(() => {
    setGuids([])
    setCopyFeedback('')
  }, [])

  // Handle quantity change
  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (value >= 1 && value <= 100) {
      setOptions(prev => ({ ...prev, quantity: value }))
    }
  }, [])

  return (
    <div className="guid-generator">
      <h2>GUID Generator</h2>

      <div className="guid-section guid-options-section">
        <label className="guid-options-label">Generation Options</label>
        
        <div className="options-grid">
          <div className="option-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.includeHyphens}
                onChange={(e) => setOptions(prev => ({ ...prev, includeHyphens: e.target.checked }))}
              />
              Include hyphens
            </label>
          </div>

          <div className="option-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.uppercase}
                onChange={(e) => setOptions(prev => ({ ...prev, uppercase: e.target.checked }))}
              />
              Uppercase
            </label>
          </div>

          <div className="option-group">
            <label className="quantity-label">
              Quantity:
              <input
                type="number"
                min="1"
                max="100"
                value={options.quantity}
                onChange={handleQuantityChange}
                className="quantity-input"
              />
            </label>
          </div>
        </div>

        <div className="action-buttons">
          <button className="generate-button" onClick={generateGuids}>
            Generate GUIDs
          </button>
          {guids.length > 0 && (
            <>
              <button className="copy-all-button" onClick={copyAllGuids}>
                Copy All
              </button>
              <button className="clear-button" onClick={clearGuids}>
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {copyFeedback && (
        <div className="copy-feedback">
          {copyFeedback}
        </div>
      )}

      {guids.length > 0 && (
        <div className="guid-section guid-results-section">
          <label className="guid-results-label">Generated GUIDs ({guids.length})</label>
          
          <div className="guid-list">
            {guids.map((guid, index) => (
              <div key={index} className="guid-item">
                <code className="guid-text">{guid}</code>
                <button 
                  className="copy-guid-button"
                  onClick={() => copyGuid(guid)}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {guids.length === 0 && (
        <div className="guid-section guid-empty-section">
          <div className="empty-state">
            <span className="empty-icon">🆔</span>
            <p>Click "Generate GUIDs" to create new UUIDs</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GuidGenerator
