'use client'

import { ServiceWorkerProvider } from './ServiceWorkerProvider'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ServiceWorkerProvider>
      {children}
    </ServiceWorkerProvider>
  )
}