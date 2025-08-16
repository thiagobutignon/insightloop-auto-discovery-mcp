'use client'

import React, { Component, ReactNode } from 'react'
import { GlassCard } from './GlassCard'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
    
    // You could also log to an error reporting service here
    // logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
          <GlassCard className="max-w-2xl w-full">
            <div className="text-center space-y-6 py-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold mb-2">Oops! Something went wrong</h1>
                <p className="text-gray-400">
                  We encountered an unexpected error. Don't worry, your data is safe.
                </p>
              </div>

              {this.state.error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Error Details
                  </h3>
                  <p className="text-sm text-red-300 font-mono">
                    {this.state.error.message}
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-300">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs text-gray-500 overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transition-all font-medium flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-medium flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}