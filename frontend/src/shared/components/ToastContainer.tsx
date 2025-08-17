'use client'

import { useToastStore } from '@/shared/hooks/useToast'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
}

const colors = {
  success: 'bg-green-500/20 border-green-500/30 text-green-400',
  error: 'bg-red-500/20 border-red-500/30 text-red-400',
  warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
  info: 'bg-blue-500/20 border-blue-500/30 text-blue-400'
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        
        return (
          <div
            key={toast.id}
            className={cn(
              "p-4 rounded-lg backdrop-blur-md border",
              "shadow-2xl animate-in slide-in-from-right",
              "flex items-start space-x-3",
              colors[toast.type]
            )}
          >
            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{toast.title}</p>
              {toast.description && (
                <p className="text-sm opacity-90 mt-1">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}