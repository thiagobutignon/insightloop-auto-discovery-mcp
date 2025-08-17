import { MCPServer } from '../domain/entities/MCPServer'

export interface DiscoveryQuery {
  query: string
  limit?: number
  autoDeloy?: boolean
}

export interface DeploymentRequest {
  githubUrl: string
  method: 'docker' | 'npx' | 'e2b' | 'auto'
  port?: number
}

export interface OrchestrationRequest {
  serverId: string
  prompt: string
  context?: Record<string, any>
}

export interface IMCPServerRepository {
  // Discovery
  discoverServers(query: DiscoveryQuery): Promise<MCPServer[]>
  
  // Server Management
  getServers(): Promise<MCPServer[]>
  getServer(id: string): Promise<MCPServer | null>
  registerServer(name: string, endpoint: string, githubUrl?: string): Promise<MCPServer>
  
  // Deployment
  deployServer(request: DeploymentRequest): Promise<MCPServer>
  
  // Orchestration
  orchestrateTask(request: OrchestrationRequest): Promise<any>
  orchestrateTaskStream(request: OrchestrationRequest): AsyncIterable<any>
  
  // Tools
  invokeTool(serverId: string, toolName: string, args: any): Promise<any>
}