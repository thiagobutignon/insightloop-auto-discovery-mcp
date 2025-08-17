'use client'

import { create } from 'zustand'
import { ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const newToast = { ...toast, id }
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))
    
    // Auto-remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }))
      }, toast.duration || 5000)
    }
  },
  
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id)
    })),
  
  clearToasts: () => set({ toasts: [] })
}))

export const useToast = () => {
  const { addToast, removeToast, clearToasts } = useToastStore()
  
  const toast = {
    success: (title: string, description?: string) =>
      addToast({ title, description, type: 'success' }),
    
    error: (title: string, description?: string) =>
      addToast({ title, description, type: 'error' }),
    
    warning: (title: string, description?: string) =>
      addToast({ title, description, type: 'warning' }),
    
    info: (title: string, description?: string) =>
      addToast({ title, description, type: 'info' }),
    
    custom: (toast: Omit<Toast, 'id'>) => addToast(toast),
    
    dismiss: removeToast,
    dismissAll: clearToasts
  }
  
  return toast
}