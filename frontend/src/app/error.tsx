'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="backdrop-blur-md bg-glass border border-glass-border rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
          
          <p className="text-gray-400 mb-6">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
          
          {error.digest && (
            <p className="text-xs text-gray-500 font-mono mb-6">
              Error ID: {error.digest}
            </p>
          )}
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Go Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}