import { OrchestrationRepository } from '@/domain/repositories/OrchestrationRepository'
import { OrchestrationTask, TaskStatus, TaskEvent } from '@/domain/entities/OrchestrationTask'
import { apiClient } from '../api/client'

interface OrchestrationApiResponse {
  task_id?: string;
  result?: unknown;
}

interface TaskApiResponse {
  id: string;
  server_id: string;
  prompt: string;
  status: TaskStatus;
}

interface TasksListResponse {
  tasks: TaskApiResponse[];
}

export class OrchestrationRepositoryImpl implements OrchestrationRepository {
  async createTask(serverId: string, prompt: string): Promise<OrchestrationTask> {
    const response = await apiClient.post<OrchestrationApiResponse>('/api/orchestrate', {
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
      const response = await apiClient.get<TaskApiResponse>(`/api/tasks/${id}`)
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
    const response = await apiClient.get<TasksListResponse>('/api/tasks')
    return response.tasks.map((t) => new OrchestrationTask(
      t.id,
      t.server_id,
      t.prompt,
      t.status
    ))
  }

  async streamTask(serverId: string, prompt: string, onEvent: (event: TaskEvent) => void): Promise<void> {
    const eventSource = apiClient.streamSSE('/api/orchestrate/stream', {
      server_id: serverId,
      prompt,
    }, (messageEvent: MessageEvent) => {
      try {
        const data = JSON.parse(messageEvent.data);
        const taskEvent: TaskEvent = {
          event: data.event || 'message',
          message: data.message,
          data: data.data,
          timestamp: new Date()
        };
        onEvent(taskEvent);
      } catch (error) {
        console.error('Error parsing event data:', error);
      }
    })

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