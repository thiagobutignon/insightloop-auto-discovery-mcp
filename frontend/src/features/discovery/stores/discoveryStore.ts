import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { MCPServer } from '@/core/domain/entities/MCPServer'

interface DiscoveryState {
  // State
  servers: MCPServer[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  filters: {
    status?: string
    hasTools?: boolean
    deployMethod?: string
  }

  // Actions
  setServers: (servers: MCPServer[]) => void
  addServer: (server: MCPServer) => void
  updateServer: (id: string, server: MCPServer) => void
  removeServer: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSearchQuery: (query: string) => void
  setFilters: (filters: any) => void
  clearFilters: () => void
  reset: () => void
}

const initialState = {
  servers: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  filters: {}
}

export const useDiscoveryStore = create<DiscoveryState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setServers: (servers) => set({ servers }),
        
        addServer: (server) => 
          set((state) => ({ 
            servers: [...state.servers, server] 
          })),
        
        updateServer: (id, server) =>
          set((state) => ({
            servers: state.servers.map(s => s.id === id ? server : s)
          })),
        
        removeServer: (id) =>
          set((state) => ({
            servers: state.servers.filter(s => s.id !== id)
          })),
        
        setLoading: (isLoading) => set({ isLoading }),
        
        setError: (error) => set({ error }),
        
        setSearchQuery: (searchQuery) => set({ searchQuery }),
        
        setFilters: (filters) => 
          set((state) => ({ 
            filters: { ...state.filters, ...filters } 
          })),
        
        clearFilters: () => set({ filters: {} }),
        
        reset: () => set(initialState),
      }),
      {
        name: 'discovery-storage',
        partialize: (state) => ({ 
          searchQuery: state.searchQuery,
          filters: state.filters 
        }),
      }
    )
  )
)