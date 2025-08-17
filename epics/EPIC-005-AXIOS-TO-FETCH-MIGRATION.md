# EPIC-005: Axios to Fetch API Migration

## 🎯 Epic Overview
**Title**: Migrate from Axios to Native Fetch API in Next.js Frontend  
**Priority**: High  
**Timeline**: 1 week  
**Status**: In Progress

## 📋 Epic Description
Remove axios dependency from the InsightLoop frontend and replace with native fetch API, following Next.js best practices for data fetching, caching, and error handling.

## 🚫 Why Remove Axios?

### Issues with Axios in Next.js:
1. **Bundle Size**: Adds ~15-20KB to bundle (gzipped)
2. **Redundancy**: Fetch API is native and sufficient for most use cases
3. **Next.js Integration**: Fetch has better integration with Next.js caching
4. **Server Components**: Axios doesn't work well with React Server Components
5. **Streaming**: Native fetch supports streaming responses better
6. **Type Safety**: Fetch with TypeScript provides better type inference

### Benefits of Native Fetch:
1. **Zero Dependencies**: No external library needed
2. **Next.js Optimized**: Built-in caching and revalidation
3. **Smaller Bundle**: Reduces client-side JavaScript
4. **Better Performance**: Native browser API
5. **Streaming Support**: Native support for SSE and streams
6. **Modern Standard**: Web standard API

---

## 🛠️ Migration Strategy

### Phase 1: Create Fetch Utilities

#### File: `src/lib/fetch-client.ts`
```typescript
// Custom fetch wrapper with error handling and interceptors
export interface FetchConfig extends RequestInit {
  params?: Record<string, string>
  timeout?: number
  retries?: number
  retryDelay?: number
}

export interface FetchError extends Error {
  status?: number
  statusText?: string
  data?: any
}

class FetchClient {
  private baseURL: string
  private defaultHeaders: HeadersInit
  private interceptors: {
    request: Array<(config: FetchConfig) => FetchConfig | Promise<FetchConfig>>
    response: Array<(response: Response) => Response | Promise<Response>>
    error: Array<(error: FetchError) => Promise<never>>
  }

  constructor(baseURL: string = '') {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
    this.interceptors = {
      request: [],
      response: [],
      error: [],
    }
  }

  // Add request interceptor
  addRequestInterceptor(interceptor: (config: FetchConfig) => FetchConfig | Promise<FetchConfig>) {
    this.interceptors.request.push(interceptor)
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: (response: Response) => Response | Promise<Response>) {
    this.interceptors.response.push(interceptor)
  }

  // Add error interceptor
  addErrorInterceptor(interceptor: (error: FetchError) => Promise<never>) {
    this.interceptors.error.push(interceptor)
  }

  // Build URL with params
  private buildURL(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }
    return url.toString()
  }

  // Apply request interceptors
  private async applyRequestInterceptors(config: FetchConfig): Promise<FetchConfig> {
    let modifiedConfig = config
    for (const interceptor of this.interceptors.request) {
      modifiedConfig = await interceptor(modifiedConfig)
    }
    return modifiedConfig
  }

  // Apply response interceptors
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let modifiedResponse = response
    for (const interceptor of this.interceptors.response) {
      modifiedResponse = await interceptor(modifiedResponse)
    }
    return modifiedResponse
  }

  // Handle errors
  private async handleError(error: any): Promise<never> {
    const fetchError: FetchError = new Error(error.message || 'Network error')
    fetchError.name = 'FetchError'
    
    if (error instanceof Response) {
      fetchError.status = error.status
      fetchError.statusText = error.statusText
      try {
        fetchError.data = await error.json()
      } catch {
        fetchError.data = await error.text()
      }
    }

    for (const interceptor of this.interceptors.error) {
      try {
        await interceptor(fetchError)
      } catch (e) {
        throw e
      }
    }

    throw fetchError
  }

  // Retry logic
  private async fetchWithRetry(
    url: string,
    config: FetchConfig,
    retries: number = 0,
    retryDelay: number = 1000
  ): Promise<Response> {
    try {
      const controller = new AbortController()
      const timeout = config.timeout || 30000

      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return this.fetchWithRetry(url, config, retries - 1, retryDelay * 2)
      }

      return response
    } catch (error) {
      if (retries > 0 && error.name !== 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return this.fetchWithRetry(url, config, retries - 1, retryDelay * 2)
      }
      throw error
    }
  }

  // Main request method
  async request<T = any>(endpoint: string, config: FetchConfig = {}): Promise<T> {
    try {
      // Apply request interceptors
      const modifiedConfig = await this.applyRequestInterceptors({
        ...config,
        headers: {
          ...this.defaultHeaders,
          ...config.headers,
        },
      })

      // Build URL
      const url = this.buildURL(endpoint, modifiedConfig.params)

      // Make request with retry
      let response = await this.fetchWithRetry(
        url,
        modifiedConfig,
        modifiedConfig.retries,
        modifiedConfig.retryDelay
      )

      // Apply response interceptors
      response = await this.applyResponseInterceptors(response)

      // Handle non-OK responses
      if (!response.ok) {
        await this.handleError(response)
      }

      // Parse response
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        return await response.json()
      } else if (contentType?.includes('text')) {
        return await response.text() as T
      } else {
        return response as T
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, config?: FetchConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any, config?: FetchConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = any>(endpoint: string, data?: any, config?: FetchConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T = any>(endpoint: string, data?: any, config?: FetchConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = any>(endpoint: string, config?: FetchConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }
}

// Create singleton instance
const fetchClient = new FetchClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

// Add auth interceptor
fetchClient.addRequestInterceptor((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }
  return config
})

// Add error interceptor for auth
fetchClient.addErrorInterceptor(async (error) => {
  if (error.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
  }
  throw error
})

export default fetchClient
```

