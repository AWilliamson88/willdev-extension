import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          padding: '20px',
          textAlign: 'center',
          color: 'var(--text-primary)',
          backgroundColor: 'var(--bg-primary)'
        }}>
          <h2 style={{ 
            color: 'var(--error-color)', 
            marginBottom: '16px',
            fontSize: '1.2rem'
          }}>
            ⚠️ Something went wrong
          </h2>
          <p style={{ 
            color: 'var(--text-secondary)', 
            marginBottom: '20px',
            maxWidth: '400px',
            lineHeight: '1.5'
          }}>
            This component failed to load properly. Please try refreshing the page or navigating to a different tool.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              🔄 Refresh Page
            </button>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: undefined })
                window.history.pushState({}, '', '/')
                window.location.reload()
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              🏠 Go Home
            </button>
          </div>
          {this.state.error && (
            <details style={{ 
              marginTop: '20px', 
              maxWidth: '500px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                Technical Details
              </summary>
              <pre style={{ 
                textAlign: 'left', 
                backgroundColor: 'var(--bg-secondary)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'auto',
                border: '1px solid var(--border-color)'
              }}>
                {this.state.error.message}
                {this.state.error.stack && '\n\n' + this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
