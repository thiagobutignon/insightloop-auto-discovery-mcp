'use client'

import { useState, useEffect, useRef } from 'react'
import { GlassCard } from '@/shared/components/GlassCard'
import { Server } from '@/domain/entities/Server'
import { 
  Terminal, 
  Download, 
  Trash2, 
  Search, 
  Filter,
  Pause,
  Play,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'debug' | 'success'
  message: string
  source?: string
}

interface LogsViewerProps {
  server: Server
  className?: string
  onClose?: () => void
}

const logLevelColors = {
  info: 'text-blue-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
  debug: 'text-gray-400',
  success: 'text-green-400'
}

const logLevelIcons = {
  info: Info,
  warning: AlertCircle,
  error: XCircle,
  debug: Terminal,
  success: CheckCircle
}

// Mock log generator for demo
const generateMockLogs = (): LogEntry[] => {
  const levels: LogEntry['level'][] = ['info', 'warning', 'error', 'debug', 'success']
  const messages = [
    'Server started successfully on port 3000',
    'Connecting to database...',
    'Database connection established',
    'Received request: GET /api/tools',
    'Processing MCP command: list-tools',
    'Warning: High memory usage detected (85%)',
    'Error: Failed to connect to external service',
    'Debug: Cache hit for key "tools-list"',
    'Successfully executed tool: fetch-documentation',
    'WebSocket connection established',
    'Streaming response initiated',
    'Task completed in 234ms'
  ]
  
  const logs: LogEntry[] = []
  const now = new Date()
  
  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(now.getTime() - (50 - i) * 5000)
    logs.push({
      id: `log-${i}`,
      timestamp,
      level: levels[Math.floor(Math.random() * levels.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      source: `mcp-server-${Math.floor(Math.random() * 3) + 1}`
    })
  }
  
  return logs
}

export function LogsViewer({ server, className, onClose }: LogsViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>(generateMockLogs())
  const [filter, setFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState<LogEntry['level'] | 'all'>('all')
  const [isPaused, setIsPaused] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && !isPaused) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll, isPaused])

  // Simulate real-time logs
  useEffect(() => {
    if (isPaused) return
    
    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        level: (['info', 'warning', 'error', 'debug', 'success'] as const)[Math.floor(Math.random() * 5)],
        message: `Real-time log entry at ${new Date().toLocaleTimeString()}`,
        source: server.name
      }
      setLogs(prev => [...prev.slice(-99), newLog])
    }, 3000)
    
    return () => clearInterval(interval)
  }, [isPaused, server.name])

  const filteredLogs = logs.filter(log => {
    const matchesText = !filter || log.message.toLowerCase().includes(filter.toLowerCase())
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter
    return matchesText && matchesLevel
  })

  const handleCopy = () => {
    const logText = filteredLogs
      .map(log => `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n')
    navigator.clipboard.writeText(logText)
  }

  const handleDownload = () => {
    const logText = filteredLogs
      .map(log => `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] ${log.source || 'system'}: ${log.message}`)
      .join('\n')
    
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${server.name}-logs-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    setLogs([])
  }

  const containerClass = cn(
    'flex flex-col',
    isFullscreen ? 'fixed inset-0 z-50 bg-slate-900' : 'h-full',
    className
  )

  return (
    <div className={containerClass} ref={containerRef}>
      <GlassCard className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/10 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-lg">Logs - {server.name}</h3>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                Live
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Copy logs"
              >
                <Copy className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Download logs"
              >
                <Download className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleClear}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-red-400"
                title="Clear logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="Close"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter logs..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
            
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="debug">Debug</option>
              <option value="success">Success</option>
            </select>
            
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm transition-colors',
                autoScroll ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 hover:bg-white/20'
              )}
            >
              Auto-scroll
            </button>
          </div>
        </div>
        
        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Terminal className="w-12 h-12 mb-3" />
              <p>No logs to display</p>
              <p className="text-xs mt-1">Waiting for log entries...</p>
            </div>
          ) : (
            <>
              {filteredLogs.map((log) => {
                const Icon = logLevelIcons[log.level]
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 hover:bg-white/5 px-2 py-1 rounded group"
                  >
                    <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', logLevelColors[log.level])} />
                    
                    <div className="flex-1 break-all">
                      <span className="text-gray-500">
                        [{log.timestamp.toLocaleTimeString()}]
                      </span>
                      {' '}
                      <span className={cn('font-semibold', logLevelColors[log.level])}>
                        [{log.level.toUpperCase()}]
                      </span>
                      {' '}
                      {log.source && (
                        <>
                          <span className="text-purple-400">{log.source}:</span>
                          {' '}
                        </>
                      )}
                      <span className="text-gray-300">{log.message}</span>
                    </div>
                    
                    <button
                      onClick={() => navigator.clipboard.writeText(log.message)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                      title="Copy message"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
              <div ref={logsEndRef} />
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-white/10 p-3 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              {filteredLogs.length} entries
            </span>
            {isPaused && (
              <span className="flex items-center gap-2 text-yellow-400">
                <Pause className="w-3 h-3" />
                Paused
              </span>
            )}
          </div>
          
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              Info: {filteredLogs.filter(l => l.level === 'info').length}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              Warning: {filteredLogs.filter(l => l.level === 'warning').length}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              Error: {filteredLogs.filter(l => l.level === 'error').length}
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}