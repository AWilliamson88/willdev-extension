import React, { useState } from 'react'
import './jwt-decoder.css'

interface DecodedJWT {
  header?: Record<string, unknown>
  payload?: Record<string, unknown>
  error?: string
}

const JwtDecoder: React.FC = () => {
  const [jwt, setJwt] = useState('')
  const [decoded, setDecoded] = useState<DecodedJWT | null>(null)

  const decodeJwt = (token: string) => {
    // Clear output if input is empty
    if (!token.trim()) {
      setDecoded(null)
      return
    }

    try {
      // Validate JWT format (must have 3 parts separated by dots)
      const parts = token.trim().split('.')
      if (parts.length !== 3) {
        setDecoded({ error: 'Invalid JWT format. JWT must have 3 parts (header.payload.signature)' })
        return
      }

      const [headerPart, payloadPart] = parts

      // Validate parts are not empty
      if (!headerPart || !payloadPart) {
        setDecoded({ error: 'Invalid JWT. Header or payload is empty' })
        return
      }

      // Decode header
      const decodedHeader = decodeBase64Url(headerPart)
      const header = JSON.parse(decodedHeader)

      // Decode payload
      const decodedPayload = decodeBase64Url(payloadPart)
      const payload = JSON.parse(decodedPayload)

      setDecoded({ header, payload })
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Invalid JWT'
      setDecoded({ error: `Failed to decode JWT: ${errorMessage}` })
    }
  }

  // Decode base64url encoded string
  const decodeBase64Url = (base64Url: string): string => {
    // Replace base64url characters with base64 characters
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')

    // Decode base64 and handle Unicode properly
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    return jsonPayload
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

      {decoded?.error ? (
        <div className="jwt-section jwt-output-section">
          <label className="jwt-output-label">Error</label>
          <pre className="error">{decoded.error}</pre>
        </div>
      ) : decoded ? (
        <>
          <div className="jwt-section jwt-output-section">
            <label className="jwt-output-label">Header</label>
            <pre>{JSON.stringify(decoded.header, null, 2)}</pre>
          </div>

          <div className="jwt-section jwt-output-section">
            <label className="jwt-output-label">Payload</label>
            <pre>{JSON.stringify(decoded.payload, null, 2)}</pre>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default JwtDecoder