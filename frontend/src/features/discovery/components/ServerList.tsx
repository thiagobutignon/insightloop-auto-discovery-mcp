'use client'

import { MCPServer } from '@/core/domain/entities/MCPServer'
import { ServerCard } from './ServerCard'
import { Loader2, ServerOff } from 'lucide-react'

interface ServerListProps {
  servers: MCPServer[]
  isLoading?: boolean
  error?: Error | null
  onDeploy?: (server: MCPServer) => void
  onViewDetails?: (server: MCPServer) => void
  emptyMessage?: string
}

export function ServerList({
  servers,
  isLoading = false,
  error = null,
  onDeploy,
  onViewDetails,
  emptyMessage = "No servers found"
}: ServerListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
        <p className="text-gray-400">Loading servers...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl p-8 backdrop-blur-md bg-red-500/10 border border-red-500/20">
        <div className="flex flex-col items-center text-center">
          <ServerOff className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error loading servers</h3>
          <p className="text-sm text-gray-400">{error.message}</p>
        </div>
      </div>
    )
  }

  if (servers.length === 0) {
    return (
      <div className="rounded-2xl p-12 backdrop-blur-md bg-glass border-glass-border border">
        <div className="flex flex-col items-center text-center">
          <ServerOff className="w-12 h-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">{emptyMessage}</h3>
          <p className="text-sm text-gray-500">
            Try searching for MCP servers or deploy a new one
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {servers.map((server) => (
        <ServerCard
          key={server.id}
          server={server}
          onDeploy={onDeploy}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  )
}