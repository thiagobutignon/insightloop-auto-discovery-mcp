'use client'

import { WorkflowBuilder } from '@/features/orchestration/components/WorkflowBuilder'
import { Workflow, AvailableTool } from '@/types/workflow'

// Mock available tools for demo
const mockTools: AvailableTool[] = [
  {
    name: 'fetch-documentation',
    description: 'Fetch documentation for a library',
    parameters: [
      { name: 'library', type: 'string', required: true },
      { name: 'topic', type: 'string', required: false }
    ]
  },
  {
    name: 'resolve-library-id',
    description: 'Resolve library ID from name',
    parameters: [
      { name: 'libraryName', type: 'string', required: true }
    ]
  },
  {
    name: 'get-library-docs',
    description: 'Get documentation for a library',
    parameters: [
      { name: 'libraryId', type: 'string', required: true },
      { name: 'topic', type: 'string', required: false }
    ]
  },
  {
    name: 'search-code',
    description: 'Search for code examples',
    parameters: [
      { name: 'query', type: 'string', required: true },
      { name: 'language', type: 'string', required: false, default: 'typescript' }
    ]
  },
  {
    name: 'execute-command',
    description: 'Execute a shell command',
    parameters: [
      { name: 'command', type: 'string', required: true }
    ]
  }
]

export default function WorkflowPage() {
  const handleExecute = async (workflow: Workflow) => {
    console.log('Executing workflow:', workflow)
    // Here you would integrate with the orchestration API
  }

  const handleSave = (workflow: Workflow) => {
    console.log('Saving workflow:', workflow)
    // Here you would save to local storage or API
    localStorage.setItem(`workflow-${workflow.id}`, JSON.stringify(workflow))
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
          Visual Workflow Builder
        </h1>
        <p className="text-gray-400">
          Create and execute complex workflows by connecting MCP tools visually
        </p>
      </div>
      
      <WorkflowBuilder
        availableTools={mockTools}
        onExecute={handleExecute}
        onSave={handleSave}
      />
    </div>
  )
}