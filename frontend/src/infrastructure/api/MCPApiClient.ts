import { MCPServer } from '@/core/domain/entities/MCPServer'
import { 
  IMCPServerRepository,
  DiscoveryQuery,
  DeploymentRequest,
  OrchestrationRequest 
} from '@/core/repositories/IMCPServerRepository'

export class MCPApiClient implements IMCPServerRepository {
  private baseURL: string
  private defaultHeaders: HeadersInit

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    
    const headers = {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    })

    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }

    return response
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP error! status: ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return await response.json()
    }
    
    return await response.text() as T
  }

  async discoverServers(query: DiscoveryQuery): Promise<MCPServer[]> {
    const response = await this.fetchWithAuth('/api/discover', {
      method: 'POST',
      body: JSON.stringify(query),
    })
    const data = await this.handleResponse<any[]>(response)
    return data.map(item => MCPServer.fromJSON(item))
  }

  async getServers(): Promise<MCPServer[]> {
    const response = await this.fetchWithAuth('/api/servers')
    const data = await this.handleResponse<any[]>(response)
    return data.map(item => MCPServer.fromJSON(item))
  }

  async getServer(id: string): Promise<MCPServer | null> {
    try {
      const response = await this.fetchWithAuth(`/api/servers/${id}`)
      if (response.status === 404) {
        return null
      }
      const data = await this.handleResponse<any>(response)
      return MCPServer.fromJSON(data)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async registerServer(name: string, endpoint: string, githubUrl?: string): Promise<MCPServer> {
    const response = await this.fetchWithAuth('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        endpoint,
        github_url: githubUrl
      }),
    })
    const data = await this.handleResponse<any>(response)
    return MCPServer.fromJSON(data)
  }

  async deployServer(request: DeploymentRequest): Promise<MCPServer> {
    const response = await this.fetchWithAuth('/api/deploy', {
      method: 'POST',
      body: JSON.stringify({
        github_url: request.githubUrl,
        method: request.method,
        port: request.port
      }),
    })
    const data = await this.handleResponse<any>(response)
    return MCPServer.fromJSON(data)
  }

  async orchestrateTask(request: OrchestrationRequest): Promise<any> {
    const response = await this.fetchWithAuth('/api/orchestrate', {
      method: 'POST',
      body: JSON.stringify({
        server_id: request.serverId,
        prompt: request.prompt,
        context: request.context
      }),
    })
    return this.handleResponse(response)
  }

  async *orchestrateTaskStream(request: OrchestrationRequest): AsyncIterable<any> {
    const response = await fetch(`${this.baseURL}/api/orchestrate/stream`, {
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
    const response = await this.fetchWithAuth('/api/invoke', {
      method: 'POST',
      body: JSON.stringify({
        server_id: serverId,
        tool_name: toolName,
        args
      }),
    })
    return this.handleResponse(response)
  }
}