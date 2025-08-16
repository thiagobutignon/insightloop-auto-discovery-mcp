export interface ServerCapabilities {
  tools?: Array<{
    name: string
    description?: string
    parameters?: Record<string, any>
  }>
  resources?: Array<{
    name: string
    type: string
    description?: string
  }>
  prompts?: Array<{
    name: string
    description?: string
  }>
}

export enum ServerStatus {
  DISCOVERED = 'discovered',
  DEPLOYING = 'deploying',
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error',
}

export enum ServerProtocol {
  HTTP = 'http',
  SSE = 'sse',
  WEBSOCKET = 'websocket',
  STDIO = 'stdio',
}

export class Server {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly author: string,
    public readonly githubUrl: string,
    public readonly dockerImage?: string,
    public readonly endpoint?: string,
    public readonly status: ServerStatus = ServerStatus.DISCOVERED,
    public readonly protocol?: ServerProtocol,
    public readonly capabilities?: ServerCapabilities,
    public readonly containerId?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static fromDiscovery(data: any): Server {
    return new Server(
      data.id,
      data.name,
      data.description || '',
      data.author || '',
      data.github_url || data.githubUrl,
      data.docker_image || data.dockerImage,
      data.endpoint,
      ServerStatus.DISCOVERED,
      data.protocol,
      data.capabilities
    )
  }

  isRunning(): boolean {
    return this.status === ServerStatus.RUNNING
  }

  canDeploy(): boolean {
    return this.status === ServerStatus.DISCOVERED || this.status === ServerStatus.STOPPED
  }

  hasTools(): boolean {
    return !!(this.capabilities?.tools && this.capabilities.tools.length > 0)
  }
}