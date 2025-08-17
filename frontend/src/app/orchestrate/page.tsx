import { OrchestrationPanel } from '@/features/orchestration/components/OrchestrationPanel'
import { FeatureErrorBoundary } from '@/shared/components/FeatureErrorBoundary'

export default function OrchestratePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
          AI Orchestration
        </h1>
        <p className="text-gray-400">
          Use AI to intelligently orchestrate MCP server tools and execute complex tasks
        </p>
      </div>
      
      <FeatureErrorBoundary feature="orchestration">
        <OrchestrationPanel />
      </FeatureErrorBoundary>
    </div>
  )
}