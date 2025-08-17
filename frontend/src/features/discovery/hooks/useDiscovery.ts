import { useMutation, useQuery } from '@tanstack/react-query'
import { MCPApiClient } from '@/infrastructure/api/MCPApiClient'
import { useDiscoveryStore } from '../stores/discoveryStore'
import { MCPServer } from '@/core/domain/entities/MCPServer'
import { DiscoverServersUseCase } from '@/core/usecases/DiscoverServers'

const apiClient = new MCPApiClient()
const discoverUseCase = new DiscoverServersUseCase(apiClient)

export function useDiscovery() {
  const { 
    servers, 
    setServers, 
    setLoading, 
    setError,
    searchQuery,
    setSearchQuery 
  } = useDiscoveryStore()

  const discoverMutation = useMutation({
    mutationFn: async ({ query, limit = 10 }: { query: string; limit?: number }) => {
      setLoading(true)
      setError(null)
      try {
        const results = await discoverUseCase.execute(query, limit)
        return results
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Discovery failed'
        setError(errorMessage)
        throw error
      } finally {
        setLoading(false)
      }
    },
    onSuccess: (data) => {
      setServers(data)
    },
    onError: (error) => {
      console.error('Discovery error:', error)
    }
  })

  const discover = (query: string, limit?: number) => {
    setSearchQuery(query)
    return discoverMutation.mutate({ query, limit })
  }

  return {
    servers,
    searchQuery,
    isLoading: discoverMutation.isPending,
    error: discoverMutation.error,
    discover,
    setSearchQuery
  }
}

export function useServers() {
  const query = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const servers = await apiClient.getServers()
      return servers
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  return {
    servers: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  }
}

export function useServer(id: string) {
  const query = useQuery({
    queryKey: ['server', id],
    queryFn: async () => {
      const server = await apiClient.getServer(id)
      if (!server) {
        throw new Error('Server not found')
      }
      return server
    },
    enabled: !!id,
  })

  return {
    server: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  }
}

export function useDeployServer() {
  const mutation = useMutation({
    mutationFn: async ({ 
      githubUrl, 
      method = 'auto',
      port 
    }: { 
      githubUrl: string
      method?: 'docker' | 'npx' | 'e2b' | 'auto'
      port?: number 
    }) => {
      const server = await apiClient.deployServer({
        githubUrl,
        method,
        port
      })
      return server
    }
  })

  return {
    deploy: mutation.mutate,
    deployAsync: mutation.mutateAsync,
    isDeploying: mutation.isPending,
    error: mutation.error,
    data: mutation.data
  }
}