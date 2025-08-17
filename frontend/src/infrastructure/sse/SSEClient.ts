import { EventEmitter } from 'events'
import { useState, useEffect } from 'react'

export interface SSEConfig {
  url: string
  reconnect?: boolean
  reconnectDelay?: number
  maxReconnectDelay?: number
  maxReconnectAttempts?: number
  headers?: Record<string, string>
}

export interface SSEMessage {
  id?: string
  event?: string
  data: string
  retry?: number
}

export class SSEClient extends EventEmitter {
  private eventSource: EventSource | null = null
  private config: Required<SSEConfig>
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private isConnected = false
  private isClosed = false

  constructor(config: SSEConfig) {
    super()
    this.config = {
      url: config.url,
      reconnect: config.reconnect ?? true,
      reconnectDelay: config.reconnectDelay ?? 1000,
      maxReconnectDelay: config.maxReconnectDelay ?? 30000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      headers: config.headers ?? {}
    }
  }

  connect(): void {
    if (this.eventSource || this.isClosed) {
      return
    }

    try {
      this.eventSource = new EventSource(this.config.url)
      this.setupEventHandlers()
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  private setupEventHandlers(): void {
    if (!this.eventSource) return

    this.eventSource.onopen = () => {
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('open')
      console.log('[SSE] Connection opened')
    }

    this.eventSource.onmessage = (event) => {
      try {
        const message: SSEMessage = {
          data: event.data,
          event: event.type !== 'message' ? event.type : undefined
        }
        this.emit('message', message)
      } catch (error) {
        this.emit('error', error)
      }
    }

    this.eventSource.onerror = (error) => {
      this.isConnected = false
      this.handleError(new Error('SSE connection error'))
      
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.eventSource = null
        this.attemptReconnect()
      }
    }

    // Listen for custom events
    this.eventSource.addEventListener('update', (event) => {
      this.emit('update', JSON.parse(event.data))
    })

    this.eventSource.addEventListener('complete', (event) => {
      this.emit('complete', JSON.parse(event.data))
    })

    this.eventSource.addEventListener('error', (event) => {
      this.emit('stream-error', JSON.parse(event.data))
    })

    this.eventSource.addEventListener('progress', (event) => {
      this.emit('progress', JSON.parse(event.data))
    })
  }

  private handleError(error: Error): void {
    console.error('[SSE] Error:', error)
    this.emit('error', error)
  }

  private attemptReconnect(): void {
    if (!this.config.reconnect || this.isClosed) {
      return
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[SSE] Max reconnection attempts reached')
      this.emit('max-reconnect-attempts')
      this.close()
      return
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.config.maxReconnectDelay
    )

    this.reconnectAttempts++
    console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)

    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      delay,
      maxAttempts: this.config.maxReconnectAttempts
    })
  }

  close(): void {
    this.isClosed = true
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    this.isConnected = false
    this.emit('close')
    console.log('[SSE] Connection closed')
  }

  getState(): {
    isConnected: boolean
    isClosed: boolean
    reconnectAttempts: number
    readyState: number | null
  } {
    return {
      isConnected: this.isConnected,
      isClosed: this.isClosed,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.eventSource?.readyState ?? null
    }
  }

  // Utility method to send data (if backend supports it)
  async send(data: any): Promise<void> {
    if (!this.isConnected) {
      throw new Error('SSE client is not connected')
    }

    // This would require a separate HTTP endpoint since SSE is one-way
    const response = await fetch(this.config.url.replace('/stream', '/send'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Failed to send data: ${response.statusText}`)
    }
  }
}

// Hook for React components
export function useSSE(url: string, options?: Partial<SSEConfig>) {
  const [client, setClient] = useState<SSEClient | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [reconnectInfo, setReconnectInfo] = useState<{
    attempt: number
    delay: number
    maxAttempts: number
  } | null>(null)

  useEffect(() => {
    const sseClient = new SSEClient({
      url,
      ...options
    })

    sseClient.on('open', () => {
      setIsConnected(true)
      setError(null)
      setReconnectInfo(null)
    })

    sseClient.on('close', () => {
      setIsConnected(false)
    })

    sseClient.on('error', (err) => {
      setError(err)
      setIsConnected(false)
    })

    sseClient.on('reconnecting', (info) => {
      setReconnectInfo(info)
    })

    sseClient.on('max-reconnect-attempts', () => {
      setError(new Error('Maximum reconnection attempts reached'))
      setReconnectInfo(null)
    })

    sseClient.connect()
    setClient(sseClient)

    return () => {
      sseClient.close()
    }
  }, [url])

  return {
    client,
    isConnected,
    error,
    reconnectInfo,
    retry: () => {
      if (client) {
        client.close()
        const newClient = new SSEClient({
          url,
          ...options
        })
        newClient.connect()
        setClient(newClient)
      }
    }
  }
}

// Export for use in stores
export default SSEClient