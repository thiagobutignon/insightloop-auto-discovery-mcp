import { ServerRepository } from '@/domain/repositories/ServerRepository'
import { Server, ServerStatus, ServerCapabilities, ServerProtocol } from '@/domain/entities/Server'
import { apiClient } from '../api/client'

interface ServerApiResponse {
  id: string;
  name: string;
  description?: string;
  author?: string;
  github_url?: string;
  docker_image?: string;
  endpoint?: string;
  protocol?: ServerProtocol;
  capabilities?: ServerCapabilities;
  status?: string;
  container_id?: string;
}

interface DiscoverResponse {
  servers: ServerApiResponse[];
}

interface DeployResponse {
  server: ServerApiResponse;
  container_id?: string;
}

interface RunningServersResponse {
  servers: ServerApiResponse[];
}

interface UpdateCapabilitiesResponse {
  server: ServerApiResponse;
}

export class ServerRepositoryImpl implements ServerRepository {
  async discover(query?: string): Promise<Server[]> {
    const response = await apiClient.post<DiscoverResponse>('/api/discover', { query })
    return response.servers.map((s) => Server.fromDiscovery(s))
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
    const response = await apiClient.post<DeployResponse>(`/api/deploy/${id}`)
    return new Server(
      response.server.id,
      response.server.name,
      response.server.description || '',
      response.server.author || '',
      response.server.github_url || '',
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
    const response = await apiClient.get<RunningServersResponse>('/api/servers/running')
    return response.servers.map((s) => new Server(
      s.id,
      s.name,
      s.description || '',
      s.author || '',
      s.github_url || '',
      s.docker_image,
      s.endpoint,
      ServerStatus.RUNNING,
      s.protocol,
      s.capabilities,
      s.container_id
    ))
  }

  async updateCapabilities(id: string, capabilities: ServerCapabilities): Promise<Server> {
    const response = await apiClient.put<UpdateCapabilitiesResponse>(`/api/servers/${id}/capabilities`, capabilities)
    return Server.fromDiscovery(response.server)
  }
}