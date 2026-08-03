import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import './api-testing.css'

type TestingMode = 'client' | 'webhook' | 'docs'
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
type BodyType = 'none' | 'json' | 'form' | 'text' | 'xml'
type AuthType = 'none' | 'bearer' | 'basic' | 'apikey'

interface HttpHeader {
  id: string
  key: string
  value: string
  enabled: boolean
}

interface QueryParam {
  id: string
  key: string
  value: string
  enabled: boolean
}

interface FormField {
  id: string
  key: string
  value: string
  enabled: boolean
}

interface ApiRequest {
  method: HttpMethod
  url: string
  headers: HttpHeader[]
  queryParams: QueryParam[]
  bodyType: BodyType
  bodyContent: string
  formFields: FormField[]
  authType: AuthType
  authToken: string
  authUsername: string
  authPassword: string
  authApiKey: string
  authApiKeyHeader: string
}

interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  data: string
  responseTime: number
  size: number
  timestamp: Date
}

interface WebhookEvent {
  id: string
  timestamp: Date
  method: string
  url: string
  headers: Record<string, string>
  body: string
  queryParams: Record<string, string>
}

const ApiTesting: React.FC = () => {
  const [mode, setMode] = useState<TestingMode>('client')
  const [request, setRequest] = useState<ApiRequest>({
    method: 'GET',
    url: '',
    headers: [],
    queryParams: [],
    bodyType: 'none',
    bodyContent: '',
    formFields: [],
    authType: 'none',
    authToken: '',
    authUsername: '',
    authPassword: '',
    authApiKey: '',
    authApiKeyHeader: 'X-API-Key'
  })
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  const isMountedRef = useRef(true)

  // Webhook testing state
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([])
  const [webhookListening, setWebhookListening] = useState(false)

  // API documentation state
  const [apiDocUrl, setApiDocUrl] = useState('')
  const [apiDocContent, setApiDocContent] = useState('')

  const requestIdCounter = useRef(0)

  // Generate unique ID
  const generateId = useCallback(() => {
    return `id_${++requestIdCounter.current}_${Date.now()}`
  }, [])

  // HTTP Methods
  const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

  // Common headers
  const commonHeaders = [
    'Content-Type',
    'Authorization',
    'Accept',
    'User-Agent',
    'X-API-Key',
    'X-Requested-With',
    'Cache-Control',
    'Origin',
    'Referer'
  ]

  // Content types
  const contentTypes = [
    'application/json',
    'application/x-www-form-urlencoded',
    'text/plain',
    'text/html',
    'application/xml',
    'multipart/form-data'
  ]

  // Add header
  const addHeader = useCallback(() => {
    setRequest(prev => ({
      ...prev,
      headers: [...prev.headers, {
        id: generateId(),
        key: '',
        value: '',
        enabled: true
      }]
    }))
  }, [generateId])

  // Update header
  const updateHeader = useCallback((id: string, field: keyof HttpHeader, value: string | boolean) => {
    setRequest(prev => ({
      ...prev,
      headers: prev.headers.map(header =>
        header.id === id ? { ...header, [field]: value } : header
      )
    }))
  }, [])

  // Remove header
  const removeHeader = useCallback((id: string) => {
    setRequest(prev => ({
      ...prev,
      headers: prev.headers.filter(header => header.id !== id)
    }))
  }, [])

  // Add query parameter
  const addQueryParam = useCallback(() => {
    setRequest(prev => ({
      ...prev,
      queryParams: [...prev.queryParams, {
        id: generateId(),
        key: '',
        value: '',
        enabled: true
      }]
    }))
  }, [generateId])

  // Update query parameter
  const updateQueryParam = useCallback((id: string, field: keyof QueryParam, value: string | boolean) => {
    setRequest(prev => ({
      ...prev,
      queryParams: prev.queryParams.map(param =>
        param.id === id ? { ...param, [field]: value } : param
      )
    }))
  }, [])

  // Remove query parameter
  const removeQueryParam = useCallback((id: string) => {
    setRequest(prev => ({
      ...prev,
      queryParams: prev.queryParams.filter(param => param.id !== id)
    }))
  }, [])

  // Add form field
  const addFormField = useCallback(() => {
    setRequest(prev => ({
      ...prev,
      formFields: [...prev.formFields, {
        id: generateId(),
        key: '',
        value: '',
        enabled: true
      }]
    }))
  }, [generateId])

  // Update form field
  const updateFormField = useCallback((id: string, field: keyof FormField, value: string | boolean) => {
    setRequest(prev => ({
      ...prev,
      formFields: prev.formFields.map(field =>
        field.id === id ? { ...field, [field]: value } : field
      )
    }))
  }, [])

  // Remove form field
  const removeFormField = useCallback((id: string) => {
    setRequest(prev => ({
      ...prev,
      formFields: prev.formFields.filter(field => field.id !== id)
    }))
  }, [])

  // Build request URL with query parameters
  const buildRequestUrl = useCallback((baseUrl: string, queryParams: QueryParam[]): string => {
    if (!baseUrl) return ''
    
    const enabledParams = queryParams.filter(param => param.enabled && param.key && param.value)
    if (enabledParams.length === 0) return baseUrl
    
    const url = new URL(baseUrl)
    enabledParams.forEach(param => {
      url.searchParams.append(param.key, param.value)
    })
    
    return url.toString()
  }, [])

  // Build request headers
  const buildRequestHeaders = useCallback((headers: HttpHeader[], authType: AuthType, authData: Partial<ApiRequest>): Record<string, string> => {
    const requestHeaders: Record<string, string> = {}
    
    // Add custom headers
    headers
      .filter(header => header.enabled && header.key && header.value)
      .forEach(header => {
        requestHeaders[header.key] = header.value
      })
    
    // Add authentication headers
    switch (authType) {
      case 'bearer':
        if (authData.authToken) {
          requestHeaders['Authorization'] = `Bearer ${authData.authToken}`
        }
        break
      case 'basic':
        if (authData.authUsername && authData.authPassword) {
          const credentials = btoa(`${authData.authUsername}:${authData.authPassword}`)
          requestHeaders['Authorization'] = `Basic ${credentials}`
        }
        break
      case 'apikey':
        if (authData.authApiKey && authData.authApiKeyHeader) {
          requestHeaders[authData.authApiKeyHeader] = authData.authApiKey
        }
        break
    }
    
    return requestHeaders
  }, [])

  // Build request body
  const buildRequestBody = useCallback((bodyType: BodyType, bodyContent: string, formFields: FormField[]): string | FormData | null => {
    switch (bodyType) {
      case 'none':
        return null
      case 'json':
        return bodyContent
      case 'text':
      case 'xml':
        return bodyContent
      case 'form':
        const formData = new FormData()
        formFields
          .filter(field => field.enabled && field.key)
          .forEach(field => {
            formData.append(field.key, field.value)
          })
        return formData
      default:
        return null
    }
  }, [])

  // Send HTTP request
  const sendRequest = useCallback(async () => {
    if (!request.url.trim()) {
      setError('Please enter a valid URL')
      return
    }

    setLoading(true)
    setError('')
    setResponse(null)

    try {
      const startTime = performance.now()
      
      // Build request components
      const url = buildRequestUrl(request.url, request.queryParams)
      const headers = buildRequestHeaders(request.headers, request.authType, request)
      const body = buildRequestBody(request.bodyType, request.bodyContent, request.formFields)

      // Set content type for JSON and XML
      if (request.bodyType === 'json' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
      } else if (request.bodyType === 'xml' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/xml'
      } else if (request.bodyType === 'text' && !headers['Content-Type']) {
        headers['Content-Type'] = 'text/plain'
      }

      // Make the request
      const fetchOptions: RequestInit = {
        method: request.method,
        headers,
        mode: 'cors'
      }

      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(request.method) && body !== null) {
        fetchOptions.body = body
      }

      const response = await fetch(url, fetchOptions)
      const endTime = performance.now()

      // Parse response
      const responseText = await response.text()
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const apiResponse: ApiResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseText,
        responseTime: endTime - startTime,
        size: new TextEncoder().encode(responseText).length,
        timestamp: new Date()
      }

      if (isMountedRef.current) {
        setResponse(apiResponse)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Request failed')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [request, buildRequestUrl, buildRequestHeaders, buildRequestBody])

  // Handle copy feedback timeout with cleanup
  useEffect(() => {
    if (copyFeedback) {
      const timeoutId = setTimeout(() => setCopyFeedback(''), 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [copyFeedback])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback(`${label} copied to clipboard!`)
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard')
    }
  }, [])

  // Format JSON
  const formatJson = useCallback((jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return jsonString
    }
  }, [])

  // Load sample request
  const loadSampleRequest = useCallback(() => {
    setRequest({
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      headers: [
        { id: generateId(), key: 'Accept', value: 'application/json', enabled: true }
      ],
      queryParams: [],
      bodyType: 'none',
      bodyContent: '',
      formFields: [],
      authType: 'none',
      authToken: '',
      authUsername: '',
      authPassword: '',
      authApiKey: '',
      authApiKeyHeader: 'X-API-Key'
    })
    setError('')
    setResponse(null)
  }, [generateId])

  // Clear request
  const clearRequest = useCallback(() => {
    setRequest({
      method: 'GET',
      url: '',
      headers: [],
      queryParams: [],
      bodyType: 'none',
      bodyContent: '',
      formFields: [],
      authType: 'none',
      authToken: '',
      authUsername: '',
      authPassword: '',
      authApiKey: '',
      authApiKeyHeader: 'X-API-Key'
    })
    setResponse(null)
    setError('')
  }, [])

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // Get mode description
  const getModeDescription = useCallback((currentMode: TestingMode): string => {
    const descriptions = {
      client: 'Send HTTP requests to test APIs with full control over headers, authentication, and request body',
      webhook: 'Test webhook endpoints by capturing and inspecting incoming HTTP requests',
      docs: 'Generate and view API documentation from OpenAPI/Swagger specifications'
    }
    return descriptions[currentMode]
  }, [])

  return (
    <div className="api-testing">
      <h2>API Testing Tools</h2>

      <div className="testing-section controls-section">
        <div className="mode-group">
          <label className="mode-label">Testing Mode:</label>
          <div className="mode-buttons">
            <button 
              className={`mode-button ${mode === 'client' ? 'active' : ''}`}
              onClick={() => setMode('client')}
            >
              🌐 HTTP Client
            </button>
            <button 
              className={`mode-button ${mode === 'webhook' ? 'active' : ''}`}
              onClick={() => setMode('webhook')}
            >
              🔗 Webhook Tester
            </button>
            <button 
              className={`mode-button ${mode === 'docs' ? 'active' : ''}`}
              onClick={() => setMode('docs')}
            >
              📚 API Docs
            </button>
          </div>
        </div>

        {mode === 'client' && (
          <div className="action-buttons">
            <button className="sample-button" onClick={loadSampleRequest}>
              📄 Load Sample
            </button>
            <button className="clear-button" onClick={clearRequest}>
              🗑️ Clear All
            </button>
          </div>
        )}
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

      <div className="testing-section description-section">
        <label className="section-label">About This Tool</label>
        <p className="tool-description">{getModeDescription(mode)}</p>
      </div>

      {mode === 'client' && (
        <>
          <div className="testing-section request-section">
            <label className="section-label">HTTP Request</label>

            <div className="request-line">
              <select
                value={request.method}
                onChange={(e) => setRequest(prev => ({ ...prev, method: e.target.value as HttpMethod }))}
                className="method-select"
              >
                {httpMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>

              <input
                type="text"
                value={request.url}
                onChange={(e) => setRequest(prev => ({ ...prev, url: e.target.value }))}
                placeholder="Enter request URL (e.g., https://api.example.com/users)"
                className="url-input"
              />

              <button
                className="send-button"
                onClick={sendRequest}
                disabled={loading || !request.url.trim()}
              >
                {loading ? '⏳ Sending...' : '🚀 Send'}
              </button>
            </div>
          </div>

          <div className="testing-section params-section">
            <label className="section-label">Query Parameters</label>
            <div className="params-list">
              {request.queryParams.map(param => (
                <div key={param.id} className="param-row">
                  <input
                    type="checkbox"
                    checked={param.enabled}
                    onChange={(e) => updateQueryParam(param.id, 'enabled', e.target.checked)}
                    className="param-checkbox"
                  />
                  <input
                    type="text"
                    value={param.key}
                    onChange={(e) => updateQueryParam(param.id, 'key', e.target.value)}
                    placeholder="Parameter name"
                    className="param-key"
                  />
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => updateQueryParam(param.id, 'value', e.target.value)}
                    placeholder="Parameter value"
                    className="param-value"
                  />
                  <button
                    className="remove-param-button"
                    onClick={() => removeQueryParam(param.id)}
                  >
                    ❌
                  </button>
                </div>
              ))}
              <button className="add-param-button" onClick={addQueryParam}>
                ➕ Add Parameter
              </button>
            </div>
          </div>

          <div className="testing-section headers-section">
            <label className="section-label">Headers</label>
            <div className="headers-list">
              {request.headers.map(header => (
                <div key={header.id} className="header-row">
                  <input
                    type="checkbox"
                    checked={header.enabled}
                    onChange={(e) => updateHeader(header.id, 'enabled', e.target.checked)}
                    className="header-checkbox"
                  />
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                    placeholder="Header name"
                    className="header-key"
                    list="common-headers"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                    placeholder="Header value"
                    className="header-value"
                    list={header.key === 'Content-Type' ? 'content-types' : undefined}
                  />
                  <button
                    className="remove-header-button"
                    onClick={() => removeHeader(header.id)}
                  >
                    ❌
                  </button>
                </div>
              ))}
              <button className="add-header-button" onClick={addHeader}>
                ➕ Add Header
              </button>
            </div>

            <datalist id="common-headers">
              {commonHeaders.map(header => (
                <option key={header} value={header} />
              ))}
            </datalist>

            <datalist id="content-types">
              {contentTypes.map(type => (
                <option key={type} value={type} />
              ))}
            </datalist>
          </div>

          <div className="testing-section auth-section">
            <label className="section-label">Authentication</label>
            <div className="auth-type-selector">
              <label className="auth-option">
                <input
                  type="radio"
                  name="authType"
                  value="none"
                  checked={request.authType === 'none'}
                  onChange={(e) => setRequest(prev => ({ ...prev, authType: e.target.value as AuthType }))}
                />
                None
              </label>
              <label className="auth-option">
                <input
                  type="radio"
                  name="authType"
                  value="bearer"
                  checked={request.authType === 'bearer'}
                  onChange={(e) => setRequest(prev => ({ ...prev, authType: e.target.value as AuthType }))}
                />
                Bearer Token
              </label>
              <label className="auth-option">
                <input
                  type="radio"
                  name="authType"
                  value="basic"
                  checked={request.authType === 'basic'}
                  onChange={(e) => setRequest(prev => ({ ...prev, authType: e.target.value as AuthType }))}
                />
                Basic Auth
              </label>
              <label className="auth-option">
                <input
                  type="radio"
                  name="authType"
                  value="apikey"
                  checked={request.authType === 'apikey'}
                  onChange={(e) => setRequest(prev => ({ ...prev, authType: e.target.value as AuthType }))}
                />
                API Key
              </label>
            </div>

            {request.authType === 'bearer' && (
              <div className="auth-fields">
                <input
                  type="text"
                  value={request.authToken}
                  onChange={(e) => setRequest(prev => ({ ...prev, authToken: e.target.value }))}
                  placeholder="Enter bearer token"
                  className="auth-input"
                />
              </div>
            )}

            {request.authType === 'basic' && (
              <div className="auth-fields">
                <input
                  type="text"
                  value={request.authUsername}
                  onChange={(e) => setRequest(prev => ({ ...prev, authUsername: e.target.value }))}
                  placeholder="Username"
                  className="auth-input"
                />
                <input
                  type="password"
                  value={request.authPassword}
                  onChange={(e) => setRequest(prev => ({ ...prev, authPassword: e.target.value }))}
                  placeholder="Password"
                  className="auth-input"
                />
              </div>
            )}

            {request.authType === 'apikey' && (
              <div className="auth-fields">
                <input
                  type="text"
                  value={request.authApiKeyHeader}
                  onChange={(e) => setRequest(prev => ({ ...prev, authApiKeyHeader: e.target.value }))}
                  placeholder="Header name (e.g., X-API-Key)"
                  className="auth-input"
                />
                <input
                  type="text"
                  value={request.authApiKey}
                  onChange={(e) => setRequest(prev => ({ ...prev, authApiKey: e.target.value }))}
                  placeholder="API key value"
                  className="auth-input"
                />
              </div>
            )}
          </div>

          {['POST', 'PUT', 'PATCH'].includes(request.method) && (
            <div className="testing-section body-section">
              <label className="section-label">Request Body</label>

              <div className="body-type-selector">
                <label className="body-option">
                  <input
                    type="radio"
                    name="bodyType"
                    value="none"
                    checked={request.bodyType === 'none'}
                    onChange={(e) => setRequest(prev => ({ ...prev, bodyType: e.target.value as BodyType }))}
                  />
                  None
                </label>
                <label className="body-option">
                  <input
                    type="radio"
                    name="bodyType"
                    value="json"
                    checked={request.bodyType === 'json'}
                    onChange={(e) => setRequest(prev => ({ ...prev, bodyType: e.target.value as BodyType }))}
                  />
                  JSON
                </label>
                <label className="body-option">
                  <input
                    type="radio"
                    name="bodyType"
                    value="form"
                    checked={request.bodyType === 'form'}
                    onChange={(e) => setRequest(prev => ({ ...prev, bodyType: e.target.value as BodyType }))}
                  />
                  Form Data
                </label>
                <label className="body-option">
                  <input
                    type="radio"
                    name="bodyType"
                    value="text"
                    checked={request.bodyType === 'text'}
                    onChange={(e) => setRequest(prev => ({ ...prev, bodyType: e.target.value as BodyType }))}
                  />
                  Text
                </label>
                <label className="body-option">
                  <input
                    type="radio"
                    name="bodyType"
                    value="xml"
                    checked={request.bodyType === 'xml'}
                    onChange={(e) => setRequest(prev => ({ ...prev, bodyType: e.target.value as BodyType }))}
                  />
                  XML
                </label>
              </div>

              {request.bodyType === 'form' ? (
                <div className="form-fields">
                  {request.formFields.map(field => (
                    <div key={field.id} className="form-field-row">
                      <input
                        type="checkbox"
                        checked={field.enabled}
                        onChange={(e) => updateFormField(field.id, 'enabled', e.target.checked)}
                        className="field-checkbox"
                      />
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => updateFormField(field.id, 'key', e.target.value)}
                        placeholder="Field name"
                        className="field-key"
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => updateFormField(field.id, 'value', e.target.value)}
                        placeholder="Field value"
                        className="field-value"
                      />
                      <button
                        className="remove-field-button"
                        onClick={() => removeFormField(field.id)}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                  <button className="add-field-button" onClick={addFormField}>
                    ➕ Add Field
                  </button>
                </div>
              ) : request.bodyType !== 'none' && (
                <textarea
                  value={request.bodyContent}
                  onChange={(e) => setRequest(prev => ({ ...prev, bodyContent: e.target.value }))}
                  placeholder={`Enter ${request.bodyType.toUpperCase()} content here...`}
                  className="body-textarea"
                  rows={8}
                />
              )}
            </div>
          )}

          {response && (
            <div className="testing-section response-section">
              <label className="section-label">Response</label>

              <div className="response-summary">
                <div className="response-status">
                  <span className={`status-code ${response.status >= 200 && response.status < 300 ? 'success' : response.status >= 400 ? 'error' : 'info'}`}>
                    {response.status}
                  </span>
                  <span className="status-text">{response.statusText}</span>
                </div>

                <div className="response-meta">
                  <span className="response-time">{response.responseTime.toFixed(2)}ms</span>
                  <span className="response-size">{formatFileSize(response.size)}</span>
                  <span className="response-timestamp">{response.timestamp.toLocaleTimeString()}</span>
                </div>

                <div className="response-actions">
                  <button
                    className="copy-response-button"
                    onClick={() => copyToClipboard(response.data, 'Response body')}
                  >
                    📋 Copy Body
                  </button>
                  <button
                    className="copy-headers-button"
                    onClick={() => {
                      const headersText = Object.entries(response.headers)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('\n')
                      copyToClipboard(headersText, 'Response headers')
                    }}
                  >
                    📋 Copy Headers
                  </button>
                </div>
              </div>

              <div className="response-tabs">
                <div className="response-body">
                  <h4>Response Body</h4>
                  <pre className="response-content">
                    {response.headers['content-type']?.includes('application/json')
                      ? formatJson(response.data)
                      : response.data}
                  </pre>
                </div>

                <div className="response-headers">
                  <h4>Response Headers</h4>
                  <div className="headers-list">
                    {Object.entries(response.headers).map(([key, value]) => (
                      <div key={key} className="header-item">
                        <span className="header-name">{key}:</span>
                        <span className="header-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'webhook' && (
        <div className="testing-section webhook-section">
          <label className="section-label">Webhook Testing</label>
          <div className="webhook-content">
            <p>Webhook testing functionality will be implemented here.</p>
            <p>This would typically involve setting up a temporary webhook endpoint to capture incoming requests.</p>
          </div>
        </div>
      )}

      {mode === 'docs' && (
        <div className="testing-section docs-section">
          <label className="section-label">API Documentation</label>
          <div className="docs-content">
            <p>API documentation viewer functionality will be implemented here.</p>
            <p>This would support OpenAPI/Swagger specification parsing and rendering.</p>
          </div>
        </div>
      )}

      <div className="testing-section tips-section">
        <label className="section-label">Tips & Information</label>
        <div className="tips-content">
          {mode === 'client' && (
            <div className="tip-text">
              <p><strong>CORS:</strong> Browser security may block requests to some APIs. Use a CORS proxy or browser extension if needed.</p>
              <p><strong>Authentication:</strong> Never expose sensitive API keys in client-side code in production.</p>
              <p><strong>Testing:</strong> Use the sample request to test with a public API endpoint.</p>
            </div>
          )}
          {mode === 'webhook' && (
            <div className="tip-text">
              <p><strong>Webhook Testing:</strong> Capture and inspect incoming webhook requests in real-time.</p>
              <p><strong>Debugging:</strong> View request headers, body, and query parameters for webhook debugging.</p>
            </div>
          )}
          {mode === 'docs' && (
            <div className="tip-text">
              <p><strong>API Documentation:</strong> Load and view OpenAPI/Swagger specifications.</p>
              <p><strong>Interactive:</strong> Test API endpoints directly from the documentation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ApiTesting
