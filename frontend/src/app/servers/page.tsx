'use client'

import { useState } from 'react'
import { useServers, useDeployServer } from '@/features/discovery/hooks/useDiscovery'
import { ServerList } from '@/features/discovery/components/ServerList'
import { ServerDetailsModal } from '@/features/servers/components/ServerDetailsModal'
import { DeploymentModal } from '@/features/deployment/components/DeploymentModal'
import { MCPServer, ServerStatus } from '@/core/domain/entities/MCPServer'
import { 
  Server, 
  Plus, 
  RefreshCw, 
  Activity,
  Cpu,
  HardDrive,
  Network,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ServersPage() {
  const { servers, isLoading, error, refetch } = useServers()
  const { deploy, isDeploying } = useDeployServer()
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null)
  const [showDeployModal, setShowDeployModal] = useState(false)

  const runningServers = servers.filter(s => s.status === ServerStatus.DEPLOYED)
  const failedServers = servers.filter(s => s.status === ServerStatus.FAILED)
  const pendingServers = servers.filter(s => 
    s.status === ServerStatus.DISCOVERED || s.status === ServerStatus.VALIDATED
  )

  const stats = {
    total: servers.length,
    running: runningServers.length,
    failed: failedServers.length,
    pending: pendingServers.length,
    totalTools: servers.reduce((acc, s) => acc + (s.capabilities?.tools.length || 0), 0)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              MCP Servers
            </span>
          </h1>
          <p className="text-gray-400">
            Manage and monitor your deployed Model Context Protocol servers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 rounded-lg flex items-center space-x-2",
              "bg-white/10 hover:bg-white/20 transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowDeployModal(true)}
            className={cn(
              "px-4 py-2 rounded-lg flex items-center space-x-2",
              "bg-gradient-to-r from-blue-500 to-purple-600",
              "hover:from-blue-600 hover:to-purple-700",
              "transition-all duration-200"
            )}
          >
            <Plus className="w-4 h-4" />
            <span>Deploy New</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl p-4 bg-glass backdrop-blur-md border border-glass-border">
          <div className="flex items-center justify-between mb-2">
            <Server className="w-5 h-5 text-blue-400" />
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <p className="text-sm text-gray-400">Total Servers</p>
        </div>
        <div className="rounded-xl p-4 bg-glass backdrop-blur-md border border-glass-border">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-2xl font-bold text-green-400">{stats.running}</span>
          </div>
          <p className="text-sm text-gray-400">Running</p>
        </div>
        <div className="rounded-xl p-4 bg-glass backdrop-blur-md border border-glass-border">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-2xl font-bold text-red-400">{stats.failed}</span>
          </div>
          <p className="text-sm text-gray-400">Failed</p>
        </div>
        <div className="rounded-xl p-4 bg-glass backdrop-blur-md border border-glass-border">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400">{stats.pending}</span>
          </div>
          <p className="text-sm text-gray-400">Pending</p>
        </div>
        <div className="rounded-xl p-4 bg-glass backdrop-blur-md border border-glass-border">
          <div className="flex items-center justify-between mb-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <span className="text-2xl font-bold text-purple-400">{stats.totalTools}</span>
          </div>
          <p className="text-sm text-gray-400">Total Tools</p>
        </div>
      </div>

      {/* Server Tabs */}
      <div className="space-y-6">
        {/* Running Servers */}
        {runningServers.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Running Servers</span>
              <span className="text-sm text-gray-400">({runningServers.length})</span>
            </h2>
            <ServerList
              servers={runningServers}
              onViewDetails={(server) => setSelectedServer(server)}
              onDeploy={(server) => {
                // Handle redeployment
                console.log('Redeploy:', server)
              }}
            />
          </div>
        )}

        {/* Failed Servers */}
        {failedServers.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>Failed Servers</span>
              <span className="text-sm text-gray-400">({failedServers.length})</span>
            </h2>
            <ServerList
              servers={failedServers}
              onViewDetails={(server) => setSelectedServer(server)}
              onDeploy={(server) => {
                deploy({
                  githubUrl: server.githubUrl,
                  method: server.deployMethod as any
                })
              }}
            />
          </div>
        )}

        {/* Pending Servers */}
        {pendingServers.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>Pending Deployment</span>
              <span className="text-sm text-gray-400">({pendingServers.length})</span>
            </h2>
            <ServerList
              servers={pendingServers}
              onViewDetails={(server) => setSelectedServer(server)}
              onDeploy={(server) => {
                deploy({
                  githubUrl: server.githubUrl,
                  method: 'auto'
                })
              }}
            />
          </div>
        )}

        {/* Empty State */}
        {servers.length === 0 && !isLoading && (
          <div className="rounded-2xl p-12 backdrop-blur-md bg-glass border-glass-border border text-center">
            <Server className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Servers Yet</h3>
            <p className="text-gray-500 mb-6">
              Deploy your first MCP server to get started
            </p>
            <button
              onClick={() => setShowDeployModal(true)}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              Deploy Your First Server
            </button>
          </div>
        )}
      </div>

      {/* System Resources (Mock) */}
      <div className="rounded-2xl p-6 backdrop-blur-md bg-glass border-glass-border border">
        <h3 className="text-lg font-semibold mb-4">System Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 flex items-center space-x-2">
                <Cpu className="w-4 h-4" />
                <span>CPU Usage</span>
              </span>
              <span className="text-sm font-medium">23%</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style={{ width: '23%' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 flex items-center space-x-2">
                <HardDrive className="w-4 h-4" />
                <span>Memory</span>
              </span>
              <span className="text-sm font-medium">4.2 GB / 16 GB</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{ width: '26%' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 flex items-center space-x-2">
                <Network className="w-4 h-4" />
                <span>Network</span>
              </span>
              <span className="text-sm font-medium">12.3 MB/s</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full animate-pulse" style={{ width: '45%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ServerDetailsModal
        isOpen={!!selectedServer}
        onClose={() => setSelectedServer(null)}
        server={selectedServer}
      />
      <DeploymentModal
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(false)}
      />
    </div>
  )
}