'use client'

import { useState, useRef, useEffect } from 'react'
import { GlassCard } from '@/shared/components/GlassCard'
import { 
  Plus, 
  Trash2, 
  Play, 
  Save, 
  Download,
  Upload,
  GitBranch,
  Settings,
  Zap,
  ArrowRight,
  Copy,
  Edit2,
  Check,
  X,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowNode {
  id: string
  type: 'start' | 'tool' | 'condition' | 'end'
  name: string
  description?: string
  tool?: string
  args?: Record<string, any>
  position: { x: number; y: number }
  connections: string[]
}

interface WorkflowEdge {
  id: string
  source: string
  target: string
  label?: string
}

interface Workflow {
  id: string
  name: string
  description?: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  createdAt: Date
  updatedAt: Date
}

interface WorkflowBuilderProps {
  availableTools?: Array<{
    name: string
    description: string
    parameters?: Record<string, any>
  }>
  onExecute?: (workflow: Workflow) => void
  onSave?: (workflow: Workflow) => void
}

const NODE_TYPES = {
  start: { color: 'from-green-500 to-emerald-600', icon: Play },
  tool: { color: 'from-blue-500 to-cyan-600', icon: Zap },
  condition: { color: 'from-purple-500 to-pink-600', icon: GitBranch },
  end: { color: 'from-red-500 to-orange-600', icon: Check }
}

export function WorkflowBuilder({ availableTools = [], onExecute, onSave }: WorkflowBuilderProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [workflow, setWorkflow] = useState<Workflow>({
    id: `workflow-${Date.now()}`,
    name: 'New Workflow',
    nodes: [
      {
        id: 'start',
        type: 'start',
        name: 'Start',
        position: { x: 100, y: 200 },
        connections: []
      },
      {
        id: 'end',
        type: 'end',
        name: 'End',
        position: { x: 700, y: 200 },
        connections: []
      }
    ],
    edges: [],
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [connectionMode, setConnectionMode] = useState(false)
  const [connectionSource, setConnectionSource] = useState<string | null>(null)
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  // Handle node dragging
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    if (connectionMode) {
      handleConnectionClick(nodeId)
      return
    }
    
    setDraggedNode(nodeId)
    setSelectedNode(nodeId)
    
    const startX = e.clientX
    const startY = e.clientY
    const node = workflow.nodes.find(n => n.id === nodeId)
    if (!node) return
    
    const startPosX = node.position.x
    const startPosY = node.position.y

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      
      setWorkflow(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => 
          n.id === nodeId 
            ? { ...n, position: { x: startPosX + deltaX, y: startPosY + deltaY } }
            : n
        ),
        updatedAt: new Date()
      }))
    }

    const handleMouseUp = () => {
      setDraggedNode(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Add new node
  const addNode = (type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      name: type === 'tool' ? 'Select Tool' : type.charAt(0).toUpperCase() + type.slice(1),
      position: { 
        x: 300 + Math.random() * 200, 
        y: 150 + Math.random() * 100 
      },
      connections: []
    }

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      updatedAt: new Date()
    }))
  }

  // Delete node
  const deleteNode = (nodeId: string) => {
    if (nodeId === 'start' || nodeId === 'end') return
    
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      edges: prev.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
      updatedAt: new Date()
    }))
    
    setSelectedNode(null)
  }

  // Handle connections
  const handleConnectionClick = (nodeId: string) => {
    if (!connectionSource) {
      setConnectionSource(nodeId)
    } else if (connectionSource !== nodeId) {
      // Create edge
      const newEdge: WorkflowEdge = {
        id: `edge-${Date.now()}`,
        source: connectionSource,
        target: nodeId
      }
      
      setWorkflow(prev => ({
        ...prev,
        edges: [...prev.edges, newEdge],
        nodes: prev.nodes.map(n => 
          n.id === connectionSource
            ? { ...n, connections: [...n.connections, nodeId] }
            : n
        ),
        updatedAt: new Date()
      }))
      
      setConnectionSource(null)
      setConnectionMode(false)
    }
  }

  // Execute workflow
  const handleExecute = async () => {
    setIsExecuting(true)
    try {
      await onExecute?.(workflow)
      // Simulate execution
      await new Promise(resolve => setTimeout(resolve, 2000))
    } finally {
      setIsExecuting(false)
    }
  }

  // Save workflow
  const handleSave = () => {
    onSave?.(workflow)
  }

  // Export workflow
  const exportWorkflow = () => {
    const dataStr = JSON.stringify(workflow, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${workflow.name.replace(/\s+/g, '-')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // Import workflow
  const importWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        setWorkflow({
          ...imported,
          updatedAt: new Date()
        })
      } catch (error) {
        console.error('Failed to import workflow:', error)
      }
    }
    reader.readAsText(file)
  }

  // Render edges
  const renderEdges = () => {
    return workflow.edges.map(edge => {
      const sourceNode = workflow.nodes.find(n => n.id === edge.source)
      const targetNode = workflow.nodes.find(n => n.id === edge.target)
      
      if (!sourceNode || !targetNode) return null
      
      const x1 = sourceNode.position.x + 60
      const y1 = sourceNode.position.y + 30
      const x2 = targetNode.position.x
      const y2 = targetNode.position.y + 30
      
      // Calculate control points for curved line
      const dx = x2 - x1
      const dy = y2 - y1
      const cx = x1 + dx / 2
      const cy = y1 + dy / 2
      
      return (
        <svg
          key={edge.id}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3, 0 6"
                fill="rgba(255, 255, 255, 0.5)"
              />
            </marker>
          </defs>
          <path
            d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
          />
        </svg>
      )
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={workflow.name}
              onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
              className="text-xl font-semibold bg-transparent border-b border-white/20 focus:outline-none focus:border-purple-500"
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => addNode('tool')}
                className="px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Tool
              </button>
              <button
                onClick={() => addNode('condition')}
                className="px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors flex items-center gap-2"
              >
                <GitBranch className="w-4 h-4" />
                Add Condition
              </button>
              <button
                onClick={() => setConnectionMode(!connectionMode)}
                className={cn(
                  "px-3 py-2 rounded-lg transition-colors flex items-center gap-2",
                  connectionMode
                    ? "bg-yellow-500/30 text-yellow-400"
                    : "bg-white/10 hover:bg-white/20"
                )}
              >
                <ArrowRight className="w-4 h-4" />
                {connectionMode ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Save Workflow"
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              onClick={exportWorkflow}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Export Workflow"
            >
              <Download className="w-5 h-5" />
            </button>
            <label className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <Upload className="w-5 h-5" />
              <input
                type="file"
                accept="application/json"
                onChange={importWorkflow}
                className="hidden"
              />
            </label>
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
                "bg-gradient-to-r from-green-500 to-emerald-600",
                "hover:from-green-600 hover:to-emerald-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Execute
                </>
              )}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Canvas */}
      <GlassCard className="relative h-[500px] overflow-hidden">
        <div 
          ref={canvasRef}
          className="relative w-full h-full"
          style={{ 
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          {/* Render edges */}
          {renderEdges()}
          
          {/* Render nodes */}
          {workflow.nodes.map(node => {
            const NodeIcon = NODE_TYPES[node.type].icon
            const isSelected = selectedNode === node.id
            const isDragging = draggedNode === node.id
            const isEditing = editingNode === node.id
            
            return (
              <div
                key={node.id}
                className={cn(
                  "absolute w-32 cursor-move transition-all",
                  isDragging && "opacity-75",
                  isSelected && "ring-2 ring-purple-500",
                  connectionMode && "cursor-crosshair"
                )}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  zIndex: isDragging ? 100 : 10
                }}
                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
              >
                <div className={cn(
                  "p-3 rounded-lg backdrop-blur-md border",
                  isSelected ? "border-purple-500" : "border-white/20",
                  "bg-gradient-to-br",
                  NODE_TYPES[node.type].color,
                  "bg-opacity-20"
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <NodeIcon className="w-4 h-4 text-white" />
                    {node.type !== 'start' && node.type !== 'end' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNode(node.id)
                        }}
                        className="p-1 hover:bg-red-500/30 rounded transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={node.name}
                      onChange={(e) => setWorkflow(prev => ({
                        ...prev,
                        nodes: prev.nodes.map(n => 
                          n.id === node.id ? { ...n, name: e.target.value } : n
                        )
                      }))}
                      onBlur={() => setEditingNode(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingNode(null)}
                      className="w-full bg-white/10 px-2 py-1 rounded text-sm focus:outline-none"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div 
                      className="text-sm font-medium truncate"
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        setEditingNode(node.id)
                      }}
                    >
                      {node.name}
                    </div>
                  )}
                  
                  {node.type === 'tool' && node.tool && (
                    <div className="text-xs text-white/70 mt-1 truncate">
                      {node.tool}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </GlassCard>

      {/* Node Properties */}
      {selectedNode && selectedNode !== 'start' && selectedNode !== 'end' && (
        <GlassCard className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Node Properties
          </h3>
          
          {(() => {
            const node = workflow.nodes.find(n => n.id === selectedNode)
            if (!node || node.type === 'start' || node.type === 'end') return null
            
            return (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={node.name}
                    onChange={(e) => setWorkflow(prev => ({
                      ...prev,
                      nodes: prev.nodes.map(n => 
                        n.id === selectedNode ? { ...n, name: e.target.value } : n
                      )
                    }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                {node.type === 'tool' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Tool</label>
                    <select
                      value={node.tool || ''}
                      onChange={(e) => setWorkflow(prev => ({
                        ...prev,
                        nodes: prev.nodes.map(n => 
                          n.id === selectedNode ? { ...n, tool: e.target.value } : n
                        )
                      }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select a tool</option>
                      {availableTools.map(tool => (
                        <option key={tool.name} value={tool.name}>
                          {tool.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={node.description || ''}
                    onChange={(e) => setWorkflow(prev => ({
                      ...prev,
                      nodes: prev.nodes.map(n => 
                        n.id === selectedNode ? { ...n, description: e.target.value } : n
                      )
                    }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                </div>
              </div>
            )
          })()}
        </GlassCard>
      )}
    </div>
  )
}