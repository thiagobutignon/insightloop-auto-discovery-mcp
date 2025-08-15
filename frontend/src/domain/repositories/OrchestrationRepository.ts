import { OrchestrationTask } from '../entities/OrchestrationTask'

export interface OrchestrationRepository {
  createTask(serverId: string, prompt: string): Promise<OrchestrationTask>
  getTaskById(id: string): Promise<OrchestrationTask | null>
  getTasks(): Promise<OrchestrationTask[]>
  streamTask(serverId: string, prompt: string, onEvent: (event: any) => void): Promise<void>
}