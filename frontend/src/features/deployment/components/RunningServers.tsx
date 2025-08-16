'use client'

import { Server as ServerEntity, ServerProtocol, ServerStatus } from '@/domain/entities/Server'
import { LogsViewer } from '@/features/monitoring/components/LogsViewer'
import { cn } from '@/lib/utils'
import { useServerStore } from '@/presentation/stores/serverStore'
import { GlassCard } from '@/shared/components/GlassCard'
import { Activity, Database, FileText, Loader2, Server, StopCircle, Terminal, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'

export function RunningServers() {
  const { runningServers, loading, error, loadRunningServers, stopServer, selectServer } = useServerStore()
  const [logsServer, setLogsServer] = useState<ServerEntity | null>(null)

  useEffect(() => {
    loadRunningServers()
  }, [])

  const getProtocolBadge = (protocol?: ServerProtocol) => {
    const colors = {
      [ServerProtocol.HTTP]: 'bg-blue-500/20 text-blue-400',
      [ServerProtocol.SSE]: 'bg-green-500/20 text-green-400',
      [ServerProtocol.WEBSOCKET]: 'bg-purple-500/20 text-purple-400',
      [ServerProtocol.STDIO]: 'bg-orange-500/20 text-orange-400',
    }

    return (
      <span className={cn(
        'px-2 py-1 rounded-md text-xs font-medium',
        protocol ? colors[protocol] : 'bg-gray-500/20 text-gray-400'
      )}>
        {protocol || 'Unknown'}
      </span>
    )
  }

  const getStatusIndicator = (status: ServerStatus) => {
    const isRunning = status === ServerStatus.RUNNING
    return (
      <div className="flex items-center gap-2">
        <div className={cn(
          'w-2 h-2 rounded-full',
          isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
        )} />
        <span className="text-sm text-gray-400">{status}</span>
      </div>
    )
  }

  if (loading && runningServers.length === 0) {
    return (
      <GlassCard className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <GlassCard className="border-red-500/50 bg-red-500/10">
          <p className="text-red-400">{error}</p>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {runningServers.map((server) => (
          <GlassCard key={server.id} hoverable>
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-lg flex items-center justify-center">
                    <Server className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{server.name}</h3>
                    {getStatusIndicator(server.status)}
                  </div>
                </div>
                {getProtocolBadge(server.protocol)}
              </div>

              {/* Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Activity className="w-4 h-4" />
                  <span>Endpoint: {server.endpoint || 'N/A'}</span>
                </div>
                {server.containerId && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Server className="w-4 h-4" />
                    <span className="font-mono text-xs">Container: {server.containerId.slice(0, 12)}</span>
                  </div>
                )}
              </div>

              {/* Capabilities */}
              {server.capabilities && (
                <div className="flex flex-wrap gap-2">
                  {server.capabilities.tools && server.capabilities.tools.length > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded-md">
                      <Wrench className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-blue-400">{server.capabilities.tools.length} tools</span>
                    </div>
                  )}
                  {server.capabilities.resources && server.capabilities.resources.length > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 rounded-md">
                      <Database className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-purple-400">{server.capabilities.resources.length} resources</span>
                    </div>
                  )}
                  {server.capabilities.prompts && server.capabilities.prompts.length > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded-md">
                      <FileText className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400">{server.capabilities.prompts.length} prompts</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setLogsServer(server)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <Terminal className="w-4 h-4" />
                  View Logs
                </button>
                <button
                  onClick={() => selectServer(server)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Orchestrate
                </button>
                <button
                  onClick={() => stopServer(server.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    "bg-red-500/20 hover:bg-red-500/30 text-red-400",
                    "flex items-center gap-2"
                  )}
                >
                  <StopCircle className="w-4 h-4" />
                  Stop
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {runningServers.length === 0 && !loading && (
        <GlassCard className="text-center py-12">
          <Server className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400">No servers are currently running</p>
          <p className="text-sm text-gray-500 mt-2">Deploy servers from the Discover page to get started</p>
        </GlassCard>
      )}

      {/* Logs Viewer Modal */}
      {logsServer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh]">
            <LogsViewer 
              server={logsServer} 
              onClose={() => setLogsServer(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}