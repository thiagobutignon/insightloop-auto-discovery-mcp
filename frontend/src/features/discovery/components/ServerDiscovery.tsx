'use client'

import { useState, useMemo } from 'react'
import { useServerStore } from '@/presentation/stores/serverStore'
import { GlassCard } from '@/shared/components/GlassCard'
import { Search, Github, Loader2, Package, User, Star, GitFork, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DiscoveryFilters, FilterOptions } from './DiscoveryFilters'

export function ServerDiscovery() {
  const [query, setQuery] = useState('')
  const { servers, loading, error, discoverServers, deployServer } = useServerStore()
  const [deployingId, setDeployingId] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterOptions>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  // Filter and paginate servers
  const filteredServers = useMemo(() => {
    let filtered = [...servers]
    
    // Apply filters (mock implementation - would be done server-side in production)
    if (filters.minStars && filters.minStars > 0) {
      // Filter by minimum stars (would need stars data from API)
      filtered = filtered.filter(s => true) // Placeholder
    }
    
    if (filters.language && filters.language !== 'All Languages') {
      // Filter by language (would need language data from API)
      filtered = filtered.filter(s => true) // Placeholder
    }
    
    // Sort
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name)
          default:
            return 0
        }
      })
    }
    
    return filtered
  }, [servers, filters])

  const paginatedServers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredServers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredServers, currentPage])

  const totalPages = Math.ceil(filteredServers.length / itemsPerPage)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    await discoverServers(query)
  }

  const handleDeploy = async (serverId: string) => {
    setDeployingId(serverId)
    try {
      await deployServer(serverId)
    } finally {
      setDeployingId(null)
    }
  }

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <GlassCard>
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for MCP servers on GitHub..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "px-6 py-3 rounded-lg font-medium transition-all duration-200",
              "bg-gradient-to-r from-blue-500 to-purple-600",
              "hover:from-blue-600 hover:to-purple-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Discover
              </>
            )}
          </button>
        </form>
      </GlassCard>

      <DiscoveryFilters onFilterChange={handleFilterChange} />

      {error && (
        <GlassCard className="border-red-500/50 bg-red-500/10">
          <p className="text-red-400">{error}</p>
        </GlassCard>
      )}

      {/* Results Summary */}
      {filteredServers.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredServers.length)} of {filteredServers.length} servers
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedServers.map((server) => (
          <GlassCard key={server.id} hoverable className="flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{server.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>{server.author}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-4 flex-1">{server.description}</p>

            <div className="flex items-center justify-between">
              <a
                href={server.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </a>

              <button
                onClick={() => handleDeploy(server.id)}
                disabled={deployingId === server.id || !server.canDeploy()}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  "bg-gradient-to-r from-green-500 to-emerald-600",
                  "hover:from-green-600 hover:to-emerald-700",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-2"
                )}
              >
                {deployingId === server.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  'Deploy'
                )}
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {servers.length === 0 && !loading && (
        <GlassCard className="text-center py-12">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400">No servers discovered yet. Try searching for MCP servers!</p>
        </GlassCard>
      )}
    </div>
  )
}