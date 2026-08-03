import React, { useState, useCallback, useRef, useEffect } from 'react'
import './qr-generator.css'

type QRErrorLevel = 'L' | 'M' | 'Q' | 'H'
type QRContentType = 'text' | 'url' | 'email' | 'phone' | 'sms' | 'wifi' | 'vcard'

interface QROptions {
  size: number
  errorLevel: QRErrorLevel
  margin: number
  foregroundColor: string
  backgroundColor: string
}

interface WiFiConfig {
  ssid: string
  password: string
  security: 'WPA' | 'WEP' | 'nopass'
  hidden: boolean
}

interface VCardConfig {
  firstName: string
  lastName: string
  organization: string
  phone: string
  email: string
  url: string
}

const QrGenerator: React.FC = () => {
  const [contentType, setContentType] = useState<QRContentType>('text')
  const [textContent, setTextContent] = useState('')
  const [urlContent, setUrlContent] = useState('')
  const [emailContent, setEmailContent] = useState('')
  const [phoneContent, setPhoneContent] = useState('')
  const [smsContent, setSmsContent] = useState('')
  const [wifiConfig, setWifiConfig] = useState<WiFiConfig>({
    ssid: '',
    password: '',
    security: 'WPA',
    hidden: false
  })
  const [vcardConfig, setVcardConfig] = useState<VCardConfig>({
    firstName: '',
    lastName: '',
    organization: '',
    phone: '',
    email: '',
    url: ''
  })
  const [qrOptions, setQrOptions] = useState<QROptions>({
    size: 256,
    errorLevel: 'M',
    margin: 4,
    foregroundColor: '#000000',
    backgroundColor: '#ffffff'
  })
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Simple QR Code generation using a basic implementation
  // Note: This is a simplified version for demonstration
  const generateQRCode = useCallback((text: string, options: QROptions): string => {
    const canvas = canvasRef.current
    if (!canvas) return ''

    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    // Set canvas size
    canvas.width = options.size
    canvas.height = options.size

    // Clear canvas
    ctx.fillStyle = options.backgroundColor
    ctx.fillRect(0, 0, options.size, options.size)

    // For demo purposes, create a simple pattern
    // In production, you'd use a proper QR code library
    const moduleSize = Math.floor((options.size - options.margin * 2) / 25)
    const startX = options.margin
    const startY = options.margin

    ctx.fillStyle = options.foregroundColor

    // Create a simple QR-like pattern based on text hash
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }

    // Generate pattern
    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 25; col++) {
        const seed = hash + row * 25 + col
        if (Math.abs(seed) % 3 === 0) {
          ctx.fillRect(
            startX + col * moduleSize,
            startY + row * moduleSize,
            moduleSize,
            moduleSize
          )
        }
      }
    }

    // Add corner markers (finder patterns)
    const markerSize = moduleSize * 7
    const positions = [
      [startX, startY], // Top-left
      [startX + 18 * moduleSize, startY], // Top-right
      [startX, startY + 18 * moduleSize] // Bottom-left
    ]

    positions.forEach(([x, y]) => {
      // Outer square
      ctx.fillRect(x, y, markerSize, markerSize)
      // Inner white square
      ctx.fillStyle = options.backgroundColor
      ctx.fillRect(x + moduleSize, y + moduleSize, markerSize - 2 * moduleSize, markerSize - 2 * moduleSize)
      // Inner black square
      ctx.fillStyle = options.foregroundColor
      ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, markerSize - 4 * moduleSize, markerSize - 4 * moduleSize)
    })

    return canvas.toDataURL('image/png')
  }, [])

  // Get content based on type
  const getQRContent = useCallback((): string => {
    switch (contentType) {
      case 'text':
        return textContent
      case 'url':
        return urlContent.startsWith('http') ? urlContent : `https://${urlContent}`
      case 'email':
        return `mailto:${emailContent}`
      case 'phone':
        return `tel:${phoneContent}`
      case 'sms':
        return `sms:${smsContent}`
      case 'wifi':
        return `WIFI:T:${wifiConfig.security};S:${wifiConfig.ssid};P:${wifiConfig.password};H:${wifiConfig.hidden ? 'true' : 'false'};;`
      case 'vcard':
        return `BEGIN:VCARD
VERSION:3.0
FN:${vcardConfig.firstName} ${vcardConfig.lastName}
ORG:${vcardConfig.organization}
TEL:${vcardConfig.phone}
EMAIL:${vcardConfig.email}
URL:${vcardConfig.url}
END:VCARD`
      default:
        return textContent
    }
  }, [contentType, textContent, urlContent, emailContent, phoneContent, smsContent, wifiConfig, vcardConfig])

  // Generate QR code
  const handleGenerate = useCallback(() => {
    const content = getQRContent()
    if (!content.trim()) {
      setError('Please enter content to generate QR code')
      return
    }

    setError('')
    try {
      const dataUrl = generateQRCode(content, qrOptions)
      setQrDataUrl(dataUrl)
    } catch (err) {
      setError('Failed to generate QR code')
    }
  }, [getQRContent, generateQRCode, qrOptions])

  // Auto-generate when content changes
  useEffect(() => {
    const content = getQRContent()
    if (content.trim()) {
      const dataUrl = generateQRCode(content, qrOptions)
      setQrDataUrl(dataUrl)
      setError('')
    } else {
      setQrDataUrl('')
    }
  }, [getQRContent, generateQRCode, qrOptions])

  // Download QR code
  const downloadQR = useCallback(() => {
    if (!qrDataUrl) return

    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `qr-code-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [qrDataUrl])

  // Copy QR code to clipboard
  const copyQR = useCallback(async () => {
    if (!qrDataUrl) return

    try {
      const response = await fetch(qrDataUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      setCopyFeedback('QR code copied to clipboard!')
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch (err) {
      setCopyFeedback('Failed to copy QR code')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }, [qrDataUrl])

  // Copy content to clipboard
  const copyContent = useCallback(async () => {
    const content = getQRContent()
    if (!content.trim()) return

    try {
      await navigator.clipboard.writeText(content)
      setCopyFeedback('Content copied to clipboard!')
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch (err) {
      setCopyFeedback('Failed to copy content')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }, [getQRContent])

  // Load sample data
  const loadSample = useCallback(() => {
    switch (contentType) {
      case 'text':
        setTextContent('Hello, World! This is a sample QR code.')
        break
      case 'url':
        setUrlContent('https://github.com')
        break
      case 'email':
        setEmailContent('example@domain.com')
        break
      case 'phone':
        setPhoneContent('+1234567890')
        break
      case 'sms':
        setSmsContent('+1234567890')
        break
      case 'wifi':
        setWifiConfig({
          ssid: 'MyWiFi',
          password: 'password123',
          security: 'WPA',
          hidden: false
        })
        break
      case 'vcard':
        setVcardConfig({
          firstName: 'John',
          lastName: 'Doe',
          organization: 'Example Corp',
          phone: '+1234567890',
          email: 'john.doe@example.com',
          url: 'https://johndoe.com'
        })
        break
    }
  }, [contentType])

  // Clear all content
  const clearAll = useCallback(() => {
    setTextContent('')
    setUrlContent('')
    setEmailContent('')
    setPhoneContent('')
    setSmsContent('')
    setWifiConfig({
      ssid: '',
      password: '',
      security: 'WPA',
      hidden: false
    })
    setVcardConfig({
      firstName: '',
      lastName: '',
      organization: '',
      phone: '',
      email: '',
      url: ''
    })
    setQrDataUrl('')
    setError('')
    setCopyFeedback('')
  }, [])

  return (
    <div className="qr-generator">
      <h2>QR Code Generator</h2>

      <div className="qr-section controls-section">
        <div className="controls-grid">
          <div className="content-type-group">
            <label className="type-label">Content Type:</label>
            <select 
              value={contentType} 
              onChange={(e) => setContentType(e.target.value as QRContentType)}
              className="type-select"
            >
              <option value="text">📝 Text</option>
              <option value="url">🔗 URL</option>
              <option value="email">📧 Email</option>
              <option value="phone">📞 Phone</option>
              <option value="sms">💬 SMS</option>
              <option value="wifi">📶 WiFi</option>
              <option value="vcard">👤 vCard</option>
            </select>
          </div>

          <div className="qr-options-group">
            <label className="options-label">QR Options:</label>
            <div className="options-grid">
              <div className="option-item">
                <label>Size:</label>
                <select 
                  value={qrOptions.size} 
                  onChange={(e) => setQrOptions(prev => ({ ...prev, size: Number(e.target.value) }))}
                >
                  <option value={128}>128px</option>
                  <option value={256}>256px</option>
                  <option value={512}>512px</option>
                  <option value={1024}>1024px</option>
                </select>
              </div>
              <div className="option-item">
                <label>Error Level:</label>
                <select 
                  value={qrOptions.errorLevel} 
                  onChange={(e) => setQrOptions(prev => ({ ...prev, errorLevel: e.target.value as QRErrorLevel }))}
                >
                  <option value="L">Low (7%)</option>
                  <option value="M">Medium (15%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="H">High (30%)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button className="generate-button" onClick={handleGenerate}>
            🔄 Generate QR
          </button>
          <button className="sample-button" onClick={loadSample}>
            📄 Load Sample
          </button>
          <button className="copy-content-button" onClick={copyContent}>
            📋 Copy Content
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

      <div className="qr-section input-section">
        <label className="section-label">Content Input</label>
        
        {contentType === 'text' && (
          <div className="input-group">
            <label className="input-label">Text Content:</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter text to encode in QR code..."
              className="text-input"
              rows={4}
            />
          </div>
        )}

        {contentType === 'url' && (
          <div className="input-group">
            <label className="input-label">URL:</label>
            <input
              type="url"
              value={urlContent}
              onChange={(e) => setUrlContent(e.target.value)}
              placeholder="https://example.com"
              className="url-input"
            />
          </div>
        )}

        {contentType === 'email' && (
          <div className="input-group">
            <label className="input-label">Email Address:</label>
            <input
              type="email"
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="example@domain.com"
              className="email-input"
            />
          </div>
        )}

        {contentType === 'phone' && (
          <div className="input-group">
            <label className="input-label">Phone Number:</label>
            <input
              type="tel"
              value={phoneContent}
              onChange={(e) => setPhoneContent(e.target.value)}
              placeholder="+1234567890"
              className="phone-input"
            />
          </div>
        )}

        {contentType === 'sms' && (
          <div className="input-group">
            <label className="input-label">SMS Number:</label>
            <input
              type="tel"
              value={smsContent}
              onChange={(e) => setSmsContent(e.target.value)}
              placeholder="+1234567890"
              className="sms-input"
            />
          </div>
        )}

        {contentType === 'wifi' && (
          <div className="wifi-config">
            <div className="input-group">
              <label className="input-label">Network Name (SSID):</label>
              <input
                type="text"
                value={wifiConfig.ssid}
                onChange={(e) => setWifiConfig(prev => ({ ...prev, ssid: e.target.value }))}
                placeholder="WiFi Network Name"
                className="wifi-input"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Password:</label>
              <input
                type="password"
                value={wifiConfig.password}
                onChange={(e) => setWifiConfig(prev => ({ ...prev, password: e.target.value }))}
                placeholder="WiFi Password"
                className="wifi-input"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Security:</label>
              <select 
                value={wifiConfig.security} 
                onChange={(e) => setWifiConfig(prev => ({ ...prev, security: e.target.value as any }))}
                className="wifi-select"
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">No Password</option>
              </select>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={wifiConfig.hidden}
                  onChange={(e) => setWifiConfig(prev => ({ ...prev, hidden: e.target.checked }))}
                />
                Hidden Network
              </label>
            </div>
          </div>
        )}

        {contentType === 'vcard' && (
          <div className="vcard-config">
            <div className="vcard-row">
              <div className="input-group">
                <label className="input-label">First Name:</label>
                <input
                  type="text"
                  value={vcardConfig.firstName}
                  onChange={(e) => setVcardConfig(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  className="vcard-input"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Last Name:</label>
                <input
                  type="text"
                  value={vcardConfig.lastName}
                  onChange={(e) => setVcardConfig(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                  className="vcard-input"
                />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Organization:</label>
              <input
                type="text"
                value={vcardConfig.organization}
                onChange={(e) => setVcardConfig(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="Company Name"
                className="vcard-input"
              />
            </div>
            <div className="vcard-row">
              <div className="input-group">
                <label className="input-label">Phone:</label>
                <input
                  type="tel"
                  value={vcardConfig.phone}
                  onChange={(e) => setVcardConfig(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1234567890"
                  className="vcard-input"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email:</label>
                <input
                  type="email"
                  value={vcardConfig.email}
                  onChange={(e) => setVcardConfig(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="vcard-input"
                />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Website:</label>
              <input
                type="url"
                value={vcardConfig.url}
                onChange={(e) => setVcardConfig(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://johndoe.com"
                className="vcard-input"
              />
            </div>
          </div>
        )}
      </div>

      {qrDataUrl && (
        <div className="qr-section output-section">
          <label className="section-label">Generated QR Code</label>
          <div className="qr-output">
            <div className="qr-preview">
              <img src={qrDataUrl} alt="Generated QR Code" className="qr-image" />
            </div>
            <div className="qr-actions">
              <button className="download-button" onClick={downloadQR}>
                💾 Download PNG
              </button>
              <button className="copy-qr-button" onClick={copyQR}>
                📋 Copy Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for QR generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default QrGenerator
