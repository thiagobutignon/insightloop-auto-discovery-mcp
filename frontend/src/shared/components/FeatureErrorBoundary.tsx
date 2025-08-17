'use client'

import { GlassCard } from './GlassCard'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { ErrorBoundary } from './ErrorBoundary'
import { ReactNode } from 'react'

interface FeatureErrorFallbackProps {
  error?: Error
  resetError?: () => void
  featureName?: string
}

function FeatureErrorFallback({ error, resetError, featureName }: FeatureErrorFallbackProps) {
  return (
    <GlassCard className="p-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-yellow-400" />
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-2">
            {featureName ? `${featureName} Error` : 'Feature Error'}
          </h3>
          <p className="text-gray-400 text-sm">
            This feature encountered an issue but the rest of the app is still working.
          </p>
        </div>

        {error && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm">
            <code className="text-yellow-300">{error.message}</code>
          </div>
        )}

        <button
          onClick={resetError}
          className="px-4 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </GlassCard>
  )
}

interface FeatureErrorBoundaryProps {
  children: ReactNode
  featureName?: string
}

export function FeatureErrorBoundary({ children, featureName }: FeatureErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <FeatureErrorFallback featureName={featureName} />
      }
      onReset={() => {
        // Could trigger a re-fetch of data here
        window.location.reload()
      }}
    >
      {children}
    </ErrorBoundary>
  )
}