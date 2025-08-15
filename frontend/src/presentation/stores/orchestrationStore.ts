import { create } from 'zustand'
import { OrchestrationTask, TaskEvent } from '@/domain/entities/OrchestrationTask'
import { OrchestrationRepositoryImpl } from '@/infrastructure/repositories/OrchestrationRepositoryImpl'

interface OrchestrationState {
  tasks: OrchestrationTask[]
  currentTask: OrchestrationTask | null
  streamEvents: TaskEvent[]
  loading: boolean
  error: string | null
  
  // Actions
  createTask: (serverId: string, prompt: string) => Promise<void>
  streamTask: (serverId: string, prompt: string) => Promise<void>
  loadTasks: () => Promise<void>
  clearCurrentTask: () => void
  clearError: () => void
}

const repository = new OrchestrationRepositoryImpl()

export const useOrchestrationStore = create<OrchestrationState>((set, get) => ({
  tasks: [],
  currentTask: null,
  streamEvents: [],
  loading: false,
  error: null,

  createTask: async (serverId, prompt) => {
    set({ loading: true, error: null })
    try {
      const task = await repository.createTask(serverId, prompt)
      const tasks = [...get().tasks, task]
      set({ tasks, currentTask: task, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  streamTask: async (serverId, prompt) => {
    set({ loading: true, error: null, streamEvents: [] })
    
    const task = new OrchestrationTask(
      Date.now().toString(),
      serverId,
      prompt
    )
    
    set({ currentTask: task })

    try {
      await repository.streamTask(serverId, prompt, (event) => {
        task.addEvent(event.event, event.message, event.data)
        set({ streamEvents: [...task.events] })
        
        if (event.event === 'gemini_response') {
          task.complete(event.response)
          const tasks = [...get().tasks, task]
          set({ tasks, loading: false })
        } else if (event.event === 'error') {
          task.fail(event.error || event.message)
          set({ loading: false })
        }
      })
    } catch (error) {
      task.fail((error as Error).message)
      set({ error: (error as Error).message, loading: false })
    }
  },

  loadTasks: async () => {
    set({ loading: true, error: null })
    try {
      const tasks = await repository.getTasks()
      set({ tasks, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  clearCurrentTask: () => {
    set({ currentTask: null, streamEvents: [] })
  },

  clearError: () => {
    set({ error: null })
  },
}))