import React, { useState, useCallback, useEffect, useMemo } from 'react'
import './web-dev-utils.css'

type UtilityMode = 'css' | 'meta' | 'entities' | 'favicon'

interface CssGeneratorOptions {
  type: 'gradient' | 'shadow' | 'animation' | 'flexbox' | 'grid'
  gradient: {
    direction: string
    colors: Array<{ color: string; position: number }>
  }
  shadow: {
    x: number
    y: number
    blur: number
    spread: number
    color: string
    inset: boolean
  }
  animation: {
    name: string
    duration: string
    timing: string
    iteration: string
    direction: string
  }
  flexbox: {
    direction: string
    justify: string
    align: string
    wrap: string
    gap: string
  }
  grid: {
    columns: string
    rows: string
    gap: string
    justify: string
    align: string
  }
}

interface MetaTag {
  id: string
  type: 'basic' | 'og' | 'twitter' | 'custom'
  name: string
  content: string
  property?: string
}

interface HtmlEntity {
  character: string
  entity: string
  code: string
  description: string
}

const WebDevUtils: React.FC = () => {
  const [mode, setMode] = useState<UtilityMode>('css')
  const [cssOptions, setCssOptions] = useState<CssGeneratorOptions>({
    type: 'gradient',
    gradient: {
      direction: 'to right',
      colors: [
        { color: '#3498db', position: 0 },
        { color: '#e74c3c', position: 100 }
      ]
    },
    shadow: {
      x: 0,
      y: 4,
      blur: 8,
      spread: 0,
      color: '#000000',
      inset: false
    },
    animation: {
      name: 'fadeIn',
      duration: '1s',
      timing: 'ease-in-out',
      iteration: '1',
      direction: 'normal'
    },
    flexbox: {
      direction: 'row',
      justify: 'center',
      align: 'center',
      wrap: 'nowrap',
      gap: '1rem'
    },
    grid: {
      columns: 'repeat(3, 1fr)',
      rows: 'auto',
      gap: '1rem',
      justify: 'stretch',
      align: 'stretch'
    }
  })
  const [metaTags, setMetaTags] = useState<MetaTag[]>([])
  const [entityInput, setEntityInput] = useState('')
  const [entityOutput, setEntityOutput] = useState('')
  const [entityMode, setEntityMode] = useState<'encode' | 'decode'>('encode')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [error, setError] = useState('')

  // Common HTML entities
  const commonEntities: HtmlEntity[] = [
    { character: '&', entity: '&amp;', code: '&#38;', description: 'Ampersand' },
    { character: '<', entity: '&lt;', code: '&#60;', description: 'Less than' },
    { character: '>', entity: '&gt;', code: '&#62;', description: 'Greater than' },
    { character: '"', entity: '&quot;', code: '&#34;', description: 'Double quote' },
    { character: "'", entity: '&#39;', code: '&#39;', description: 'Single quote' },
    { character: ' ', entity: '&nbsp;', code: '&#160;', description: 'Non-breaking space' },
    { character: '©', entity: '&copy;', code: '&#169;', description: 'Copyright' },
    { character: '®', entity: '&reg;', code: '&#174;', description: 'Registered trademark' },
    { character: '™', entity: '&trade;', code: '&#8482;', description: 'Trademark' },
    { character: '€', entity: '&euro;', code: '&#8364;', description: 'Euro sign' },
    { character: '£', entity: '&pound;', code: '&#163;', description: 'Pound sign' },
    { character: '¥', entity: '&yen;', code: '&#165;', description: 'Yen sign' },
    { character: '→', entity: '&rarr;', code: '&#8594;', description: 'Right arrow' },
    { character: '←', entity: '&larr;', code: '&#8592;', description: 'Left arrow' },
    { character: '↑', entity: '&uarr;', code: '&#8593;', description: 'Up arrow' },
    { character: '↓', entity: '&darr;', code: '&#8595;', description: 'Down arrow' }
  ]

  // Generate CSS based on current options
  const generateCSS = useCallback((): string => {
    const { type } = cssOptions

    switch (type) {
      case 'gradient':
        const { direction, colors } = cssOptions.gradient
        const colorStops = colors
          .sort((a, b) => a.position - b.position)
          .map(c => `${c.color} ${c.position}%`)
          .join(', ')
        return `background: linear-gradient(${direction}, ${colorStops});`

      case 'shadow':
        const { x, y, blur, spread, color, inset } = cssOptions.shadow
        const insetText = inset ? 'inset ' : ''
        return `box-shadow: ${insetText}${x}px ${y}px ${blur}px ${spread}px ${color};`

      case 'animation':
        const { name, duration, timing, iteration, direction: animDirection } = cssOptions.animation
        return `animation: ${name} ${duration} ${timing} ${iteration} ${animDirection};

@keyframes ${name} {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}`

      case 'flexbox':
        const { direction: flexDir, justify, align, wrap, gap } = cssOptions.flexbox
        return `display: flex;
flex-direction: ${flexDir};
justify-content: ${justify};
align-items: ${align};
flex-wrap: ${wrap};
gap: ${gap};`

      case 'grid':
        const { columns, rows, gap: gridGap, justify: gridJustify, align: gridAlign } = cssOptions.grid
        return `display: grid;
grid-template-columns: ${columns};
grid-template-rows: ${rows};
gap: ${gridGap};
justify-items: ${gridJustify};
align-items: ${gridAlign};`

      default:
        return ''
    }
  }, [cssOptions])

  // Generate meta tags HTML
  const generateMetaHTML = useCallback((): string => {
    if (metaTags.length === 0) return ''

    return metaTags
      .map(tag => {
        if (tag.type === 'og' || tag.type === 'twitter') {
          return `<meta property="${tag.property || tag.name}" content="${tag.content}" />`
        } else {
          return `<meta name="${tag.name}" content="${tag.content}" />`
        }
      })
      .join('\n')
  }, [metaTags])

  // HTML entity encoding/decoding
  const processEntities = useCallback((text: string, mode: 'encode' | 'decode'): string => {
    if (mode === 'encode') {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\u00A0/g, '&nbsp;')
        .replace(/©/g, '&copy;')
        .replace(/®/g, '&reg;')
        .replace(/™/g, '&trade;')
        .replace(/€/g, '&euro;')
        .replace(/£/g, '&pound;')
        .replace(/¥/g, '&yen;')
    } else {
      return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, '\u00A0')
        .replace(/&copy;/g, '©')
        .replace(/&reg;/g, '®')
        .replace(/&trade;/g, '™')
        .replace(/&euro;/g, '€')
        .replace(/&pound;/g, '£')
        .replace(/&yen;/g, '¥')
        .replace(/&rarr;/g, '→')
        .replace(/&larr;/g, '←')
        .replace(/&uarr;/g, '↑')
        .replace(/&darr;/g, '↓')
    }
  }, [])

  // Update CSS options
  const updateCssOption = useCallback((path: string, value: any) => {
    setCssOptions(prev => {
      const keys = path.split('.')
      const newOptions = { ...prev }
      let current: any = newOptions
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newOptions
    })
  }, [])

  // Add gradient color
  const addGradientColor = useCallback(() => {
    setCssOptions(prev => ({
      ...prev,
      gradient: {
        ...prev.gradient,
        colors: [
          ...prev.gradient.colors,
          { color: '#000000', position: 50 }
        ]
      }
    }))
  }, [])

  // Remove gradient color
  const removeGradientColor = useCallback((index: number) => {
    setCssOptions(prev => ({
      ...prev,
      gradient: {
        ...prev.gradient,
        colors: prev.gradient.colors.filter((_, i) => i !== index)
      }
    }))
  }, [])

  // Add meta tag
  const addMetaTag = useCallback(() => {
    const newTag: MetaTag = {
      id: `meta_${Date.now()}`,
      type: 'basic',
      name: '',
      content: ''
    }
    setMetaTags(prev => [...prev, newTag])
  }, [])

  // Update meta tag
  const updateMetaTag = useCallback((id: string, field: keyof MetaTag, value: string) => {
    setMetaTags(prev => prev.map(tag => 
      tag.id === id ? { ...tag, [field]: value } : tag
    ))
  }, [])

  // Remove meta tag
  const removeMetaTag = useCallback((id: string) => {
    setMetaTags(prev => prev.filter(tag => tag.id !== id))
  }, [])

  // Load common meta tags
  const loadCommonMetaTags = useCallback(() => {
    const commonTags: Omit<MetaTag, 'id'>[] = [
      { type: 'basic', name: 'description', content: 'Your page description here' },
      { type: 'basic', name: 'keywords', content: 'keyword1, keyword2, keyword3' },
      { type: 'basic', name: 'author', content: 'Your Name' },
      { type: 'basic', name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { type: 'og', name: 'og:title', property: 'og:title', content: 'Your Page Title' },
      { type: 'og', name: 'og:description', property: 'og:description', content: 'Your page description' },
      { type: 'og', name: 'og:image', property: 'og:image', content: 'https://example.com/image.jpg' },
      { type: 'og', name: 'og:url', property: 'og:url', content: 'https://example.com' },
      { type: 'twitter', name: 'twitter:card', property: 'twitter:card', content: 'summary_large_image' },
      { type: 'twitter', name: 'twitter:title', property: 'twitter:title', content: 'Your Page Title' }
    ]

    const newTags = commonTags.map(tag => ({
      ...tag,
      id: `meta_${Date.now()}_${Math.random()}`
    }))

    setMetaTags(newTags)
  }, [])

  // Process entity input
  useEffect(() => {
    if (entityInput) {
      setEntityOutput(processEntities(entityInput, entityMode))
    } else {
      setEntityOutput('')
    }
  }, [entityInput, entityMode, processEntities])

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

  // Clear all data
  const clearAll = useCallback(() => {
    setCssOptions({
      type: 'gradient',
      gradient: {
        direction: 'to right',
        colors: [
          { color: '#3498db', position: 0 },
          { color: '#e74c3c', position: 100 }
        ]
      },
      shadow: {
        x: 0,
        y: 4,
        blur: 8,
        spread: 0,
        color: '#000000',
        inset: false
      },
      animation: {
        name: 'fadeIn',
        duration: '1s',
        timing: 'ease-in-out',
        iteration: '1',
        direction: 'normal'
      },
      flexbox: {
        direction: 'row',
        justify: 'center',
        align: 'center',
        wrap: 'nowrap',
        gap: '1rem'
      },
      grid: {
        columns: 'repeat(3, 1fr)',
        rows: 'auto',
        gap: '1rem',
        justify: 'stretch',
        align: 'stretch'
      }
    })
    setMetaTags([])
    setEntityInput('')
    setEntityOutput('')
    setError('')
  }, [])

  // Get mode description
  const getModeDescription = useCallback((currentMode: UtilityMode): string => {
    const descriptions = {
      css: 'Generate CSS code for gradients, shadows, animations, flexbox, and grid layouts with visual controls',
      meta: 'Create HTML meta tags for SEO, Open Graph, Twitter Cards, and other metadata with templates',
      entities: 'Encode and decode HTML entities for safe HTML content and special character handling',
      favicon: 'Generate favicon code and meta tags for different devices and browsers (coming soon)'
    }
    return descriptions[currentMode]
  }, [])

  // Generated CSS code
  const generatedCSS = useMemo(() => generateCSS(), [generateCSS])

  // Generated meta HTML
  const generatedMetaHTML = useMemo(() => generateMetaHTML(), [generateMetaHTML])

  return (
    <div className="web-dev-utils">
      <h2>Web Development Utilities</h2>

      <div className="utils-section controls-section">
        <div className="mode-group">
          <label className="mode-label">Utility Mode:</label>
          <div className="mode-buttons">
            <button 
              className={`mode-button ${mode === 'css' ? 'active' : ''}`}
              onClick={() => setMode('css')}
            >
              🎨 CSS Generator
            </button>
            <button 
              className={`mode-button ${mode === 'meta' ? 'active' : ''}`}
              onClick={() => setMode('meta')}
            >
              🏷️ Meta Tags
            </button>
            <button 
              className={`mode-button ${mode === 'entities' ? 'active' : ''}`}
              onClick={() => setMode('entities')}
            >
              🔤 HTML Entities
            </button>
            <button 
              className={`mode-button ${mode === 'favicon' ? 'active' : ''}`}
              onClick={() => setMode('favicon')}
            >
              🖼️ Favicon (Soon)
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button className="clear-button" onClick={clearAll}>
            🗑️ Clear All
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

      <div className="utils-section description-section">
        <label className="section-label">About This Mode</label>
        <p className="mode-description">{getModeDescription(mode)}</p>
      </div>

      {mode === 'css' && (
        <div className="css-generator-layout">
          <div className="css-controls-panel">
            <label className="section-label">CSS Generator Type</label>
            <div className="css-type-buttons">
              <button
                className={`css-type-button ${cssOptions.type === 'gradient' ? 'active' : ''}`}
                onClick={() => updateCssOption('type', 'gradient')}
              >
                🌈 Gradient
              </button>
              <button
                className={`css-type-button ${cssOptions.type === 'shadow' ? 'active' : ''}`}
                onClick={() => updateCssOption('type', 'shadow')}
              >
                🌑 Shadow
              </button>
              <button
                className={`css-type-button ${cssOptions.type === 'animation' ? 'active' : ''}`}
                onClick={() => updateCssOption('type', 'animation')}
              >
                ✨ Animation
              </button>
              <button
                className={`css-type-button ${cssOptions.type === 'flexbox' ? 'active' : ''}`}
                onClick={() => updateCssOption('type', 'flexbox')}
              >
                📦 Flexbox
              </button>
              <button
                className={`css-type-button ${cssOptions.type === 'grid' ? 'active' : ''}`}
                onClick={() => updateCssOption('type', 'grid')}
              >
                🔲 Grid
              </button>
            </div>

          {cssOptions.type === 'gradient' && (
            <div className="utils-section gradient-controls">
              <label className="section-label">Gradient Settings</label>

              <div className="gradient-direction">
                <label>Direction:</label>
                <select
                  value={cssOptions.gradient.direction}
                  onChange={(e) => updateCssOption('gradient.direction', e.target.value)}
                  className="direction-select"
                >
                  <option value="to right">To Right</option>
                  <option value="to left">To Left</option>
                  <option value="to bottom">To Bottom</option>
                  <option value="to top">To Top</option>
                  <option value="to bottom right">To Bottom Right</option>
                  <option value="to bottom left">To Bottom Left</option>
                  <option value="to top right">To Top Right</option>
                  <option value="to top left">To Top Left</option>
                  <option value="45deg">45 degrees</option>
                  <option value="90deg">90 degrees</option>
                  <option value="135deg">135 degrees</option>
                  <option value="180deg">180 degrees</option>
                </select>
              </div>

              <div className="gradient-colors">
                <div className="colors-header">
                  <label>Colors:</label>
                  <button className="add-color-button" onClick={addGradientColor}>
                    ➕ Add Color
                  </button>
                </div>

                <div className="color-stops">
                  {cssOptions.gradient.colors.map((colorStop, index) => (
                    <div key={index} className="color-stop">
                      <input
                        type="color"
                        value={colorStop.color}
                        onChange={(e) => {
                          const newColors = [...cssOptions.gradient.colors]
                          newColors[index].color = e.target.value
                          updateCssOption('gradient.colors', newColors)
                        }}
                        className="color-picker"
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={colorStop.position}
                        onChange={(e) => {
                          const newColors = [...cssOptions.gradient.colors]
                          newColors[index].position = parseInt(e.target.value)
                          updateCssOption('gradient.colors', newColors)
                        }}
                        className="position-slider"
                      />
                      <span className="position-value">{colorStop.position}%</span>
                      {cssOptions.gradient.colors.length > 2 && (
                        <button
                          className="remove-color-button"
                          onClick={() => removeGradientColor(index)}
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="gradient-preview">
                <label>Preview:</label>
                <div
                  className="preview-box"
                  style={{ background: `linear-gradient(${cssOptions.gradient.direction}, ${cssOptions.gradient.colors.map(c => `${c.color} ${c.position}%`).join(', ')})` }}
                />
              </div>
            </div>
          )}

          {cssOptions.type === 'shadow' && (
            <div className="utils-section shadow-controls">
              <label className="section-label">Box Shadow Settings</label>

              <div className="shadow-inputs">
                <div className="shadow-input-group">
                  <label>X Offset:</label>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={cssOptions.shadow.x}
                    onChange={(e) => updateCssOption('shadow.x', parseInt(e.target.value))}
                  />
                  <span>{cssOptions.shadow.x}px</span>
                </div>

                <div className="shadow-input-group">
                  <label>Y Offset:</label>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={cssOptions.shadow.y}
                    onChange={(e) => updateCssOption('shadow.y', parseInt(e.target.value))}
                  />
                  <span>{cssOptions.shadow.y}px</span>
                </div>

                <div className="shadow-input-group">
                  <label>Blur:</label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={cssOptions.shadow.blur}
                    onChange={(e) => updateCssOption('shadow.blur', parseInt(e.target.value))}
                  />
                  <span>{cssOptions.shadow.blur}px</span>
                </div>

                <div className="shadow-input-group">
                  <label>Spread:</label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={cssOptions.shadow.spread}
                    onChange={(e) => updateCssOption('shadow.spread', parseInt(e.target.value))}
                  />
                  <span>{cssOptions.shadow.spread}px</span>
                </div>

                <div className="shadow-input-group">
                  <label>Color:</label>
                  <input
                    type="color"
                    value={cssOptions.shadow.color}
                    onChange={(e) => updateCssOption('shadow.color', e.target.value)}
                    className="color-picker"
                  />
                </div>

                <div className="shadow-input-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={cssOptions.shadow.inset}
                      onChange={(e) => updateCssOption('shadow.inset', e.target.checked)}
                    />
                    Inset Shadow
                  </label>
                </div>
              </div>

              <div className="shadow-preview">
                <label>Preview:</label>
                <div
                  className="preview-box shadow-preview-box"
                  style={{
                    boxShadow: `${cssOptions.shadow.inset ? 'inset ' : ''}${cssOptions.shadow.x}px ${cssOptions.shadow.y}px ${cssOptions.shadow.blur}px ${cssOptions.shadow.spread}px ${cssOptions.shadow.color}`
                  }}
                />
              </div>
            </div>
          )}

          {cssOptions.type === 'animation' && (
            <div className="utils-section animation-controls">
              <label className="section-label">Animation Settings</label>

              <div className="animation-inputs">
                <div className="animation-input-group">
                  <label>Animation Name:</label>
                  <input
                    type="text"
                    value={cssOptions.animation.name}
                    onChange={(e) => updateCssOption('animation.name', e.target.value)}
                    placeholder="fadeIn"
                  />
                </div>

                <div className="animation-input-group">
                  <label>Duration:</label>
                  <select
                    value={cssOptions.animation.duration}
                    onChange={(e) => updateCssOption('animation.duration', e.target.value)}
                  >
                    <option value="0.3s">0.3s</option>
                    <option value="0.5s">0.5s</option>
                    <option value="1s">1s</option>
                    <option value="2s">2s</option>
                    <option value="3s">3s</option>
                  </select>
                </div>

                <div className="animation-input-group">
                  <label>Timing Function:</label>
                  <select
                    value={cssOptions.animation.timing}
                    onChange={(e) => updateCssOption('animation.timing', e.target.value)}
                  >
                    <option value="ease">ease</option>
                    <option value="ease-in">ease-in</option>
                    <option value="ease-out">ease-out</option>
                    <option value="ease-in-out">ease-in-out</option>
                    <option value="linear">linear</option>
                  </select>
                </div>

                <div className="animation-input-group">
                  <label>Iteration Count:</label>
                  <select
                    value={cssOptions.animation.iteration}
                    onChange={(e) => updateCssOption('animation.iteration', e.target.value)}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="infinite">infinite</option>
                  </select>
                </div>

                <div className="animation-input-group">
                  <label>Direction:</label>
                  <select
                    value={cssOptions.animation.direction}
                    onChange={(e) => updateCssOption('animation.direction', e.target.value)}
                  >
                    <option value="normal">normal</option>
                    <option value="reverse">reverse</option>
                    <option value="alternate">alternate</option>
                    <option value="alternate-reverse">alternate-reverse</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {cssOptions.type === 'flexbox' && (
            <div className="utils-section flexbox-controls">
              <label className="section-label">Flexbox Settings</label>

              <div className="flexbox-inputs">
                <div className="flexbox-input-group">
                  <label>Flex Direction:</label>
                  <select
                    value={cssOptions.flexbox.direction}
                    onChange={(e) => updateCssOption('flexbox.direction', e.target.value)}
                  >
                    <option value="row">row</option>
                    <option value="row-reverse">row-reverse</option>
                    <option value="column">column</option>
                    <option value="column-reverse">column-reverse</option>
                  </select>
                </div>

                <div className="flexbox-input-group">
                  <label>Justify Content:</label>
                  <select
                    value={cssOptions.flexbox.justify}
                    onChange={(e) => updateCssOption('flexbox.justify', e.target.value)}
                  >
                    <option value="flex-start">flex-start</option>
                    <option value="flex-end">flex-end</option>
                    <option value="center">center</option>
                    <option value="space-between">space-between</option>
                    <option value="space-around">space-around</option>
                    <option value="space-evenly">space-evenly</option>
                  </select>
                </div>

                <div className="flexbox-input-group">
                  <label>Align Items:</label>
                  <select
                    value={cssOptions.flexbox.align}
                    onChange={(e) => updateCssOption('flexbox.align', e.target.value)}
                  >
                    <option value="stretch">stretch</option>
                    <option value="flex-start">flex-start</option>
                    <option value="flex-end">flex-end</option>
                    <option value="center">center</option>
                    <option value="baseline">baseline</option>
                  </select>
                </div>

                <div className="flexbox-input-group">
                  <label>Flex Wrap:</label>
                  <select
                    value={cssOptions.flexbox.wrap}
                    onChange={(e) => updateCssOption('flexbox.wrap', e.target.value)}
                  >
                    <option value="nowrap">nowrap</option>
                    <option value="wrap">wrap</option>
                    <option value="wrap-reverse">wrap-reverse</option>
                  </select>
                </div>

                <div className="flexbox-input-group">
                  <label>Gap:</label>
                  <input
                    type="text"
                    value={cssOptions.flexbox.gap}
                    onChange={(e) => updateCssOption('flexbox.gap', e.target.value)}
                    placeholder="1rem"
                  />
                </div>
              </div>
            </div>
          )}

          {cssOptions.type === 'grid' && (
            <div className="utils-section grid-controls">
              <label className="section-label">CSS Grid Settings</label>

              <div className="grid-inputs">
                <div className="grid-input-group">
                  <label>Grid Template Columns:</label>
                  <input
                    type="text"
                    value={cssOptions.grid.columns}
                    onChange={(e) => updateCssOption('grid.columns', e.target.value)}
                    placeholder="repeat(3, 1fr)"
                  />
                </div>

                <div className="grid-input-group">
                  <label>Grid Template Rows:</label>
                  <input
                    type="text"
                    value={cssOptions.grid.rows}
                    onChange={(e) => updateCssOption('grid.rows', e.target.value)}
                    placeholder="auto"
                  />
                </div>

                <div className="grid-input-group">
                  <label>Gap:</label>
                  <input
                    type="text"
                    value={cssOptions.grid.gap}
                    onChange={(e) => updateCssOption('grid.gap', e.target.value)}
                    placeholder="1rem"
                  />
                </div>

                <div className="grid-input-group">
                  <label>Justify Items:</label>
                  <select
                    value={cssOptions.grid.justify}
                    onChange={(e) => updateCssOption('grid.justify', e.target.value)}
                  >
                    <option value="stretch">stretch</option>
                    <option value="start">start</option>
                    <option value="end">end</option>
                    <option value="center">center</option>
                  </select>
                </div>

                <div className="grid-input-group">
                  <label>Align Items:</label>
                  <select
                    value={cssOptions.grid.align}
                    onChange={(e) => updateCssOption('grid.align', e.target.value)}
                  >
                    <option value="stretch">stretch</option>
                    <option value="start">start</option>
                    <option value="end">end</option>
                    <option value="center">center</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          </div>

          <div className="css-output-panel">
            <label className="section-label">Generated CSS</label>
            <textarea
              value={generatedCSS}
              readOnly
              className="css-code"
              rows={cssOptions.type === 'animation' ? 8 : 4}
            />
            <div className="css-actions">
              <button
                className="copy-button"
                onClick={() => copyToClipboard(generatedCSS, 'CSS code')}
              >
                📋 Copy CSS
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'meta' && (
        <>
          <div className="utils-section meta-controls">
            <label className="section-label">Meta Tag Management</label>
            <div className="meta-actions">
              <button className="add-meta-button" onClick={addMetaTag}>
                ➕ Add Meta Tag
              </button>
              <button className="load-common-button" onClick={loadCommonMetaTags}>
                📄 Load Common Tags
              </button>
            </div>
          </div>

          <div className="utils-section meta-tags">
            {metaTags.length === 0 ? (
              <div className="empty-state">
                <p>No meta tags added yet. Click "Add Meta Tag" or "Load Common Tags" to get started.</p>
              </div>
            ) : (
              <div className="meta-list">
                {metaTags.map((tag) => (
                  <div key={tag.id} className="meta-item">
                    <div className="meta-header">
                      <select
                        value={tag.type}
                        onChange={(e) => updateMetaTag(tag.id, 'type', e.target.value)}
                        className="meta-type"
                      >
                        <option value="basic">Basic</option>
                        <option value="og">Open Graph</option>
                        <option value="twitter">Twitter</option>
                        <option value="custom">Custom</option>
                      </select>
                      <button
                        className="remove-meta-button"
                        onClick={() => removeMetaTag(tag.id)}
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="meta-fields">
                      <div className="meta-field">
                        <label>{tag.type === 'og' || tag.type === 'twitter' ? 'Property:' : 'Name:'}</label>
                        <input
                          type="text"
                          value={tag.name}
                          onChange={(e) => updateMetaTag(tag.id, 'name', e.target.value)}
                          placeholder={tag.type === 'og' ? 'og:title' : tag.type === 'twitter' ? 'twitter:card' : 'description'}
                        />
                      </div>

                      <div className="meta-field">
                        <label>Content:</label>
                        <input
                          type="text"
                          value={tag.content}
                          onChange={(e) => updateMetaTag(tag.id, 'content', e.target.value)}
                          placeholder="Meta tag content"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {metaTags.length > 0 && (
            <div className="utils-section meta-output">
              <label className="section-label">Generated HTML</label>
              <textarea
                value={generatedMetaHTML}
                readOnly
                className="meta-code"
                rows={Math.min(metaTags.length + 2, 15)}
              />
              <div className="meta-actions">
                <button
                  className="copy-button"
                  onClick={() => copyToClipboard(generatedMetaHTML, 'Meta tags HTML')}
                >
                  📋 Copy HTML
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'entities' && (
        <>
          <div className="utils-section entity-controls">
            <label className="section-label">HTML Entity Processing</label>
            <div className="entity-mode-buttons">
              <button
                className={`entity-mode-button ${entityMode === 'encode' ? 'active' : ''}`}
                onClick={() => setEntityMode('encode')}
              >
                🔒 Encode
              </button>
              <button
                className={`entity-mode-button ${entityMode === 'decode' ? 'active' : ''}`}
                onClick={() => setEntityMode('decode')}
              >
                🔓 Decode
              </button>
            </div>
          </div>

          <div className="utils-section entity-processor">
            <div className="entity-inputs">
              <div className="entity-input-group">
                <label className="section-label">Input Text</label>
                <textarea
                  value={entityInput}
                  onChange={(e) => setEntityInput(e.target.value)}
                  placeholder={entityMode === 'encode' ? 'Enter text with special characters...' : 'Enter text with HTML entities...'}
                  className="entity-input"
                  rows={6}
                />
              </div>

              <div className="entity-input-group">
                <label className="section-label">Processed Text</label>
                <textarea
                  value={entityOutput}
                  readOnly
                  placeholder="Processed text will appear here..."
                  className="entity-output"
                  rows={6}
                />
                <div className="entity-actions">
                  <button
                    className="copy-button"
                    onClick={() => copyToClipboard(entityOutput, 'Processed text')}
                    disabled={!entityOutput}
                  >
                    📋 Copy Result
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="utils-section entity-reference">
            <label className="section-label">Common HTML Entities</label>
            <div className="entity-grid">
              {commonEntities.map((entity, index) => (
                <div key={index} className="entity-item">
                  <div className="entity-char">{entity.character}</div>
                  <div className="entity-details">
                    <div className="entity-name">{entity.entity}</div>
                    <div className="entity-code">{entity.code}</div>
                    <div className="entity-desc">{entity.description}</div>
                  </div>
                  <button
                    className="copy-entity-button"
                    onClick={() => copyToClipboard(entity.entity, `${entity.description} entity`)}
                  >
                    📋
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {mode === 'favicon' && (
        <div className="utils-section favicon-placeholder">
          <label className="section-label">Favicon Generator</label>
          <div className="placeholder-content">
            <p>🚧 Favicon generator coming soon!</p>
            <p>This feature will include:</p>
            <ul>
              <li>Upload image and generate multiple favicon sizes</li>
              <li>Generate HTML meta tags for all devices</li>
              <li>Support for modern formats (SVG, WebP)</li>
              <li>Apple Touch Icon generation</li>
              <li>Manifest.json integration</li>
            </ul>
          </div>
        </div>
      )}

      <div className="utils-section tips-section">
        <label className="section-label">Tips & Information</label>
        <div className="tips-content">
          {mode === 'css' && (
            <div className="tip-text">
              <p><strong>CSS Generator:</strong> Create modern CSS with visual controls for gradients, shadows, animations, flexbox, and grid layouts.</p>
              <p><strong>Gradients:</strong> Use multiple color stops for complex gradients. Adjust positions for smooth transitions.</p>
              <p><strong>Shadows:</strong> Combine multiple shadows by copying and separating with commas in your CSS.</p>
            </div>
          )}
          {mode === 'meta' && (
            <div className="tip-text">
              <p><strong>Meta Tags:</strong> Essential for SEO, social media sharing, and browser behavior.</p>
              <p><strong>Open Graph:</strong> Used by Facebook, LinkedIn, and other social platforms for rich previews.</p>
              <p><strong>Twitter Cards:</strong> Enhance how your content appears when shared on Twitter.</p>
            </div>
          )}
          {mode === 'entities' && (
            <div className="tip-text">
              <p><strong>HTML Entities:</strong> Use entities to display special characters safely in HTML.</p>
              <p><strong>Encoding:</strong> Convert special characters to entities to prevent HTML parsing issues.</p>
              <p><strong>Decoding:</strong> Convert entities back to readable characters for editing or display.</p>
            </div>
          )}
          {mode === 'favicon' && (
            <div className="tip-text">
              <p><strong>Favicon:</strong> Small icons that appear in browser tabs, bookmarks, and mobile home screens.</p>
              <p><strong>Multiple Sizes:</strong> Modern websites need favicons in various sizes for different devices.</p>
              <p><strong>Formats:</strong> SVG favicons are scalable and work well for simple designs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WebDevUtils
