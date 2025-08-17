import { RunningServers } from '@/features/deployment/components/RunningServers'
import { FeatureErrorBoundary } from '@/shared/components/FeatureErrorBoundary'

export default function ServersPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
          Running Servers
        </h1>
        <p className="text-gray-400">
          Manage and monitor your deployed MCP servers
        </p>
      </div>
      
      <FeatureErrorBoundary feature="running-servers">
        <RunningServers />
      </FeatureErrorBoundary>
    </div>
  )
}