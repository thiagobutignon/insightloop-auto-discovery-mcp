import { create } from 'zustand'
import { Server } from '@/domain/entities/Server'
import { ServerRepositoryImpl } from '@/infrastructure/repositories/ServerRepositoryImpl'

interface ServerState {
  servers: Server[]
  runningServers: Server[]
  selectedServer: Server | null
  loading: boolean
  error: string | null
  
  // Actions
  discoverServers: (query?: string) => Promise<void>
  deployServer: (id: string) => Promise<void>
  stopServer: (id: string) => Promise<void>
  loadRunningServers: () => Promise<void>
  selectServer: (server: Server | null) => void
  clearError: () => void
}

const repository = new ServerRepositoryImpl()

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  runningServers: [],
  selectedServer: null,
  loading: false,
  error: null,

  discoverServers: async (query) => {
    set({ loading: true, error: null })
    try {
      const servers = await repository.discover(query)
      set({ servers, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  deployServer: async (id) => {
    set({ loading: true, error: null })
    try {
      const deployedServer = await repository.deploy(id)
      const runningServers = [...get().runningServers, deployedServer]
      set({ runningServers, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  stopServer: async (id) => {
    set({ loading: true, error: null })
    try {
      await repository.stop(id)
      const runningServers = get().runningServers.filter(s => s.id !== id)
      set({ runningServers, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  loadRunningServers: async () => {
    set({ loading: true, error: null })
    try {
      const runningServers = await repository.getRunningServers()
      set({ runningServers, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  selectServer: (server) => {
    set({ selectedServer: server })
  },

  clearError: () => {
    set({ error: null })
  },
}))