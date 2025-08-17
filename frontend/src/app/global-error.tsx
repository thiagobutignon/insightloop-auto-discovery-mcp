'use client'

import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                Critical Application Error
              </h2>
              
              <p className="text-gray-400 mb-6">
                The application encountered a critical error and needs to restart.
              </p>
              
              {error.digest && (
                <p className="text-xs text-gray-500 font-mono mb-6">
                  Error ID: {error.digest}
                </p>
              )}
              
              <button
                onClick={reset}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}