### Phase 2: SSE Client Implementation

#### File: `src/lib/sse-client.ts`
```typescript
export interface SSEConfig {
  onMessage?: (data: any) => void
  onError?: (error: Error) => void
  onOpen?: () => void
  onClose?: () => void
  retries?: number
  retryDelay?: number
}

export class SSEClient {
  private eventSource: EventSource | null = null
  private url: string
  private config: SSEConfig
  private retryCount: number = 0
  private reconnectTimeout: NodeJS.Timeout | null = null

  constructor(url: string, config: SSEConfig = {}) {
    this.url = url
    this.config = {
      retries: 3,
      retryDelay: 1000,
      ...config,
    }
  }

  connect(): void {
    try {
      this.eventSource = new EventSource(this.url)

      this.eventSource.onopen = () => {
        this.retryCount = 0
        this.config.onOpen?.()
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.config.onMessage?.(data)
        } catch (error) {
          console.error('Failed to parse SSE data:', error)
        }
      }

      this.eventSource.onerror = (error) => {
        this.config.onError?.(new Error('SSE connection error'))
        this.handleReconnect()
      }

      // Add custom event listeners
      this.addEventListeners()
    } catch (error) {
      this.config.onError?.(error as Error)
      this.handleReconnect()
    }
  }

  private addEventListeners(): void {
    if (!this.eventSource) return

    // Add custom event type listeners
    const eventTypes = [
      'planning',
      'tool_execution',
      'result',
      'error',
      'complete',
    ]

    eventTypes.forEach(eventType => {
      this.eventSource!.addEventListener(eventType, (event) => {
        try {
          const data = JSON.parse(event.data)
          this.config.onMessage?.({ type: eventType, ...data })
        } catch (error) {
          console.error(`Failed to parse ${eventType} event:`, error)
        }
      })
    })
  }

  private handleReconnect(): void {
    if (this.retryCount >= (this.config.retries || 3)) {
      this.close()
      this.config.onError?.(new Error('Max retries reached'))
      return
    }

    this.retryCount++
    const delay = (this.config.retryDelay || 1000) * Math.pow(2, this.retryCount - 1)

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Reconnecting SSE (attempt ${this.retryCount})...`)
      this.connect()
    }, delay)
  }

  close(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.config.onClose?.()
    }
  }

  getState(): EventSource['readyState'] | undefined {
    return this.eventSource?.readyState
  }
}
```

### Phase 3: Update API Client

#### File: `src/infrastructure/api/MCPApiClient.ts`
```typescript
import { MCPServer } from '@/core/domain/entities/MCPServer'
import { 
  IMCPServerRepository,
  DiscoveryQuery,
  DeploymentRequest,
  OrchestrationRequest 
} from '@/core/repositories/IMCPServerRepository'
import fetchClient from '@/lib/fetch-client'
import { SSEClient } from '@/lib/sse-client'

