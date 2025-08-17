'use client'

import { memo, MouseEvent } from 'react'
import { cn } from '@/lib/utils'
import { X, Play, Zap, GitBranch, Check } from 'lucide-react'
import { WorkflowNode as WorkflowNodeType, NodeType } from '@/types/workflow'

interface WorkflowNodeProps {
  node: WorkflowNodeType
  isSelected: boolean
  isDragging: boolean
  isEditing: boolean
  connectionMode: boolean
  onMouseDown: (nodeId: string, e: MouseEvent) => void
  onDelete: (nodeId: string) => void
  onNameChange: (nodeId: string, name: string) => void
  onEditStart: (nodeId: string) => void
  onEditEnd: (nodeId: string) => void
}

const NODE_TYPES = {
  start: { color: 'from-green-500 to-emerald-600', icon: Play },
  tool: { color: 'from-blue-500 to-cyan-600', icon: Zap },
  condition: { color: 'from-purple-500 to-pink-600', icon: GitBranch },
  end: { color: 'from-red-500 to-orange-600', icon: Check }
} as const

// Memoized node component for performance
export const WorkflowNode = memo(function WorkflowNode({
  node,
  isSelected,
  isDragging,
  isEditing,
  connectionMode,
  onMouseDown,
  onDelete,
  onNameChange,
  onEditStart,
  onEditEnd
}: WorkflowNodeProps) {
  const NodeIcon = NODE_TYPES[node.type].icon
  const canDelete = node.type !== 'start' && node.type !== 'end'

  const handleDoubleClick = (e: MouseEvent) => {
    e.stopPropagation()
    onEditStart(node.id)
  }

  const handleNameSubmit = (value: string) => {
    onNameChange(node.id, value)
    onEditEnd(node.id)
  }

  return (
    <div
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
      onMouseDown={(e) => onMouseDown(node.id, e)}
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
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(node.id)
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
            defaultValue={node.name}
            onBlur={(e) => handleNameSubmit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleNameSubmit(e.currentTarget.value)
              }
            }}
            className="w-full bg-white/10 px-2 py-1 rounded text-sm focus:outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div 
            className="text-sm font-medium truncate"
            onDoubleClick={handleDoubleClick}
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
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.node.name === nextProps.node.name &&
    prevProps.node.position.x === nextProps.node.position.x &&
    prevProps.node.position.y === nextProps.node.position.y &&
    prevProps.node.tool === nextProps.node.tool &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.connectionMode === nextProps.connectionMode
  )
})