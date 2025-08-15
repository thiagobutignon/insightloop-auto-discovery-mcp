'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { GlassCard } from './GlassCard'
import { 
  Search, 
  Server, 
  Cpu, 
  Activity,
  Home,
  Settings
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/discover', label: 'Discover', icon: Search },
  { href: '/servers', label: 'Servers', icon: Server },
  { href: '/orchestrate', label: 'Orchestrate', icon: Cpu },
  { href: '/monitoring', label: 'Monitoring', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <GlassCard className="w-full p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">IL</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                InsightLoop
              </h1>
              <p className="text-xs text-muted-foreground">Find Auto MCP's</p>
            </div>
          </Link>

          <nav className="flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200',
                    'hover:bg-white/10',
                    isActive && 'bg-white/20 font-semibold'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">API Connected</span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}