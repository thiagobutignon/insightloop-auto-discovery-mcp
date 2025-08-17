// Domain type definitions to replace any types

export interface ServerCapability {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface ServerCapabilities {
  tools: ServerCapability[];
  resources?: ServerCapability[];
  prompts?: ServerCapability[];
}

export interface ServerConfig {
  port?: number;
  host?: string;
  apiKey?: string;
  environment?: Record<string, string>;
  [key: string]: unknown;
}

export interface ServerMetadata {
  version?: string;
  author?: string;
  description?: string;
  homepage?: string;
  license?: string;
  [key: string]: unknown;
}

export interface OrchestrationEvent {
  id: string;
  type: 'start' | 'progress' | 'complete' | 'error' | 'log';
  timestamp: number;
  data: {
    message?: string;
    progress?: number;
    error?: string;
    result?: unknown;
    [key: string]: unknown;
  };
}

export interface OrchestrationResult {
  success: boolean;
  data?: unknown;
  error?: string;
  events: OrchestrationEvent[];
  metadata?: Record<string, unknown>;
}

export interface DeploymentConfig {
  method: 'docker' | 'npx' | 'e2b' | 'local';
  version?: string;
  environment?: Record<string, string>;
  resources?: {
    cpu?: string;
    memory?: string;
    storage?: string;
  };
  ports?: number[];
  volumes?: string[];
  [key: string]: unknown;
}

export interface DiscoveryQuery {
  query?: string;
  language?: string;
  minStars?: number;
  maxStars?: number;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  page?: number;
  perPage?: number;
  sort?: 'stars' | 'updated' | 'created' | 'name';
  order?: 'asc' | 'desc';
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  stargazers_count: number;
  language?: string;
  updated_at: string;
  topics?: string[];
  homepage?: string;
}