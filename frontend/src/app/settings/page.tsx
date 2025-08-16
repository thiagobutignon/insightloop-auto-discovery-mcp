import { GlassCard } from '@/shared/components/GlassCard'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-400">
          Configure application settings and preferences
        </p>
      </div>
      
      <GlassCard className="text-center py-12">
        <Settings className="w-16 h-16 mx-auto mb-4 text-gray-500" />
        <p className="text-gray-400">Settings page coming soon</p>
      </GlassCard>
    </div>
  )
}