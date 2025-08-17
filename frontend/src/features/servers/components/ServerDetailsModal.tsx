'use client'

import { useState } from 'react'
import { Modal } from '@/shared/components/Modal'
import { MCPServer, ServerStatus } from '@/core/domain/entities/MCPServer'
import { useServerManager } from '@/features/servers/hooks/useServerManager'
import { useToast } from '@/shared/hooks/useToast'
import { 
  Server, 
  Activity,
  Settings,
  GitBranch,
  Package,
  Shield,
  Key,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  Power,
  Copy,
  ExternalLink,
  Terminal,
  Code,
  FileText,
  Cpu,
  MemoryStick,
  Network,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServerDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  server: MCPServer | null
}

const statusConfig = {
  [ServerStatus.RUNNING]: {
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/20',
    label: 'Running'
  },
  [ServerStatus.STOPPED]: {
    icon: XCircle,
    color: 'text-gray-400',
    bg: 'bg-gray-500/20',
    label: 'Stopped'
  },
  [ServerStatus.DEPLOYING]: {
    icon: RefreshCw,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    label: 'Deploying'
  },
  [ServerStatus.FAILED]: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    label: 'Failed'
  },
  [ServerStatus.DISCOVERED]: {
    icon: Activity,
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    label: 'Discovered'
  }
}

