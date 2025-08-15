import { ServerRepository } from '@/domain/repositories/ServerRepository'
import { Server, ServerStatus } from '@/domain/entities/Server'
import { apiClient } from '../api/client'

export class ServerRepositoryImpl implements ServerRepository {
  async discover(query?: string): Promise<Server[]> {
    const response = await apiClient.post<any>('/api/discover', { query })
    return response.servers.map((s: any) => Server.fromDiscovery(s))
  }

  async getById(id: string): Promise<Server | null> {
    try {
      const servers = await this.getRunningServers()
      return servers.find(s => s.id === id) || null
    } catch {
      return null
    }
  }

  async deploy(id: string): Promise<Server> {
    const response = await apiClient.post<any>(`/api/deploy/${id}`)
    return new Server(
      response.server.id,
      response.server.name,
      response.server.description || '',
      response.server.author || '',
      response.server.github_url,
      response.server.docker_image,
      response.server.endpoint,
      ServerStatus.RUNNING,
      response.server.protocol,
      response.server.capabilities,
      response.container_id
    )
  }

  async stop(id: string): Promise<void> {
    await apiClient.post(`/api/servers/${id}/stop`)
  }

  async getRunningServers(): Promise<Server[]> {
    const response = await apiClient.get<any>('/api/servers/running')
    return response.servers.map((s: any) => new Server(
      s.id,
      s.name,
      s.description || '',
      s.author || '',
      s.github_url,
      s.docker_image,
      s.endpoint,
      ServerStatus.RUNNING,
      s.protocol,
      s.capabilities,
      s.container_id
    ))
  }

  async updateCapabilities(id: string, capabilities: any): Promise<Server> {
    const response = await apiClient.put<any>(`/api/servers/${id}/capabilities`, capabilities)
    return Server.fromDiscovery(response.server)
  }
}