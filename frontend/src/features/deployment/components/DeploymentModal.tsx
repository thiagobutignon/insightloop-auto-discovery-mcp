'use client'

import { useState } from 'react'
import { Modal } from '@/shared/components/Modal'
import { useDeployServer } from '@/features/discovery/hooks/useDiscovery'
import { useToast } from '@/shared/hooks/useToast'
import { DeploymentMethod } from '@/core/domain/entities/MCPServer'
import { 
  Server, 
  GitBranch, 
  Loader2, 
  Rocket,
  Container,
  Package,
  Cloud,
  Monitor,
  Zap,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeploymentModalProps {
  isOpen: boolean
  onClose: () => void
  githubUrl?: string
}

const deploymentMethods = [
  {
    id: DeploymentMethod.DOCKER,
    name: 'Docker',
    icon: Container,
    description: 'Deploy in an isolated Docker container',
    recommended: true
  },
  {
    id: DeploymentMethod.NPX,
    name: 'NPX',
    icon: Package,
    description: 'Run directly with Node Package Execute',
    recommended: false
  },
  {
    id: DeploymentMethod.E2B,
    name: 'E2B Sandbox',
    icon: Cloud,
    description: 'Deploy in a cloud sandbox environment',
    recommended: false
  },
  {
    id: DeploymentMethod.LOCAL,
    name: 'Local',
    icon: Monitor,
    description: 'Run on your local machine',
    recommended: false
  },
  {
    id: DeploymentMethod.AUTO,
    name: 'Auto-detect',
    icon: Zap,
    description: 'Let the system choose the best method',
    recommended: false
  }
]

export function DeploymentModal({ isOpen, onClose, githubUrl: initialUrl }: DeploymentModalProps) {
  const [githubUrl, setGithubUrl] = useState(initialUrl || '')
  const [selectedMethod, setSelectedMethod] = useState<DeploymentMethod>(DeploymentMethod.DOCKER)
  const [port, setPort] = useState('')
  const [serverName, setServerName] = useState('')
  
  const { deploy, isDeploying } = useDeployServer()
  const toast = useToast()

  const handleDeploy = async () => {
    if (!githubUrl.trim()) {
      toast.error('GitHub URL Required', 'Please enter a valid GitHub repository URL')
      return
    }

    try {
      await deploy({
        githubUrl: githubUrl.trim(),
        method: selectedMethod as any,
        port: port ? parseInt(port) : undefined
      })
      
      toast.success(
        'Deployment Started',
        `Server is being deployed using ${selectedMethod} method`
      )
      
      onClose()
    } catch (error) {
      toast.error(
        'Deployment Failed',
        error instanceof Error ? error.message : 'An error occurred during deployment'
      )
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deploy MCP Server"
      size="lg"
    >
      <div className="space-y-6">
        {/* GitHub URL Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            GitHub Repository URL
          </label>
          <div className="relative">
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/mcp-server-name"
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-lg",
                "bg-black/20 border border-white/10",
                "text-white placeholder-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              )}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter the GitHub URL of the MCP server repository
          </p>
        </div>

        {/* Server Name (Optional) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Server Name (Optional)
          </label>
          <input
            type="text"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            placeholder="My MCP Server"
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "bg-black/20 border border-white/10",
              "text-white placeholder-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            )}
          />
        </div>

        {/* Deployment Method */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Deployment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            {deploymentMethods.map(method => {
              const Icon = method.icon
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    "p-4 rounded-lg text-left",
                    "border transition-all duration-200",
                    "hover:border-purple-500/50",
                    selectedMethod === method.id
                      ? "bg-purple-500/20 border-purple-500"
                      : "bg-white/5 border-white/10"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className="w-5 h-5 mt-0.5 text-purple-400" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{method.name}</p>
                        {method.recommended && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {method.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Port Configuration (for Docker) */}
        {selectedMethod === DeploymentMethod.DOCKER && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Port (Optional)
            </label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="Auto-assign"
              min="1024"
              max="65535"
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "bg-black/20 border border-white/10",
                "text-white placeholder-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              )}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to auto-assign an available port
            </p>
          </div>
        )}

        {/* Warning */}
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-400 font-medium">Important</p>
              <p className="text-xs text-gray-400 mt-1">
                Make sure the repository contains a valid MCP server implementation.
                The deployment process may take a few minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isDeploying}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDeploy}
            disabled={!githubUrl.trim() || isDeploying}
            className={cn(
              "px-6 py-2 rounded-lg flex items-center space-x-2",
              "bg-gradient-to-r from-blue-500 to-purple-600",
              "hover:from-blue-600 hover:to-purple-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deploying...</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                <span>Deploy Server</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}