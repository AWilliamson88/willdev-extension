import React, { useState } from 'react'
import './jwt-decoder.css'

const JwtDecoder: React.FC = () => {
  const [jwt, setJwt] = useState('')
  const [decoded, setDecoded] = useState<any>(null)

  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      setDecoded(JSON.parse(jsonPayload))
    } catch (e) {
      setDecoded({ error: 'Invalid JWT' })
    }
  }

  return (
    <div className="jwt-decoder">
      <h2>JWT Decoder</h2>

      <div className="jwt-section jwt-input-section">
        <label className="jwt-input-label">JWT Token</label>
        <textarea
          value={jwt}
          onChange={(e) => {
            setJwt(e.target.value)
            decodeJwt(e.target.value)
          }}
          placeholder="Paste your JWT token here (e.g., eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
        />
      </div>

      <div className="jwt-section jwt-output-section">
        <label className="jwt-output-label">Decoded Payload</label>
        <pre className={decoded?.error ? 'error' : ''}>
          {decoded ? JSON.stringify(decoded, null, 2) : ''}
        </pre>
      </div>
    </div>
  )
}

export default JwtDecoder