'use client'

import { useState } from 'react'
import { useDiscovery } from '@/features/discovery/hooks/useDiscovery'
import { ServerList } from '@/features/discovery/components/ServerList'
import { Search, Sparkles, GitBranch, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const popularSearches = [
  { query: 'filesystem', label: 'File System', icon: '📁' },
  { query: 'github', label: 'GitHub', icon: '🐙' },
  { query: 'database', label: 'Database', icon: '🗄️' },
  { query: 'ai', label: 'AI Tools', icon: '🤖' },
  { query: 'context', label: 'Context', icon: '🎯' },
  { query: 'search', label: 'Search', icon: '🔍' }
]

export default function DiscoverPage() {
  const [searchInput, setSearchInput] = useState('')
  const { servers, searchQuery, isLoading, error, discover } = useDiscovery()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      discover(searchInput.trim())
    }
  }

  const handleQuickSearch = (query: string) => {
    setSearchInput(query)
    discover(query)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Discover MCP Servers
          </span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Search GitHub for Model Context Protocol servers. Find tools for file systems, 
          databases, APIs, and more.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for MCP servers (e.g., 'filesystem', 'github', 'database')..."
              className={cn(
                "w-full pl-12 pr-32 py-4 rounded-2xl",
                "bg-glass backdrop-blur-md border-glass-border border",
                "text-white placeholder-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-purple-500/50",
                "transition-all duration-200"
              )}
            />
            <button
              type="submit"
              disabled={!searchInput.trim() || isLoading}
              className={cn(
                "absolute right-2 top-1/2 transform -translate-y-1/2",
                "px-6 py-2 rounded-xl font-medium",
                "bg-gradient-to-r from-blue-500 to-purple-600",
                "hover:from-blue-600 hover:to-purple-700",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                "flex items-center space-x-2"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Search Tags */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          <span className="text-sm text-gray-400">Popular:</span>
          {popularSearches.map((item) => (
            <button
              key={item.query}
              onClick={() => handleQuickSearch(item.query)}
              className={cn(
                "px-3 py-1 rounded-full text-sm",
                "bg-white/10 hover:bg-white/20",
                "border border-white/10",
                "transition-all duration-200",
                "flex items-center space-x-1"
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* GitHub URL Input */}
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl p-4 bg-glass/50 backdrop-blur-sm border border-glass-border">
          <div className="flex items-center space-x-2 mb-2">
            <GitBranch className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-gray-300">Direct GitHub URL</span>
          </div>
          <input
            type="url"
            placeholder="https://github.com/username/mcp-server-name"
            className={cn(
              "w-full px-4 py-2 rounded-lg",
              "bg-black/20 border border-white/10",
              "text-white placeholder-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-purple-500/50",
              "text-sm"
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const url = e.currentTarget.value
                if (url.includes('github.com')) {
                  setSearchInput(url)
                  discover(url)
                }
              }
            }}
          />
          <p className="text-xs text-gray-500 mt-1">
            Paste a GitHub repository URL to discover MCP servers directly
          </p>
        </div>
      </div>

      {/* Results Section */}
      <div>
        {searchQuery && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {servers.length > 0 ? (
                <>Results for "<span className="text-purple-400">{searchQuery}</span>"</>
              ) : (
                <>Searching for "<span className="text-purple-400">{searchQuery}</span>"</>
              )}
            </h2>
            {servers.length > 0 && (
              <span className="text-sm text-gray-400">
                Found {servers.length} server{servers.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        <ServerList
          servers={servers}
          isLoading={isLoading}
          error={error}
          emptyMessage={searchQuery ? `No servers found for "${searchQuery}"` : "Search for MCP servers to get started"}
          onDeploy={(server) => {
            console.log('Deploy server:', server)
            // TODO: Implement deployment modal
          }}
          onViewDetails={(server) => {
            console.log('View details:', server)
            // TODO: Implement details modal
          }}
        />
      </div>

      {/* Info Section */}
      {!searchQuery && !isLoading && servers.length === 0 && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-semibold mb-1">Discover</h3>
            <p className="text-sm text-gray-400">
              Search for MCP servers across GitHub repositories
            </p>
          </div>
          <div className="rounded-xl p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="text-2xl mb-2">🚀</div>
            <h3 className="font-semibold mb-1">Deploy</h3>
            <p className="text-sm text-gray-400">
              One-click deployment with Docker, NPX, or E2B
            </p>
          </div>
          <div className="rounded-xl p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold mb-1">Orchestrate</h3>
            <p className="text-sm text-gray-400">
              Use AI to execute complex tasks with deployed servers
            </p>
          </div>
        </div>
      )}
    </div>
  )
}