export function ServerDetailsModal({ isOpen, onClose, server }: ServerDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'capabilities' | 'logs' | 'metrics'>('overview')
  const { startServer, stopServer, restartServer, deleteServer } = useServerManager()
  const toast = useToast()

  if (!server) return null

  const status = statusConfig[server.status]
  const StatusIcon = status.icon

  const handleAction = async (action: 'start' | 'stop' | 'restart' | 'delete') => {
    try {
      switch (action) {
        case 'start':
          await startServer(server.id)
          toast.success('Server Started', `${server.name} is now running`)
          break
        case 'stop':
          await stopServer(server.id)
          toast.success('Server Stopped', `${server.name} has been stopped`)
          break
        case 'restart':
          await restartServer(server.id)
          toast.success('Server Restarted', `${server.name} has been restarted`)
          break
        case 'delete':
          if (confirm(`Are you sure you want to delete ${server.name}?`)) {
            await deleteServer(server.id)
            toast.success('Server Deleted', `${server.name} has been removed`)
            onClose()
          }
          break
      }
    } catch (error) {
      toast.error(
        'Action Failed',
        error instanceof Error ? error.message : 'An error occurred'
      )
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied', 'Copied to clipboard')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Server Details"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className={cn(
              "p-3 rounded-lg",
              status.bg
            )}>
              <Server className={cn("w-8 h-8", status.color)} />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{server.name}</h3>
              <div className="flex items-center space-x-4 mt-2">
                <div className={cn(
                  "flex items-center space-x-1.5 px-2 py-1 rounded-full",
                  status.bg
                )}>
                  <StatusIcon className={cn("w-4 h-4", status.color)} />
                  <span className={cn("text-sm", status.color)}>
                    {status.label}
                  </span>
                </div>
                <span className="text-sm text-gray-400">
                  {server.deployMethod}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {server.status === ServerStatus.STOPPED && (
              <button
                onClick={() => handleAction('start')}
                className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
                title="Start Server"
              >
                <Power className="w-5 h-5" />
              </button>
            )}
            {server.status === ServerStatus.RUNNING && (
              <>
                <button
                  onClick={() => handleAction('stop')}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                  title="Stop Server"
                >
                  <Power className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleAction('restart')}
                  className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                  title="Restart Server"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={() => handleAction('delete')}
              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
              title="Delete Server"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10">
          <div className="flex space-x-6">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'capabilities', label: 'Capabilities', icon: Package },
              { id: 'logs', label: 'Logs', icon: Terminal },
              { id: 'metrics', label: 'Metrics', icon: Cpu }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "pb-3 px-1 flex items-center space-x-2 border-b-2 transition-colors",
                    activeTab === tab.id
                      ? "border-purple-500 text-white"
                      : "border-transparent text-gray-400 hover:text-gray-200"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* GitHub URL */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div className="flex items-center space-x-3">
                  <GitBranch className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Repository</p>
                    <p className="font-mono text-sm">{server.githubUrl}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(server.githubUrl)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <a
                    href={server.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Server Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center space-x-2 mb-2">
                    <Key className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-400">Server ID</p>
                  </div>
                  <p className="font-mono text-xs truncate">{server.id}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-400">Created</p>
                  </div>
                  <p className="text-sm">{server.createdAt?.toLocaleDateString()}</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center space-x-2 mb-2">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-400">Deploy Method</p>
                  </div>
                  <p className="text-sm">{server.deployMethod}</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-400">Version</p>
                  </div>
                  <p className="text-sm">{server.version || 'Unknown'}</p>
                </div>
              </div>

              {/* Description */}
              {server.description && (
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-400">Description</p>
                  </div>
                  <p className="text-sm text-gray-200">{server.description}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'capabilities' && (
            <div className="space-y-4">
              {server.capabilities ? (
                <>
                  {/* Tools */}
                  {server.capabilities.tools && server.capabilities.tools.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Tools</h4>
                      <div className="space-y-2">
                        {server.capabilities.tools.map((tool, index) => (
                          <div key={index} className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Code className="w-4 h-4 text-purple-400" />
                                <span className="font-medium">{tool.name}</span>
                              </div>
                            </div>
                            {tool.description && (
                              <p className="text-sm text-gray-400 mt-1">{tool.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resources */}
                  {server.capabilities.resources && server.capabilities.resources.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Resources</h4>
                      <div className="space-y-2">
                        {server.capabilities.resources.map((resource, index) => (
                          <div key={index} className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-center space-x-2">
                              <Database className="w-4 h-4 text-blue-400" />
                              <span className="font-medium">{resource.name}</span>
                            </div>
                            {resource.description && (
                              <p className="text-sm text-gray-400 mt-1">{resource.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prompts */}
                  {server.capabilities.prompts && server.capabilities.prompts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Prompts</h4>
                      <div className="space-y-2">
                        {server.capabilities.prompts.map((prompt, index) => (
                          <div key={index} className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-center space-x-2">
                              <Terminal className="w-4 h-4 text-green-400" />
                              <span className="font-medium">{prompt.name}</span>
                            </div>
                            {prompt.description && (
                              <p className="text-sm text-gray-400 mt-1">{prompt.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Package className="w-12 h-12 mb-3" />
                  <p>No capabilities information available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-black/40 p-4 font-mono text-xs">
                <div className="space-y-1">
                  <div className="text-gray-400">[2024-01-20 10:23:45] Server started</div>
                  <div className="text-green-400">[2024-01-20 10:23:46] Listening on port 3000</div>
                  <div className="text-blue-400">[2024-01-20 10:23:47] Connected to database</div>
                  <div className="text-yellow-400">[2024-01-20 10:24:12] Warning: High memory usage detected</div>
                  <div className="text-gray-400">[2024-01-20 10:24:15] Processing request from client</div>
                  <div className="text-green-400">[2024-01-20 10:24:16] Request completed successfully</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Showing last 50 lines</p>
                <button className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors">
                  Download Full Logs
                </button>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center space-x-2 mb-3">
                    <Cpu className="w-5 h-5 text-blue-400" />
                    <p className="text-sm text-gray-400">CPU Usage</p>
                  </div>
                  <p className="text-2xl font-semibold">23%</p>
                  <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '23%' }} />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center space-x-2 mb-3">
                    <MemoryStick className="w-5 h-5 text-green-400" />
                    <p className="text-sm text-gray-400">Memory Usage</p>
                  </div>
                  <p className="text-2xl font-semibold">512 MB</p>
                  <p className="text-xs text-gray-400 mt-1">of 2 GB</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center space-x-2 mb-3">
                    <Network className="w-5 h-5 text-purple-400" />
                    <p className="text-sm text-gray-400">Network I/O</p>
                  </div>
                  <p className="text-2xl font-semibold">1.2 MB/s</p>
                  <p className="text-xs text-gray-400 mt-1">↓ 800 KB/s ↑ 400 KB/s</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center space-x-2 mb-3">
                    <Activity className="w-5 h-5 text-yellow-400" />
                    <p className="text-sm text-gray-400">Uptime</p>
                  </div>
                  <p className="text-2xl font-semibold">3d 14h</p>
                  <p className="text-xs text-gray-400 mt-1">Since Jan 17, 2024</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Request Statistics</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Requests</span>
                    <span className="font-mono">12,345</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-mono text-green-400">99.8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Response Time</span>
                    <span className="font-mono">124ms</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}