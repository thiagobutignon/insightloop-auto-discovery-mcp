'use client'

import { useState, useEffect } from 'react'
import { GlassCard } from '@/shared/components/GlassCard'
import { 
  Cpu, 
  HardDrive, 
  Activity, 
  Zap,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResourceStats {
  cpu: {
    usage: number
    cores: number
    temperature?: number
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  disk: {
    used: number
    total: number
    percentage: number
  }
  network: {
    upload: number
    download: number
  }
}

interface ResourceMonitorProps {
  serverId?: string
  realtime?: boolean
  className?: string
}

export function ResourceMonitor({ serverId, realtime = true, className }: ResourceMonitorProps) {
  const [stats, setStats] = useState<ResourceStats>({
    cpu: { usage: 0, cores: 4 },
    memory: { used: 0, total: 16384, percentage: 0 },
    disk: { used: 0, total: 512000, percentage: 0 },
    network: { upload: 0, download: 0 }
  })
  
  const [history, setHistory] = useState<number[]>([])

  useEffect(() => {
    // Simulate resource monitoring
    const interval = setInterval(() => {
      if (realtime) {
        const newStats: ResourceStats = {
          cpu: {
            usage: Math.random() * 100,
            cores: 4,
            temperature: 45 + Math.random() * 20
          },
          memory: {
            used: 8192 + Math.random() * 4096,
            total: 16384,
            percentage: 50 + Math.random() * 30
          },
          disk: {
            used: 256000 + Math.random() * 50000,
            total: 512000,
            percentage: 50 + Math.random() * 20
          },
          network: {
            upload: Math.random() * 1000,
            download: Math.random() * 5000
          }
        }
        
        setStats(newStats)
        setHistory(prev => [...prev.slice(-19), newStats.cpu.usage])
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [realtime, serverId])

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
    return `${(bytes / 1073741824).toFixed(1)} GB`
  }

  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-400'
    if (percentage < 80) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStatusIcon = (percentage: number) => {
    if (percentage < 50) return CheckCircle
    if (percentage < 80) return AlertCircle
    return AlertCircle
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* CPU Usage */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">CPU Usage</div>
              <div className="text-sm text-gray-400">{stats.cpu.cores} cores</div>
            </div>
          </div>
          <div className="text-right">
            <div className={cn("text-2xl font-bold", getStatusColor(stats.cpu.usage))}>
              {stats.cpu.usage.toFixed(1)}%
            </div>
            {stats.cpu.temperature && (
              <div className="text-sm text-gray-400">{stats.cpu.temperature.toFixed(0)}°C</div>
            )}
          </div>
        </div>
        
        {/* CPU History Chart */}
        <div className="h-16 flex items-end gap-1">
          {history.map((value, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-purple-500/50 to-purple-500/20 rounded-t"
              style={{ height: `${value}%` }}
            />
          ))}
        </div>
      </GlassCard>

      {/* Memory Usage */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">Memory</div>
              <div className="text-sm text-gray-400">
                {formatBytes(stats.memory.used * 1048576)} / {formatBytes(stats.memory.total * 1048576)}
              </div>
            </div>
          </div>
          <div className={cn("text-2xl font-bold", getStatusColor(stats.memory.percentage))}>
            {stats.memory.percentage.toFixed(0)}%
          </div>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              stats.memory.percentage < 50 && "bg-gradient-to-r from-green-500 to-emerald-600",
              stats.memory.percentage >= 50 && stats.memory.percentage < 80 && "bg-gradient-to-r from-yellow-500 to-orange-600",
              stats.memory.percentage >= 80 && "bg-gradient-to-r from-red-500 to-pink-600"
            )}
            style={{ width: `${stats.memory.percentage}%` }}
          />
        </div>
      </GlassCard>

      {/* Disk Usage */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">Disk Space</div>
              <div className="text-sm text-gray-400">
                {formatBytes(stats.disk.used * 1048576)} / {formatBytes(stats.disk.total * 1048576)}
              </div>
            </div>
          </div>
          <div className={cn("text-2xl font-bold", getStatusColor(stats.disk.percentage))}>
            {stats.disk.percentage.toFixed(0)}%
          </div>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              stats.disk.percentage < 50 && "bg-gradient-to-r from-green-500 to-emerald-600",
              stats.disk.percentage >= 50 && stats.disk.percentage < 80 && "bg-gradient-to-r from-yellow-500 to-orange-600",
              stats.disk.percentage >= 80 && "bg-gradient-to-r from-red-500 to-pink-600"
            )}
            style={{ width: `${stats.disk.percentage}%` }}
          />
        </div>
      </GlassCard>

      {/* Network Activity */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="font-semibold">Network</div>
          </div>
          <Zap className="w-5 h-5 text-yellow-400" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Upload</span>
            </div>
            <div className="text-lg font-semibold">
              {formatBytes(stats.network.upload * 1024)}/s
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Download</span>
            </div>
            <div className="text-lg font-semibold">
              {formatBytes(stats.network.download * 1024)}/s
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

// Compact version for server cards
export function ResourceStatsCompact({ serverId }: { serverId: string }) {
  const [stats, setStats] = useState({
    cpu: 45,
    memory: 62,
    status: 'healthy' as 'healthy' | 'warning' | 'critical'
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const cpu = Math.random() * 100
      const memory = Math.random() * 100
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (cpu > 80 || memory > 80) status = 'critical'
      else if (cpu > 60 || memory > 60) status = 'warning'
      
      setStats({ cpu, memory, status })
    }, 5000)

    return () => clearInterval(interval)
  }, [serverId])

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <Cpu className={cn(
          "w-4 h-4",
          stats.cpu < 60 && "text-green-400",
          stats.cpu >= 60 && stats.cpu < 80 && "text-yellow-400",
          stats.cpu >= 80 && "text-red-400"
        )} />
        <span>{stats.cpu.toFixed(0)}%</span>
      </div>
      
      <div className="flex items-center gap-2">
        <HardDrive className={cn(
          "w-4 h-4",
          stats.memory < 60 && "text-green-400",
          stats.memory >= 60 && stats.memory < 80 && "text-yellow-400",
          stats.memory >= 80 && "text-red-400"
        )} />
        <span>{stats.memory.toFixed(0)}%</span>
      </div>
      
      <div className={cn(
        "px-2 py-1 rounded-md text-xs font-medium",
        stats.status === 'healthy' && "bg-green-500/20 text-green-400",
        stats.status === 'warning' && "bg-yellow-500/20 text-yellow-400",
        stats.status === 'critical' && "bg-red-500/20 text-red-400"
      )}>
        {stats.status}
      </div>
    </div>
  )
}