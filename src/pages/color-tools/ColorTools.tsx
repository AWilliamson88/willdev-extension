import React, { useState, useCallback, useEffect } from 'react'
import './color-tools.css'

type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk'

interface ColorValues {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  hsv: { h: number; s: number; v: number }
  cmyk: { c: number; m: number; y: number; k: number }
}

interface PaletteColor {
  hex: string
  name?: string
}

const ColorTools: React.FC = () => {
  const [currentColor, setCurrentColor] = useState<ColorValues>({
    hex: '#3498db',
    rgb: { r: 52, g: 152, b: 219 },
    hsl: { h: 204, s: 70, l: 53 },
    hsv: { h: 204, s: 76, v: 86 },
    cmyk: { c: 76, m: 31, y: 0, k: 14 }
  })
  const [inputFormat, setInputFormat] = useState<ColorFormat>('hex')
  const [inputValue, setInputValue] = useState('#3498db')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [error, setError] = useState('')
  const [palette, setPalette] = useState<PaletteColor[]>([])
  const [paletteType, setPaletteType] = useState<'complementary' | 'triadic' | 'analogous' | 'monochromatic'>('complementary')

  // Color conversion functions
  const hexToRgb = useCallback((hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }, [])

  const rgbToHex = useCallback((r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  }, [])

  const rgbToHsl = useCallback((r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255
    g /= 255
    b /= 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2

    if (max === min) {
      h = s = 0 // achromatic
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }, [])

  const hslToRgb = useCallback((h: number, s: number, l: number): { r: number; g: number; b: number } => {
    h /= 360
    s /= 100
    l /= 100

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    let r, g, b

    if (s === 0) {
      r = g = b = l // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    }
  }, [])

  const rgbToHsv = useCallback((r: number, g: number, b: number): { h: number; s: number; v: number } => {
    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, v = max

    const d = max - min
    s = max === 0 ? 0 : d / max

    if (max === min) {
      h = 0 // achromatic
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(v * 100)
    }
  }, [])

  const rgbToCmyk = useCallback((r: number, g: number, b: number): { c: number; m: number; y: number; k: number } => {
    r /= 255
    g /= 255
    b /= 255

    const k = 1 - Math.max(r, Math.max(g, b))
    const c = k === 1 ? 0 : (1 - r - k) / (1 - k)
    const m = k === 1 ? 0 : (1 - g - k) / (1 - k)
    const y = k === 1 ? 0 : (1 - b - k) / (1 - k)

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    }
  }, [])

  // Convert any color format to all formats
  const convertColor = useCallback((value: string, format: ColorFormat): ColorValues | null => {
    try {
      let rgb: { r: number; g: number; b: number } | null = null

      switch (format) {
        case 'hex':
          rgb = hexToRgb(value)
          break
        case 'rgb':
          const rgbMatch = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
          if (rgbMatch) {
            rgb = {
              r: parseInt(rgbMatch[1]),
              g: parseInt(rgbMatch[2]),
              b: parseInt(rgbMatch[3])
            }
          }
          break
        case 'hsl':
          const hslMatch = value.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
          if (hslMatch) {
            const hsl = {
              h: parseInt(hslMatch[1]),
              s: parseInt(hslMatch[2]),
              l: parseInt(hslMatch[3])
            }
            rgb = hslToRgb(hsl.h, hsl.s, hsl.l)
          }
          break
        default:
          return null
      }

      if (!rgb) return null

      const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
      const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)

      return { hex, rgb, hsl, hsv, cmyk }
    } catch (error) {
      return null
    }
  }, [hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToHsv, rgbToCmyk])

  // Generate color palette
  const generatePalette = useCallback((baseColor: ColorValues, type: string): PaletteColor[] => {
    const { h, s, l } = baseColor.hsl
    const colors: PaletteColor[] = []

    switch (type) {
      case 'complementary':
        colors.push({ hex: baseColor.hex, name: 'Base' })
        const compH = (h + 180) % 360
        const compRgb = hslToRgb(compH, s, l)
        colors.push({ hex: rgbToHex(compRgb.r, compRgb.g, compRgb.b), name: 'Complementary' })
        break

      case 'triadic':
        colors.push({ hex: baseColor.hex, name: 'Base' })
        for (let i = 1; i < 3; i++) {
          const triadH = (h + i * 120) % 360
          const triadRgb = hslToRgb(triadH, s, l)
          colors.push({ hex: rgbToHex(triadRgb.r, triadRgb.g, triadRgb.b), name: `Triadic ${i}` })
        }
        break

      case 'analogous':
        for (let i = -2; i <= 2; i++) {
          const analogH = (h + i * 30 + 360) % 360
          const analogRgb = hslToRgb(analogH, s, l)
          colors.push({ 
            hex: rgbToHex(analogRgb.r, analogRgb.g, analogRgb.b), 
            name: i === 0 ? 'Base' : `Analogous ${i > 0 ? '+' : ''}${i * 30}°`
          })
        }
        break

      case 'monochromatic':
        for (let i = 0; i < 5; i++) {
          const monoL = Math.max(10, Math.min(90, l + (i - 2) * 20))
          const monoRgb = hslToRgb(h, s, monoL)
          colors.push({ 
            hex: rgbToHex(monoRgb.r, monoRgb.g, monoRgb.b), 
            name: i === 2 ? 'Base' : `${monoL}% Lightness`
          })
        }
        break
    }

    return colors
  }, [hslToRgb, rgbToHex])

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
    setError('')

    const converted = convertColor(value, inputFormat)
    if (converted) {
      setCurrentColor(converted)
    } else {
      setError(`Invalid ${inputFormat.toUpperCase()} color format`)
    }
  }, [inputFormat, convertColor])

  // Handle color picker change
  const handleColorPickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    const converted = convertColor(hex, 'hex')
    if (converted) {
      setCurrentColor(converted)
      setInputValue(hex)
      setError('')
    }
  }, [convertColor])

  // Generate palette when color or type changes
  useEffect(() => {
    const newPalette = generatePalette(currentColor, paletteType)
    setPalette(newPalette)
  }, [currentColor, paletteType, generatePalette])

  // Handle copy feedback timeout with cleanup
  useEffect(() => {
    if (copyFeedback) {
      const timeoutId = setTimeout(() => setCopyFeedback(''), 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [copyFeedback])

  // Copy color value to clipboard
  const copyColor = useCallback(async (value: string, format: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyFeedback(`${format} color copied to clipboard!`)
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard')
    }
  }, [])

  // Copy palette colors
  const copyPalette = useCallback(async () => {
    const paletteText = palette.map(color => `${color.name}: ${color.hex}`).join('\n')
    try {
      await navigator.clipboard.writeText(paletteText)
      setCopyFeedback('Palette copied to clipboard!')
    } catch (err) {
      setCopyFeedback('Failed to copy palette')
    }
  }, [palette])

  // Load random color
  const loadRandomColor = useCallback(() => {
    const randomHex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    const converted = convertColor(randomHex, 'hex')
    if (converted) {
      setCurrentColor(converted)
      setInputValue(randomHex)
      setInputFormat('hex')
      setError('')
    }
  }, [convertColor])

  // Format color values for display
  const formatColorValue = useCallback((color: ColorValues, format: ColorFormat): string => {
    switch (format) {
      case 'hex':
        return color.hex.toUpperCase()
      case 'rgb':
        return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
      case 'hsl':
        return `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`
      case 'hsv':
        return `hsv(${color.hsv.h}, ${color.hsv.s}%, ${color.hsv.v}%)`
      case 'cmyk':
        return `cmyk(${color.cmyk.c}%, ${color.cmyk.m}%, ${color.cmyk.y}%, ${color.cmyk.k}%)`
      default:
        return ''
    }
  }, [])

  return (
    <div className="color-tools">
      <h2>Color Tools</h2>

      <div className="color-section controls-section">
        <div className="controls-grid">
          <div className="color-picker-group">
            <label className="picker-label">Color Picker:</label>
            <div className="picker-container">
              <input
                type="color"
                value={currentColor.hex}
                onChange={handleColorPickerChange}
                className="color-picker"
              />
              <div 
                className="color-preview"
                style={{ backgroundColor: currentColor.hex }}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Input Format:</label>
            <select 
              value={inputFormat} 
              onChange={(e) => setInputFormat(e.target.value as ColorFormat)}
              className="format-select"
            >
              <option value="hex">HEX</option>
              <option value="rgb">RGB</option>
              <option value="hsl">HSL</option>
            </select>
          </div>

          <div className="color-input-group">
            <label className="input-label">Color Value:</label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={`Enter ${inputFormat.toUpperCase()} color...`}
              className="color-input"
            />
          </div>
        </div>

        <div className="action-buttons">
          <button className="random-button" onClick={loadRandomColor}>
            🎲 Random Color
          </button>
          <button className="copy-button" onClick={copyPalette} disabled={palette.length === 0}>
            📋 Copy Palette
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

      <div className="color-section conversion-section">
        <label className="section-label">Color Conversions</label>
        <div className="conversions-grid">
          {(['hex', 'rgb', 'hsl', 'hsv', 'cmyk'] as ColorFormat[]).map(format => (
            <div key={format} className="conversion-item">
              <div className="conversion-header">
                <span className="conversion-label">{format.toUpperCase()}</span>
                <button 
                  className="copy-conversion-button"
                  onClick={() => copyColor(formatColorValue(currentColor, format), format.toUpperCase())}
                >
                  📋
                </button>
              </div>
              <div className="conversion-value">
                {formatColorValue(currentColor, format)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="color-section palette-section">
        <div className="palette-header">
          <label className="section-label">Color Palette</label>
          <select 
            value={paletteType} 
            onChange={(e) => setPaletteType(e.target.value as any)}
            className="palette-select"
          >
            <option value="complementary">Complementary</option>
            <option value="triadic">Triadic</option>
            <option value="analogous">Analogous</option>
            <option value="monochromatic">Monochromatic</option>
          </select>
        </div>
        
        <div className="palette-grid">
          {palette.map((color, index) => (
            <div key={index} className="palette-color">
              <div 
                className="palette-swatch"
                style={{ backgroundColor: color.hex }}
                onClick={() => copyColor(color.hex, 'HEX')}
                title={`Click to copy ${color.hex}`}
              />
              <div className="palette-info">
                <div className="palette-name">{color.name}</div>
                <div className="palette-hex">{color.hex.toUpperCase()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ColorTools
