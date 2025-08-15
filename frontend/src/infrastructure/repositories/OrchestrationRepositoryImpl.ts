import { OrchestrationRepository } from '@/domain/repositories/OrchestrationRepository'
import { OrchestrationTask, TaskStatus } from '@/domain/entities/OrchestrationTask'
import { apiClient } from '../api/client'

export class OrchestrationRepositoryImpl implements OrchestrationRepository {
  async createTask(serverId: string, prompt: string): Promise<OrchestrationTask> {
    const response = await apiClient.post<any>('/api/orchestrate', {
      server_id: serverId,
      prompt,
    })
    
    const task = new OrchestrationTask(
      response.task_id || Date.now().toString(),
      serverId,
      prompt,
      TaskStatus.COMPLETED
    )
    
    if (response.result) {
      task.complete(response.result)
    }
    
    return task
  }

  async getTaskById(id: string): Promise<OrchestrationTask | null> {
    try {
      const response = await apiClient.get<any>(`/api/tasks/${id}`)
      return new OrchestrationTask(
        response.id,
        response.server_id,
        response.prompt,
        response.status
      )
    } catch {
      return null
    }
  }

  async getTasks(): Promise<OrchestrationTask[]> {
    const response = await apiClient.get<any>('/api/tasks')
    return response.tasks.map((t: any) => new OrchestrationTask(
      t.id,
      t.server_id,
      t.prompt,
      t.status
    ))
  }

  async streamTask(serverId: string, prompt: string, onEvent: (event: any) => void): Promise<void> {
    const eventSource = apiClient.streamSSE('/api/orchestrate/stream', {
      server_id: serverId,
      prompt,
    }, onEvent)

    return new Promise((resolve, reject) => {
      eventSource.addEventListener('error', () => {
        eventSource.close()
        reject(new Error('Stream error'))
      })

      eventSource.addEventListener('complete', () => {
        eventSource.close()
        resolve()
      })
    })
  }
}