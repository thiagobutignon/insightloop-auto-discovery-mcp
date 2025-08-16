import { GlassCard } from '@/shared/components/GlassCard'
import { Activity } from 'lucide-react'

export default function MonitoringPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
          Monitoring
        </h1>
        <p className="text-gray-400">
          Monitor system performance and task execution metrics
        </p>
      </div>
      
      <GlassCard className="text-center py-12">
        <Activity className="w-16 h-16 mx-auto mb-4 text-gray-500" />
        <p className="text-gray-400">Monitoring dashboard coming soon</p>
      </GlassCard>
    </div>
  )
}