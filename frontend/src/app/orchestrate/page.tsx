'use client'

import { useState, useRef, useEffect } from 'react'
import { useServers } from '@/features/discovery/hooks/useDiscovery'
import { useOrchestration } from '@/features/orchestration/hooks/useOrchestration'
import { MCPServer, ServerStatus } from '@/core/domain/entities/MCPServer'
import { 
  Send, 
  Bot, 
  Server, 
  Loader2, 
  Sparkles, 
  Terminal,
  Copy,
  Check,
  ChevronDown,
  Clock,
  Zap
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

const examplePrompts = [
  { text: "List all files in the current directory", icon: "📁" },
  { text: "Search for TODO comments in the codebase", icon: "🔍" },
  { text: "Analyze the project structure", icon: "🏗️" },
  { text: "Find and summarize recent commits", icon: "📝" },
  { text: "Check system resources and performance", icon: "📊" }
]

export default function OrchestratePage() {
  const { servers } = useServers()
  const { 
    orchestrate, 
    orchestrateStream,
    isOrchestrating, 
    isStreaming,
    streamOutput,
    history,
    clearHistory 
  } = useOrchestration()
  
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null)
  const [prompt, setPrompt] = useState('')
  const [showHistory, setShowHistory] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const deployedServers = servers.filter(s => s.status === ServerStatus.DEPLOYED)

  useEffect(() => {
    if (deployedServers.length === 1 && !selectedServer) {
      setSelectedServer(deployedServers[0])
    }
  }, [deployedServers, selectedServer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedServer || !prompt.trim() || isOrchestrating || isStreaming) return

    orchestrate({
      serverId: selectedServer.id,
      prompt: prompt.trim()
    })
    
    setPrompt('')
  }

  const handleStreamSubmit = async () => {
    if (!selectedServer || !prompt.trim() || isOrchestrating || isStreaming) return

    await orchestrateStream(selectedServer.id, prompt.trim())
    setPrompt('')
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleExampleClick = (exampleText: string) => {
    setPrompt(exampleText)
    textareaRef.current?.focus()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-500 via-pink-600 to-red-600 bg-clip-text text-transparent">
            AI Orchestration
          </span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Use AI to intelligently orchestrate MCP server tools and execute complex tasks
        </p>
      </div>

      {/* Server Selection */}
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl p-6 backdrop-blur-md bg-glass border-glass-border border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Server className="w-5 h-5 text-purple-400" />
              <span>Select Server</span>
            </h3>
            {selectedServer && (
              <div className="flex items-center space-x-2 text-sm text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Connected</span>
              </div>
            )}
          </div>

          {deployedServers.length === 0 ? (
            <div className="text-center py-8">
              <Server className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No deployed servers available</p>
              <p className="text-sm text-gray-500 mt-1">Deploy a server first to use orchestration</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deployedServers.map((server) => (
                <button
                  key={server.id}
                  onClick={() => setSelectedServer(server)}
                  className={cn(
                    "p-4 rounded-xl text-left transition-all duration-200",
                    "border hover:border-purple-500/50",
                    selectedServer?.id === server.id
                      ? "bg-purple-500/20 border-purple-500"
                      : "bg-white/5 border-white/10"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium mb-1">{server.name}</h4>
                      <p className="text-xs text-gray-400 mb-2">{server.endpoint}</p>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="text-blue-400">
                          {server.capabilities?.tools.length || 0} tools
                        </span>
                        <span className="text-purple-400">
                          {server.capabilities?.resources.length || 0} resources
                        </span>
                      </div>
                    </div>
                    {selectedServer?.id === server.id && (
                      <Check className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orchestration Interface */}
      {selectedServer && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Prompt Input */}
          <div className="rounded-2xl p-6 backdrop-blur-md bg-glass border-glass-border border">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the task you want to accomplish..."
                  className={cn(
                    "w-full px-4 py-3 rounded-xl resize-none",
                    "bg-black/20 border border-white/10",
                    "text-white placeholder-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-purple-500/50",
                    "transition-all duration-200",
                    "min-h-[120px]"
                  )}
                  disabled={isOrchestrating || isStreaming}
                />
              </div>
              
              {/* Example Prompts */}
              <div className="flex flex-wrap gap-2 mb-4">
                {examplePrompts.map((example, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleExampleClick(example.text)}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm",
                      "bg-white/10 hover:bg-white/20",
                      "border border-white/10",
                      "transition-all duration-200",
                      "flex items-center space-x-1"
                    )}
                  >
                    <span>{example.icon}</span>
                    <span>{example.text}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Using <span className="text-purple-400 font-medium">{selectedServer.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleStreamSubmit}
                    disabled={!prompt.trim() || isOrchestrating || isStreaming}
                    className={cn(
                      "px-4 py-2 rounded-lg flex items-center space-x-2",
                      "bg-white/10 hover:bg-white/20",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-all duration-200"
                    )}
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Stream</span>
                  </button>
                  <button
                    type="submit"
                    disabled={!prompt.trim() || isOrchestrating || isStreaming}
                    className={cn(
                      "px-6 py-2 rounded-lg flex items-center space-x-2",
                      "bg-gradient-to-r from-purple-500 to-pink-600",
                      "hover:from-purple-600 hover:to-pink-700",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-all duration-200"
                    )}
                  >
                    {isOrchestrating || isStreaming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Orchestrate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Stream Output */}
          {isStreaming && streamOutput && (
            <div className="rounded-2xl p-6 backdrop-blur-md bg-black/30 border border-purple-500/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-purple-400">Streaming Output</h3>
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              </div>
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                {streamOutput}
              </pre>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="rounded-2xl p-6 backdrop-blur-md bg-glass border-glass-border border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span>History</span>
                  <span className="text-sm text-gray-400">({history.length})</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
                  >
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform",
                      showHistory && "rotate-180"
                    )} />
                  </button>
                  <button
                    onClick={clearHistory}
                    className="px-3 py-1 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {showHistory && (
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      className="p-4 rounded-xl bg-black/20 border border-white/10"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Bot className="w-4 h-4" />
                          <span>{formatDate(item.timestamp)}</span>
                          {item.duration && (
                            <span className="text-purple-400">
                              <Zap className="w-3 h-3 inline mr-1" />
                              {item.duration}ms
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => copyToClipboard(
                            JSON.stringify(item.result, null, 2),
                            item.id
                          )}
                          className="p-1 rounded hover:bg-white/10 transition-all duration-200"
                        >
                          {copied === item.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{item.prompt}</p>
                      {item.error ? (
                        <div className="text-sm text-red-400 bg-red-500/10 p-2 rounded">
                          {item.error}
                        </div>
                      ) : (
                        <pre className="text-xs text-gray-400 bg-black/30 p-2 rounded overflow-x-auto">
                          {typeof item.result === 'string' 
                            ? item.result 
                            : JSON.stringify(item.result, null, 2)
                          }
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}