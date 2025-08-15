'use client'

import { useState } from 'react'
import { GlassCard } from '@/shared/components/GlassCard'
import { Server } from '@/domain/entities/Server'
import { useServerStore } from '@/presentation/stores/serverStore'
import { 
  Package, 
  Settings, 
  Rocket, 
  CheckCircle, 
  ChevronRight,
  ChevronLeft,
  Loader2,
  Docker,
  Terminal,
  Cloud,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeploymentWizardProps {
  server: Server
  onClose: () => void
  onSuccess?: () => void
}

type DeploymentMethod = 'docker' | 'npx' | 'e2b'
type StepId = 'method' | 'configuration' | 'review' | 'deploying' | 'complete'

interface DeploymentConfig {
  method: DeploymentMethod
  port?: number
  environment?: Record<string, string>
  autoRestart?: boolean
  memoryLimit?: string
  cpuLimit?: string
}

const steps: Array<{ id: StepId; title: string; icon: any }> = [
  { id: 'method', title: 'Deployment Method', icon: Package },
  { id: 'configuration', title: 'Configuration', icon: Settings },
  { id: 'review', title: 'Review & Deploy', icon: Rocket },
  { id: 'deploying', title: 'Deploying', icon: Loader2 },
  { id: 'complete', title: 'Complete', icon: CheckCircle }
]

export function DeploymentWizard({ server, onClose, onSuccess }: DeploymentWizardProps) {
  const [currentStep, setCurrentStep] = useState<StepId>('method')
  const [config, setConfig] = useState<DeploymentConfig>({
    method: 'docker',
    port: 3000,
    autoRestart: true,
    memoryLimit: '512m',
    cpuLimit: '0.5'
  })
  const [deploymentError, setDeploymentError] = useState<string | null>(null)
  const { deployServer } = useServerStore()

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)
  const canGoBack = currentStepIndex > 0 && currentStep !== 'deploying' && currentStep !== 'complete'
  const canGoNext = currentStepIndex < steps.length - 1 && currentStep !== 'deploying'

  const handleNext = async () => {
    if (currentStep === 'review') {
      setCurrentStep('deploying')
      try {
        await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate deployment
        await deployServer(server.id)
        setCurrentStep('complete')
        onSuccess?.()
      } catch (error) {
        setDeploymentError((error as Error).message)
        setCurrentStep('review')
      }
    } else {
      const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1)
      setCurrentStep(steps[nextIndex].id)
    }
  }

  const handleBack = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0)
    setCurrentStep(steps[prevIndex].id)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'method':
        return (
          <div className="space-y-4">
            <p className="text-gray-400 mb-6">
              Choose how you want to deploy {server.name}
            </p>
            
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setConfig({ ...config, method: 'docker' })}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left',
                  config.method === 'docker'
                    ? 'bg-purple-500/20 border-purple-500'
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                )}
              >
                <div className="flex items-start gap-4">
                  <Docker className="w-8 h-8 text-blue-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Docker Container</h3>
                    <p className="text-sm text-gray-400">
                      Deploy as an isolated Docker container with full control over resources
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Recommended</span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">Isolated</span>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setConfig({ ...config, method: 'npx' })}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left',
                  config.method === 'npx'
                    ? 'bg-purple-500/20 border-purple-500'
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                )}
              >
                <div className="flex items-start gap-4">
                  <Terminal className="w-8 h-8 text-green-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">NPX Runner</h3>
                    <p className="text-sm text-gray-400">
                      Run directly using NPX for Node.js-based MCP servers
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">Quick</span>
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">Node.js</span>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setConfig({ ...config, method: 'e2b' })}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left',
                  config.method === 'e2b'
                    ? 'bg-purple-500/20 border-purple-500'
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                )}
              >
                <div className="flex items-start gap-4">
                  <Cloud className="w-8 h-8 text-purple-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">E2B Sandbox</h3>
                    <p className="text-sm text-gray-400">
                      Deploy in a secure cloud sandbox environment
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">Secure</span>
                      <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">Cloud</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )

      case 'configuration':
        return (
          <div className="space-y-6">
            <p className="text-gray-400">
              Configure deployment settings for {server.name}
            </p>

            {config.method === 'docker' && (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Port Mapping</label>
                    <input
                      type="number"
                      value={config.port}
                      onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="3000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Memory Limit</label>
                    <select
                      value={config.memoryLimit}
                      onChange={(e) => setConfig({ ...config, memoryLimit: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="256m">256 MB</option>
                      <option value="512m">512 MB</option>
                      <option value="1g">1 GB</option>
                      <option value="2g">2 GB</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">CPU Limit</label>
                    <select
                      value={config.cpuLimit}
                      onChange={(e) => setConfig({ ...config, cpuLimit: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="0.25">25%</option>
                      <option value="0.5">50%</option>
                      <option value="1">100%</option>
                      <option value="2">200%</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="autoRestart"
                      checked={config.autoRestart}
                      onChange={(e) => setConfig({ ...config, autoRestart: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="autoRestart" className="text-sm">
                      Auto-restart on failure
                    </label>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Environment Variables</label>
              <textarea
                placeholder="KEY=value (one per line)"
                className="w-full h-24 px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                onChange={(e) => {
                  const env: Record<string, string> = {}
                  e.target.value.split('\n').forEach(line => {
                    const [key, value] = line.split('=')
                    if (key && value) env[key] = value
                  })
                  setConfig({ ...config, environment: env })
                }}
              />
            </div>
          </div>
        )

      case 'review':
        return (
          <div className="space-y-6">
            <p className="text-gray-400">
              Review your deployment configuration
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="font-semibold mb-3">Server Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span>{server.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Author:</span>
                    <span>{server.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">GitHub:</span>
                    <a href={server.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      View Repository
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="font-semibold mb-3">Deployment Configuration</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Method:</span>
                    <span className="capitalize">{config.method}</span>
                  </div>
                  {config.port && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Port:</span>
                      <span>{config.port}</span>
                    </div>
                  )}
                  {config.memoryLimit && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Memory:</span>
                      <span>{config.memoryLimit}</span>
                    </div>
                  )}
                  {config.cpuLimit && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">CPU:</span>
                      <span>{(parseFloat(config.cpuLimit) * 100)}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Auto-restart:</span>
                    <span>{config.autoRestart ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              {deploymentError && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>{deploymentError}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'deploying':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <Loader2 className="w-16 h-16 animate-spin text-purple-500" />
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Deploying {server.name}</h3>
              <p className="text-gray-400">This may take a few moments...</p>
            </div>
            <div className="w-full max-w-xs">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-2">Deployment Successful!</h3>
              <p className="text-gray-400 mb-4">{server.name} is now running</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onClose()
                    // Navigate to servers page
                    window.location.href = '/servers'
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transition-all"
                >
                  View Server
                </button>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/10 p-6">
          <h2 className="text-2xl font-bold mb-4">Deploy MCP Server</h2>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.filter(s => s.id !== 'deploying' && s.id !== 'complete').map((step, index) => {
              const Icon = step.icon
              const stepIndex = steps.findIndex(s => s.id === step.id)
              const isActive = stepIndex <= currentStepIndex
              const isCurrent = step.id === currentStep
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    'flex items-center gap-3',
                    isActive ? 'text-white' : 'text-gray-500'
                  )}>
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      isCurrent ? 'bg-purple-500' : isActive ? 'bg-purple-500/30' : 'bg-white/10'
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                  </div>
                  {index < 2 && (
                    <div className={cn(
                      'w-12 sm:w-24 h-0.5 mx-2',
                      isActive ? 'bg-purple-500' : 'bg-white/20'
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
          {renderStepContent()}
        </div>

        {/* Footer */}
        {currentStep !== 'deploying' && currentStep !== 'complete' && (
          <div className="border-t border-white/10 p-6 flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex gap-3">
              {canGoBack && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              
              {canGoNext && (
                <button
                  onClick={handleNext}
                  className={cn(
                    'px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
                    currentStep === 'review'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                  )}
                >
                  {currentStep === 'review' ? 'Deploy' : 'Next'}
                  {currentStep === 'review' ? <Rocket className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}