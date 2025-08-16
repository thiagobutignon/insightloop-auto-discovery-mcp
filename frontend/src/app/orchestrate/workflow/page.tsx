import { WorkflowBuilder } from '@/features/orchestration/components/WorkflowBuilder'

// Mock available tools for demo
const mockTools = [
  {
    name: 'fetch-documentation',
    description: 'Fetch documentation for a library',
    parameters: {
      library: 'string',
      topic: 'string'
    }
  },
  {
    name: 'resolve-library-id',
    description: 'Resolve library ID from name',
    parameters: {
      libraryName: 'string'
    }
  },
  {
    name: 'get-library-docs',
    description: 'Get documentation for a library',
    parameters: {
      libraryId: 'string',
      topic: 'string'
    }
  },
  {
    name: 'search-code',
    description: 'Search for code examples',
    parameters: {
      query: 'string',
      language: 'string'
    }
  },
  {
    name: 'execute-command',
    description: 'Execute a shell command',
    parameters: {
      command: 'string'
    }
  }
]

export default function WorkflowPage() {
  const handleExecute = async (workflow: any) => {
    console.log('Executing workflow:', workflow)
    // Here you would integrate with the orchestration API
  }

  const handleSave = (workflow: any) => {
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