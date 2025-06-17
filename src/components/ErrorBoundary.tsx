import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // In production, send to error reporting service
    if (import.meta.env.PROD) {
      // Mock Sentry error reporting
      console.error('Sentry Error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      })
    }
    
    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-error" />
              </div>
            </div>
            
            <h1 className="text-xl font-semibold text-neutral-900 mb-2">
              Er is iets misgegaan
            </h1>
            
            <p className="text-neutral-600 mb-6">
              Er is een onverwachte fout opgetreden. Probeer de pagina te verversen of neem contact op met de helpdesk.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-neutral-100 rounded-lg p-3 mb-4">
                <summary className="cursor-pointer text-sm font-medium text-neutral-700 mb-2">
                  Foutdetails (alleen zichtbaar in ontwikkelingsmodus)
                </summary>
                <pre className="text-xs text-neutral-600 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="btn btn-primary flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Probeer opnieuw
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="btn btn-outline flex-1"
              >
                Pagina verversen
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary 