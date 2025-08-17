import { ServerDiscovery } from '@/features/discovery/components/ServerDiscovery'
import { FeatureErrorBoundary } from '@/shared/components/FeatureErrorBoundary'

export default function DiscoverPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          Discover MCP Servers
        </h1>
        <p className="text-gray-400">
          Search and discover Model Context Protocol servers from GitHub repositories
        </p>
      </div>
      
      <FeatureErrorBoundary featureName="Discovery">
        <ServerDiscovery />
      </FeatureErrorBoundary>
    </div>
  )
}