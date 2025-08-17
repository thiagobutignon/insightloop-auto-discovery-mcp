# Fetch API Best Practices for Next.js

## 🎯 Overview
This document outlines best practices for using the native Fetch API in Next.js applications, replacing axios with modern, lightweight alternatives.

## 📚 Table of Contents
1. [Why Fetch over Axios](#why-fetch-over-axios)
2. [Basic Patterns](#basic-patterns)
3. [Error Handling](#error-handling)
4. [Authentication](#authentication)
5. [Caching Strategies](#caching-strategies)
6. [SSE and Streaming](#sse-and-streaming)
7. [Testing](#testing)
8. [Migration Guide](#migration-guide)

---

## Why Fetch over Axios

### Benefits of Native Fetch
- **Zero Dependencies**: No additional library needed
- **Smaller Bundle**: Reduces client-side JavaScript by ~15-20KB
- **Next.js Integration**: Built-in caching and revalidation
- **Modern Standard**: Web platform API
- **Better Streaming**: Native support for SSE and streams
- **Server Components**: Works seamlessly with RSC

### When to Use Fetch
- ✅ Server Components
- ✅ API Routes
- ✅ Client Components
- ✅ Server Actions
- ✅ Middleware

---

## Basic Patterns

### Simple GET Request
```typescript
// Client Component
async function fetchData() {
  const response = await fetch('/api/data')
  if (!response.ok) {
    throw new Error('Failed to fetch data')
  }
  return response.json()
}

// Server Component
async function ServerComponent() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 } // Cache for 1 hour
  }).then(res => res.json())
  
  return <div>{data}</div>
}
```

### POST Request with Body
```typescript
async function createResource(data: any) {
  const response = await fetch('/api/resources', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}
```

### Using Our Fetch Client
```typescript
import fetchClient from '@/lib/fetch-client'

// Simple usage
const data = await fetchClient.get('/api/servers')

// With parameters
const results = await fetchClient.get('/api/search', {
  params: { q: 'mcp server', limit: '10' }
})

// POST with data
const server = await fetchClient.post('/api/deploy', {
  githubUrl: 'https://github.com/...',
  method: 'docker'
})
```

---

## Error Handling

### Proper Error Handling Pattern
```typescript
class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

async function fetchWithErrorHandling(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new APIError(
        errorData?.message || `HTTP ${response.status}`,
        response.status,
        errorData
      )
    }
    
    return response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    
    // Network error or other issues
    throw new APIError('Network error', undefined, error)
  }
}
```

### React Query Integration
```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import fetchClient from '@/lib/fetch-client'

// Query hook
export function useServers() {
  return useQuery({
    queryKey: ['servers'],
    queryFn: () => fetchClient.get('/api/servers'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Mutation hook
export function useDeployServer() {
  return useMutation({
    mutationFn: (data: DeploymentRequest) => 
      fetchClient.post('/api/deploy', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] })
    },
  })
}
```

---

## Authentication

### Token Management
```typescript
// Token storage (use cookies in production)
class TokenManager {
  private static TOKEN_KEY = 'auth_token'
  
  static getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.TOKEN_KEY)
  }
  
  static setToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.TOKEN_KEY, token)
  }
  
  static removeToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.TOKEN_KEY)
  }
}

// Auth fetch wrapper
async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = TokenManager.getToken()
  
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  
  const response = await fetch(url, { ...options, headers })
  
  if (response.status === 401) {
    TokenManager.removeToken()
    window.location.href = '/login'
  }
  
  return response
}
```

---

## Caching Strategies

### Next.js Built-in Caching
```typescript
// Static data (cached indefinitely)
fetch(url, { cache: 'force-cache' })

// Dynamic data (no cache)
fetch(url, { cache: 'no-store' })

// Revalidate after time
fetch(url, { next: { revalidate: 3600 } }) // 1 hour

// Tag-based revalidation
fetch(url, { next: { tags: ['servers'] } })
```

### Manual Cache Implementation
```typescript
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private ttl: number
  
  constructor(ttl: number = 60000) { // Default 1 minute
    this.ttl = ttl
  }
  
  async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data
    }
    
    const data = await fetcher()
    this.cache.set(key, { data, timestamp: Date.now() })
    return data
  }
  
  invalidate(key?: string) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }
}

// Usage
const cache = new SimpleCache(5 * 60 * 1000) // 5 minutes
const data = await cache.fetch('servers', () => 
  fetch('/api/servers').then(r => r.json())
)
```

---

## SSE and Streaming

### Server-Sent Events
```typescript
import { SSEClient } from '@/lib/sse-client'

function useSSE(url: string) {
  const [messages, setMessages] = useState<any[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    const client = new SSEClient(url, {
      onOpen: () => setIsConnected(true),
      onMessage: (data) => setMessages(prev => [...prev, data]),
      onError: (err) => setError(err),
      onClose: () => setIsConnected(false),
    })
    
    client.connect()
    
    return () => client.close()
  }, [url])
  
  return { messages, error, isConnected }
}
```

### Streaming Response
```typescript
async function* streamResponse(url: string, options?: RequestInit) {
  const response = await fetch(url, options)
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')
  
  const decoder = new TextDecoder()
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value, { stream: true })
      yield chunk
    }
  } finally {
    reader.releaseLock()
  }
}

// Usage
for await (const chunk of streamResponse('/api/stream')) {
  console.log('Received:', chunk)
}
```

---

## Testing

### Mocking Fetch
```typescript
// __tests__/fetch.test.ts
import { fetchClient } from '@/lib/fetch-client'

// Mock global fetch
global.fetch = jest.fn()

describe('Fetch Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('should handle successful response', async () => {
    const mockData = { id: 1, name: 'Test' }
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
      headers: new Headers({ 'content-type': 'application/json' }),
    })
    
    const result = await fetchClient.get('/api/test')
    expect(result).toEqual(mockData)
  })
  
  it('should handle error response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Not Found',
    })
    
    await expect(fetchClient.get('/api/test')).rejects.toThrow()
  })
  
  it('should retry on failure', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
    
    const result = await fetchClient.get('/api/test', { retries: 1 })
    expect(result).toEqual({ success: true })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
```

### Testing with MSW
```typescript
// __tests__/msw.test.ts
import { setupServer } from 'msw/node'
import { rest } from 'msw'

const server = setupServer(
  rest.get('/api/servers', (req, res, ctx) => {
    return res(ctx.json([
      { id: '1', name: 'Server 1' },
      { id: '2', name: 'Server 2' },
    ]))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('fetches servers', async () => {
  const response = await fetch('/api/servers')
  const data = await response.json()
  
  expect(data).toHaveLength(2)
  expect(data[0].name).toBe('Server 1')
})
```

---

## Migration Guide

### Step-by-Step Migration from Axios

#### 1. Basic GET Request
```typescript
// Before (Axios)
const response = await axios.get('/api/data')
const data = response.data

// After (Fetch)
const response = await fetch('/api/data')
const data = await response.json()
```

#### 2. POST with Data
```typescript
// Before (Axios)
const response = await axios.post('/api/data', { name: 'test' })
const result = response.data

// After (Fetch)
const response = await fetch('/api/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'test' })
})
const result = await response.json()
```

#### 3. Error Handling
```typescript
// Before (Axios)
try {
  const response = await axios.get('/api/data')
  return response.data
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error(error.response?.data)
  }
}

// After (Fetch)
try {
  const response = await fetch('/api/data')
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return await response.json()
} catch (error) {
  console.error(error.message)
}
```

#### 4. Request Interceptors
```typescript
// Before (Axios)
axios.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${token}`
  return config
})

// After (Fetch Client)
fetchClient.addRequestInterceptor(config => {
  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${token}`
  }
  return config
})
```

---

## Performance Tips

### 1. Use AbortController
```typescript
const controller = new AbortController()

// Set timeout
setTimeout(() => controller.abort(), 5000)

try {
  const response = await fetch(url, {
    signal: controller.signal
  })
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled')
  }
}
```

### 2. Request Deduplication
```typescript
const pending = new Map()

async function dedupeFetch(key: string, url: string) {
  if (pending.has(key)) {
    return pending.get(key)
  }
  
  const promise = fetch(url)
    .then(r => r.json())
    .finally(() => pending.delete(key))
  
  pending.set(key, promise)
  return promise
}
```

### 3. Parallel Requests
```typescript
// Sequential (slow)
const user = await fetch('/api/user').then(r => r.json())
const posts = await fetch('/api/posts').then(r => r.json())

// Parallel (fast)
const [user, posts] = await Promise.all([
  fetch('/api/user').then(r => r.json()),
  fetch('/api/posts').then(r => r.json())
])
```

---

## Common Pitfalls to Avoid

### ❌ Forgetting to Check Response Status
```typescript
// Bad
const data = await fetch(url).then(r => r.json())

// Good
const response = await fetch(url)
if (!response.ok) throw new Error(`HTTP ${response.status}`)
const data = await response.json()
```

### ❌ Not Handling Different Content Types
```typescript
// Bad
const data = await response.json() // Fails if not JSON

// Good
const contentType = response.headers.get('content-type')
const data = contentType?.includes('application/json')
  ? await response.json()
  : await response.text()
```

### ❌ Memory Leaks with Streams
```typescript
// Bad
const reader = response.body.getReader()
// Forgot to release lock

// Good
const reader = response.body.getReader()
try {
  // Use reader
} finally {
  reader.releaseLock()
}
```

---

## Conclusion

By following these best practices, you can effectively use the native Fetch API in Next.js applications, resulting in:
- Smaller bundle sizes
- Better performance
- Improved type safety
- Seamless integration with Next.js features

Remember: Keep it simple, use built-in features when possible, and always handle errors properly.