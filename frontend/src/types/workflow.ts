// Workflow type definitions with strict typing

export type NodeType = 'start' | 'tool' | 'condition' | 'end'

export interface Position {
  x: number
  y: number
}

// Tool parameter types
export type ParameterType = 'string' | 'number' | 'boolean' | 'select' | 'json'

export interface ToolParameter {
  name: string
  type: ParameterType
  required: boolean
  default?: string | number | boolean
  description?: string
  options?: Array<{ label: string; value: string | number }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
    minLength?: number
    maxLength?: number
  }
}

export interface ToolArgs {
  [key: string]: string | number | boolean | null
}

export interface WorkflowNode {
  id: string
  type: NodeType
  name: string
  description?: string
  tool?: string
  args?: ToolArgs
  position: Position
  connections: string[]
  // Condition-specific fields
  condition?: {
    type: 'equals' | 'contains' | 'greater' | 'less' | 'regex'
    field: string
    value: string | number | boolean
    trueBranch?: string
    falseBranch?: string
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  label?: string
  type?: 'success' | 'failure' | 'conditional'
}

export interface Workflow {
  id: string
  name: string
  description?: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  variables?: Record<string, string | number | boolean>
  createdAt: Date
  updatedAt: Date
  version?: string
  author?: string
  tags?: string[]
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: Date
  completedAt?: Date
  currentNodeId?: string
  executionPath: string[]
  results: Record<string, unknown>
  errors?: Array<{
    nodeId: string
    error: string
    timestamp: Date
  }>
}

export interface AvailableTool {
  name: string
  description: string
  category?: string
  icon?: string
  parameters?: ToolParameter[]
  outputs?: Array<{
    name: string
    type: string
    description?: string
  }>
  requiredCapabilities?: string[]
}

// Validation utilities
export function validateWorkflowNode(node: Partial<WorkflowNode>): node is WorkflowNode {
  return !!(
    node.id &&
    node.type &&
    node.name &&
    node.position &&
    typeof node.position.x === 'number' &&
    typeof node.position.y === 'number' &&
    Array.isArray(node.connections)
  )
}

export function validateToolArgs(args: unknown): args is ToolArgs {
  if (!args || typeof args !== 'object') return false
  
  return Object.entries(args).every(([_, value]) => {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    )
  })
}

export function sanitizeWorkflowName(name: string): string {
  // Remove any potentially harmful characters
  return name
    .replace(/[<>\"'`]/g, '') // Remove HTML/JS injection characters
    .replace(/[^\w\s\-\.]/g, '') // Keep only alphanumeric, spaces, hyphens, dots
    .trim()
    .slice(0, 100) // Limit length
}

export function sanitizeWorkflowDescription(description: string): string {
  return description
    .replace(/[<>\"'`]/g, '') // Remove HTML/JS injection characters
    .replace(/[\r\n]+/g, ' ') // Replace newlines with spaces
    .trim()
    .slice(0, 500) // Limit length
}