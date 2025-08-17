export class ApiClient {
  private baseURL: string

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.baseURL = baseURL
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        console.error('Unauthorized')
      }
      const error = await response.text().catch(() => response.statusText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${error}`)
    }
    
    const data = await response.json()
    return data as T
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const queryString = params 
      ? '?' + new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              acc[key] = String(value)
            }
            return acc
          }, {} as Record<string, string>)
        ).toString()
      : ''
    
    const response = await fetch(`${this.baseURL}${url}${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    return this.handleResponse<T>(response)
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    
    return this.handleResponse<T>(response)
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    
    return this.handleResponse<T>(response)
  }

  async delete<T>(url: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    return this.handleResponse<T>(response)
  }

  streamSSE(url: string, data: Record<string, string>, onMessage: (event: MessageEvent) => void): EventSource {
    const params = new URLSearchParams(data)
    const eventSource = new EventSource(`${this.baseURL}${url}?${params}`)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      eventSource.close()
    }

    return eventSource
  }
}

export const apiClient = new ApiClient()