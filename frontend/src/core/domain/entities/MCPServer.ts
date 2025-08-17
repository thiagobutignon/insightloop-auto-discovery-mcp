export enum ServerStatus {
  DISCOVERED = 'discovered',
  VALIDATED = 'validated',
  DEPLOYED = 'deployed',
  FAILED = 'failed'
}

export enum DeploymentMethod {
  DOCKER = 'docker',
  NPX = 'npx',
  E2B = 'e2b',
  LOCAL = 'local',
  AUTO = 'auto',
  EXTERNAL = 'external'
}

export interface ServerCapabilities {
  tools: Tool[]
  resources: Resource[]
  protocol: string
  endpoint?: string
}

export interface Tool {
  name: string
  description: string
  parameters?: Record<string, any>
}

export interface Resource {
  name: string
  type: string
  uri: string
}

export class MCPServer {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly githubUrl: string,
    public readonly description: string | null,
    public readonly status: ServerStatus,
    public readonly deployMethod: DeploymentMethod,
    public readonly endpoint: string | null,
    public readonly capabilities: ServerCapabilities | null,
    public readonly createdAt: Date,
    public readonly error: string | null
  ) {}

  static fromJSON(json: any): MCPServer {
    return new MCPServer(
      json.id,
      json.name,
      json.github_url,
      json.description,
      json.status as ServerStatus,
      json.deploy_method as DeploymentMethod,
      json.endpoint,
      json.capabilities,
      new Date(json.created_at),
      json.error
    )
  }

  canDeploy(): boolean {
    return this.status === ServerStatus.DISCOVERED || 
           this.status === ServerStatus.FAILED
  }

  canOrchestrate(): boolean {
    return this.status === ServerStatus.DEPLOYED && 
           this.capabilities !== null &&
           this.capabilities.tools.length > 0
  }

  isRunning(): boolean {
    return this.status === ServerStatus.DEPLOYED && 
           this.endpoint !== null
  }

  getToolCount(): number {
    return this.capabilities?.tools.length ?? 0
  }
}