export class MCPApiClient implements IMCPServerRepository {
  async discoverServers(query: DiscoveryQuery): Promise<MCPServer[]> {
    const data = await fetchClient.post<any[]>('/api/discover', query)
    return data.map(item => MCPServer.fromJSON(item))
  }

  async getServers(): Promise<MCPServer[]> {
    const data = await fetchClient.get<any[]>('/api/servers')
    return data.map(item => MCPServer.fromJSON(item))
  }

  async getServer(id: string): Promise<MCPServer | null> {
    try {
      const data = await fetchClient.get<any>(`/api/servers/${id}`)
      return MCPServer.fromJSON(data)
    } catch (error: any) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }

  async registerServer(name: string, endpoint: string, githubUrl?: string): Promise<MCPServer> {
    const data = await fetchClient.post<any>('/api/register', {
      name,
      endpoint,
      github_url: githubUrl
    })
    return MCPServer.fromJSON(data)
  }

  async deployServer(request: DeploymentRequest): Promise<MCPServer> {
    const data = await fetchClient.post<any>('/api/deploy', {
      github_url: request.githubUrl,
      method: request.method,
      port: request.port
    })
    return MCPServer.fromJSON(data)
  }

  async orchestrateTask(request: OrchestrationRequest): Promise<any> {
    return fetchClient.post('/api/orchestrate', {
      server_id: request.serverId,
      prompt: request.prompt,
      context: request.context
    })
  }

  async *orchestrateTaskStream(request: OrchestrationRequest): AsyncIterable<any> {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${baseURL}/api/orchestrate/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        server_id: request.serverId,
        prompt: request.prompt,
        context: request.context
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              yield data
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async invokeTool(serverId: string, toolName: string, args: any): Promise<any> {
    return fetchClient.post('/api/invoke', {
      server_id: serverId,
      tool_name: toolName,
      args
    })
  }
}
```

### Phase 4: Next.js Specific Patterns

#### File: `src/lib/fetch-next.ts`
```typescript
// Next.js specific fetch patterns with caching and revalidation

interface NextFetchOptions extends RequestInit {
  // Next.js specific options
  revalidate?: number | false
  tags?: string[]
}

// Server-side fetch wrapper for Next.js
export async function fetchAPI<T = any>(
  endpoint: string,
  options: NextFetchOptions = {}
): Promise<T> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const url = `${baseURL}${endpoint}`

  const { revalidate = 60, tags, ...fetchOptions } = options

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      // Next.js caching options
      next: {
        revalidate,
        tags,
      },
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error)
    throw error
  }
}

