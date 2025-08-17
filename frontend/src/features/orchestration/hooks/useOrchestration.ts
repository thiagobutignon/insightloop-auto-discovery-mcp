import { useMutation } from '@tanstack/react-query'
import { MCPApiClient } from '@/infrastructure/api/MCPApiClient'
import { MCPServer } from '@/core/domain/entities/MCPServer'
import { useState } from 'react'

const apiClient = new MCPApiClient()

export interface OrchestrationResult {
  id: string
  serverId: string
  prompt: string
  result: any
  timestamp: Date
  duration?: number
  error?: string
}

export function useOrchestration() {
  const [history, setHistory] = useState<OrchestrationResult[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamOutput, setStreamOutput] = useState<string>('')

  const orchestrateMutation = useMutation({
    mutationFn: async ({ 
      serverId, 
      prompt,
      context 
    }: { 
      serverId: string
      prompt: string
      context?: Record<string, any>
    }) => {
      const startTime = Date.now()
      const result = await apiClient.orchestrateTask({
        serverId,
        prompt,
        context
      })
      
      const orchestrationResult: OrchestrationResult = {
        id: `orch-${Date.now()}`,
        serverId,
        prompt,
        result,
        timestamp: new Date(),
        duration: Date.now() - startTime
      }
      
      setHistory(prev => [orchestrationResult, ...prev])
      return orchestrationResult
    }
  })

  const orchestrateStream = async (
    serverId: string,
    prompt: string,
    context?: Record<string, any>
  ) => {
    setIsStreaming(true)
    setStreamOutput('')
    
    try {
      const stream = apiClient.orchestrateTaskStream({
        serverId,
        prompt,
        context
      })
      
      for await (const chunk of stream) {
        setStreamOutput(prev => prev + (chunk.content || chunk.data || JSON.stringify(chunk)))
      }
      
      const result: OrchestrationResult = {
        id: `orch-${Date.now()}`,
        serverId,
        prompt,
        result: streamOutput,
        timestamp: new Date()
      }
      
      setHistory(prev => [result, ...prev])
      return result
    } catch (error) {
      console.error('Stream error:', error)
      throw error
    } finally {
      setIsStreaming(false)
    }
  }

  const invokeTool = useMutation({
    mutationFn: async ({
      serverId,
      toolName,
      args
    }: {
      serverId: string
      toolName: string
      args: any
    }) => {
      const result = await apiClient.invokeTool(serverId, toolName, args)
      return result
    }
  })

  const clearHistory = () => setHistory([])

  return {
    orchestrate: orchestrateMutation.mutate,
    orchestrateAsync: orchestrateMutation.mutateAsync,
    orchestrateStream,
    invokeTool: invokeTool.mutate,
    invokeToolAsync: invokeTool.mutateAsync,
    isOrchestrating: orchestrateMutation.isPending,
    isInvokingTool: invokeTool.isPending,
    isStreaming,
    streamOutput,
    history,
    clearHistory,
    error: orchestrateMutation.error || invokeTool.error
  }
}

export function useServerTools(serverId: string | null) {
  const { invokeTool, invokeToolAsync, isInvokingTool } = useOrchestration()
  
  const callTool = (toolName: string, args: any) => {
    if (!serverId) {
      throw new Error('No server selected')
    }
    return invokeToolAsync({ serverId, toolName, args })
  }

  return {
    callTool,
    isLoading: isInvokingTool
  }
}