'use client'

import { MCPServer, ServerStatus, DeploymentMethod } from '@/core/domain/entities/MCPServer'
import { cn, formatDate } from '@/lib/utils'
import { 
  Server, 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink,
  Cpu,
  GitBranch
} from 'lucide-react'

interface ServerCardProps {
  server: MCPServer
  onDeploy?: (server: MCPServer) => void
  onViewDetails?: (server: MCPServer) => void
  className?: string
}

const statusConfig = {
  [ServerStatus.DISCOVERED]: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    icon: Clock,
    label: 'Discovered'
  },
  [ServerStatus.VALIDATED]: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    icon: CheckCircle,
    label: 'Validated'
  },
  [ServerStatus.DEPLOYED]: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    icon: CheckCircle,
    label: 'Deployed'
  },
  [ServerStatus.FAILED]: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    icon: XCircle,
    label: 'Failed'
  }
}

const deployMethodIcons = {
  [DeploymentMethod.DOCKER]: '🐳',
  [DeploymentMethod.NPX]: '📦',
  [DeploymentMethod.E2B]: '☁️',
  [DeploymentMethod.LOCAL]: '💻',
  [DeploymentMethod.AUTO]: '🤖',
  [DeploymentMethod.EXTERNAL]: '🌐'
}

export function ServerCard({ 
  server, 
  onDeploy, 
  onViewDetails,
  className 
}: ServerCardProps) {
  const status = statusConfig[server.status]
  const StatusIcon = status.icon

  return (
    <div className={cn(
      "rounded-2xl p-6 transition-all duration-300",
      "backdrop-blur-md bg-glass border-glass-border border",
      "shadow-[0_8px_32px_rgba(31,38,135,0.15)]",
      "hover:transform hover:-translate-y-1",
      "hover:shadow-[0_12px_40px_rgba(31,38,135,0.2)]",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{server.name}</h3>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>{deployMethodIcons[server.deployMethod]}</span>
              <span>{server.deployMethod}</span>
            </div>
          </div>
        </div>
        <div className={cn(
          "px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1",
          status.bgColor,
          status.color
        )}>
          <StatusIcon className="w-3 h-3" />
          <span>{status.label}</span>
        </div>
      </div>

      {server.description && (
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
          {server.description}
        </p>
      )}

      <div className="space-y-2 mb-4">
        {server.capabilities && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Package className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">
                {server.capabilities.tools.length} tools
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="text-gray-300">
                {server.capabilities.resources.length} resources
              </span>
            </div>
          </div>
        )}

        {server.endpoint && (
          <div className="flex items-center space-x-1 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-400">Endpoint:</span>
            <span className="text-gray-300 font-mono text-xs">
              {server.endpoint}
            </span>
          </div>
        )}

        {server.githubUrl && (
          <div className="flex items-center space-x-1 text-sm">
            <GitBranch className="w-4 h-4 text-gray-400" />
            <a 
              href={server.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {server.error && (
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
          <p className="text-xs text-red-400">{server.error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <span className="text-xs text-gray-500">
          {formatDate(server.createdAt)}
        </span>
        <div className="flex items-center space-x-2">
          {server.canDeploy() && onDeploy && (
            <button
              onClick={() => onDeploy(server)}
              className="px-3 py-1 text-xs font-medium rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              Deploy
            </button>
          )}
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(server)}
              className="px-3 py-1 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
            >
              Details
            </button>
          )}
        </div>
      </div>
    </div>
  )
}