// Server Action wrapper
export async function createServerAction<T = any>(
  action: () => Promise<T>
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await action()
    return { data }
  } catch (error) {
    console.error('Server action failed:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Parallel fetch helper
export async function fetchParallel<T extends Record<string, Promise<any>>>(
  fetchers: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const keys = Object.keys(fetchers) as (keyof T)[]
  const promises = keys.map(key => fetchers[key])
  
  const results = await Promise.all(promises)
  
  return keys.reduce((acc, key, index) => {
    acc[key] = results[index]
    return acc
  }, {} as { [K in keyof T]: Awaited<T[K]> })
}
```

---

## 🔄 Migration Steps

### Step 1: Install & Remove Dependencies
```bash
# Remove axios
npm uninstall axios

# No new dependencies needed - fetch is native!
```

### Step 2: Update All API Calls

#### Before (Axios):
```typescript
import axios from 'axios'

const response = await axios.post('/api/discover', data)
return response.data
```

#### After (Fetch):
```typescript
import fetchClient from '@/lib/fetch-client'

const response = await fetchClient.post('/api/discover', data)
return response
```

### Step 3: Update Error Handling

#### Before (Axios):
```typescript
try {
  const response = await axios.get('/api/servers')
  return response.data
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error(error.response?.data)
  }
}
```

#### After (Fetch):
```typescript
try {
  const response = await fetchClient.get('/api/servers')
  return response
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message)
  }
}
```

### Step 4: Update SSE Handling

#### Before (Axios + EventSource):
```typescript
const eventSource = new EventSource(url)
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // handle data
}
```

#### After (SSE Client):
```typescript
const sseClient = new SSEClient(url, {
  onMessage: (data) => {
    // handle data
  },
  onError: (error) => {
    // handle error
  }
})
sseClient.connect()
```

---

## 📊 Testing Strategy

### Unit Tests for Fetch Client
```typescript
import fetchClient from '@/lib/fetch-client'

describe('FetchClient', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('should make GET request', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' })
    })

    const result = await fetchClient.get('/test')
    expect(result).toEqual({ data: 'test' })
  })

  it('should handle errors', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    })

    await expect(fetchClient.get('/test')).rejects.toThrow()
  })

  it('should retry on failure', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      })

    const result = await fetchClient.get('/test', { retries: 1 })
    expect(result).toEqual({ data: 'test' })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
```

---

## ✅ Migration Checklist

### Phase 1: Setup (Day 1)
- [ ] Create fetch-client.ts utility
- [ ] Create sse-client.ts utility
- [ ] Create fetch-next.ts for Next.js patterns
- [ ] Add unit tests for utilities

### Phase 2: Update Infrastructure (Day 2-3)
- [ ] Update MCPApiClient to use fetch
- [ ] Update all repository implementations
- [ ] Update error handling
- [ ] Test all API endpoints

### Phase 3: Update Features (Day 4-5)
- [ ] Update discovery feature
- [ ] Update deployment feature
- [ ] Update orchestration feature
- [ ] Update monitoring feature

### Phase 4: Testing & Optimization (Day 6-7)
- [ ] Run all unit tests
- [ ] Run integration tests
- [ ] Performance testing
- [ ] Bundle size analysis
- [ ] Remove axios from package.json

---

## 📈 Success Metrics

### Before Migration:
- Bundle size: ~450KB
- Axios size: ~15-20KB gzipped
- Dependencies: 35+

### After Migration:
- Bundle size: ~430KB (5% reduction)
- Fetch size: 0KB (native)
- Dependencies: 34 (one less)

### Performance Improvements:
- Initial load: -15KB
- Parse time: -2ms
- Memory usage: -5%

---

## 🚨 Rollback Plan

If issues arise:
1. Git revert migration commits
2. Re-install axios: `npm install axios@1.6.5`
3. Deploy previous version
4. Investigate issues
5. Fix and retry migration

---

## 📝 Notes

### Best Practices:
1. Always use AbortController for cancellable requests
2. Implement proper timeout handling
3. Use retry logic for network failures
4. Handle different content types properly
5. Use Next.js caching for server components

### Common Pitfalls:
1. Forgetting to parse response body
2. Not handling non-JSON responses
3. Missing error status checks
4. Incorrect header formatting
5. Not releasing stream readers

---

**Epic Owner**: Frontend Team  
**Created**: 2025-01-17  
**Status**: Ready for Implementation