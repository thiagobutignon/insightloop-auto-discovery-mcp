'use client'

import { useEffect } from 'react'
import { useServerStore } from '@/presentation/stores/serverStore'
import { useOrchestrationStore } from '@/presentation/stores/orchestrationStore'
import { GlassCard } from '@/shared/components/GlassCard'
import { Server, Cpu, Search, Activity, TrendingUp, Package, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function Home() {
  const { runningServers, loadRunningServers } = useServerStore()
  const { tasks } = useOrchestrationStore()

  useEffect(() => {
    loadRunningServers()
  }, [])

  const stats = [
    {
      title: 'Running Servers',
      value: runningServers.length,
      icon: Server,
      color: 'from-green-500 to-emerald-600',
      href: '/servers'
    },
    {
      title: 'Tasks Executed',
      value: tasks.length,
      icon: Cpu,
      color: 'from-purple-500 to-pink-600',
      href: '/orchestrate'
    },
    {
      title: 'Total Tools',
      value: runningServers.reduce((acc, s) => acc + (s.capabilities?.tools?.length || 0), 0),
      icon: Package,
      color: 'from-blue-500 to-cyan-600',
      href: '/servers'
    },
    {
      title: 'Active Sessions',
      value: tasks.filter(t => t.isActive()).length,
      icon: Activity,
      color: 'from-orange-500 to-red-600',
      href: '/monitoring'
    }
  ]

  const features = [
    {
      icon: Search,
      title: 'Discover',
      description: 'Find MCP servers from GitHub repositories',
      href: '/discover',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      icon: Server,
      title: 'Deploy',
      description: 'Run MCP servers in Docker containers',
      href: '/servers',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      icon: Cpu,
      title: 'Orchestrate',
      description: 'Use AI to execute complex tasks',
      href: '/orchestrate',
      gradient: 'from-purple-500 to-pink-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            InsightLoop
          </span>
        </h1>
        <p className="text-xl text-gray-400 mb-2">Find Auto MCP's</p>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Discover, deploy, and orchestrate Model Context Protocol servers with AI-powered automation
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <GlassCard hoverable className="cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center',
                    `bg-gradient-to-br ${stat.color}`
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.title}</div>
              </GlassCard>
            </Link>
          )
        })}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Link key={feature.title} href={feature.href}>
              <GlassCard hoverable className="h-full cursor-pointer group">
                <div className="space-y-4">
                  <div className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center',
                    `bg-gradient-to-br ${feature.gradient}`,
                    'group-hover:scale-110 transition-transform duration-200'
                  )}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>
                  <div className="flex items-center text-sm text-purple-400 group-hover:text-purple-300 transition-colors">
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </GlassCard>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Quick Actions</h2>
          <Zap className="w-6 h-6 text-yellow-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/discover?query=context">
            <button className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-600/20 hover:from-blue-500/30 hover:to-purple-600/30 transition-all duration-200 text-left">
              <div className="font-medium mb-1">Discover Context MCP</div>
              <div className="text-sm text-gray-400">Search for Context7 MCP server</div>
            </button>
          </Link>
          
          <Link href="/orchestrate">
            <button className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-600/20 hover:from-purple-500/30 hover:to-pink-600/30 transition-all duration-200 text-left">
              <div className="font-medium mb-1">Start AI Orchestration</div>
              <div className="text-sm text-gray-400">Execute tasks with deployed servers</div>
            </button>
          </Link>
        </div>
      </GlassCard>

      {/* Recent Activity */}
      {tasks.length > 0 && (
        <GlassCard>
          <h2 className="text-2xl font-semibold mb-4">Recent Tasks</h2>
          <div className="space-y-2">
            {tasks.slice(-3).reverse().map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-sm font-medium">{task.prompt.slice(0, 50)}...</div>
                    <div className="text-xs text-gray-500">{task.createdAt.toLocaleTimeString()}</div>
                  </div>
                </div>
                <div className={cn(
                  'px-2 py-1 rounded-md text-xs font-medium',
                  task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  task.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                )}>
                  {task.status}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}