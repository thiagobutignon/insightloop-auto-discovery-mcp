'use client'

import { useState } from 'react'
import { useServerStore } from '@/presentation/stores/serverStore'
import { useOrchestrationStore } from '@/presentation/stores/orchestrationStore'
import { GlassCard } from '@/shared/components/GlassCard'
import { Cpu, Send, Loader2, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OrchestrationPanel() {
  const [prompt, setPrompt] = useState('')
  const { selectedServer, runningServers } = useServerStore()
  const { loading, error, streamEvents, streamTask, clearCurrentTask } = useOrchestrationStore()

  const server = selectedServer || runningServers[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!server || !prompt.trim()) return

    clearCurrentTask()
    await streamTask(server.id, prompt)
    setPrompt('')
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'connecting':
      case 'discovering':
        return <Clock className="w-4 h-4 text-blue-400" />
      case 'planning':
      case 'executing_step':
        return <Cpu className="w-4 h-4 text-purple-400" />
      case 'tool_result':
      case 'gemini_response':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'error':
      case 'tool_error':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <Zap className="w-4 h-4 text-yellow-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Server Selection */}
      <GlassCard>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Select MCP Server</h3>
          
          {runningServers.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
              <p className="text-gray-400">No servers running</p>
              <p className="text-sm text-gray-500 mt-1">Deploy a server first to start orchestration</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {runningServers.map((s) => (
                <button
                  key={s.id}
                  onClick={() => useServerStore.getState().selectServer(s)}
                  className={cn(
                    'p-3 rounded-lg border transition-all duration-200 text-left',
                    server?.id === s.id
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  )}
                >
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.endpoint}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Prompt Input */}
      {server && (
        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-lg">Orchestration Prompt</h3>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your task for the AI to orchestrate with MCP tools..."
              className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 resize-none"
              disabled={loading}
            />
            
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className={cn(
                "w-full px-6 py-3 rounded-lg font-medium transition-all duration-200",
                "bg-gradient-to-r from-purple-500 to-pink-600",
                "hover:from-purple-600 hover:to-pink-700",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Orchestrating...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Execute with AI
                </>
              )}
            </button>
          </form>
        </GlassCard>
      )}

      {/* Stream Events */}
      {streamEvents.length > 0 && (
        <GlassCard>
          <h3 className="font-semibold text-lg mb-4">Execution Stream</h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {streamEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
              >
                {getEventIcon(event.event)}
                <div className="flex-1">
                  <div className="font-medium text-sm">{event.event}</div>
                  {event.message && (
                    <div className="text-sm text-gray-400 mt-1">{event.message}</div>
                  )}
                  {event.data !== null && event.data !== undefined && (
                    <pre className="text-xs text-gray-500 mt-2 p-2 bg-black/20 rounded overflow-x-auto">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Error Display */}
      {error && (
        <GlassCard className="border-red-500/50 bg-red-500/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </GlassCard>
      )}
    </div>
  )
}