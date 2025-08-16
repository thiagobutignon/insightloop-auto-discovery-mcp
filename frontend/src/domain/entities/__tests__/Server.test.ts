import { Server, ServerStatus, ServerProtocol } from '../Server'

describe('Server Entity', () => {
  const mockServerData = {
    id: 'server-1',
    name: 'Test Server',
    description: 'A test MCP server',
    author: 'Test Author',
    githubUrl: 'https://github.com/test/server',
    dockerImage: 'test/server:latest',
    endpoint: 'http://localhost:3000',
    status: ServerStatus.DISCOVERED,
    protocol: ServerProtocol.HTTP,
    capabilities: {
      tools: [
        { name: 'tool1', description: 'Test tool 1' },
        { name: 'tool2', description: 'Test tool 2' }
      ],
      resources: [],
      prompts: []
    }
  }

  describe('constructor', () => {
    it('creates a server instance with all properties', () => {
      const server = new Server(
        mockServerData.id,
        mockServerData.name,
        mockServerData.description,
        mockServerData.author,
        mockServerData.githubUrl,
        mockServerData.dockerImage,
        mockServerData.endpoint,
        mockServerData.status,
        mockServerData.protocol,
        mockServerData.capabilities
      )

      expect(server.id).toBe(mockServerData.id)
      expect(server.name).toBe(mockServerData.name)
      expect(server.description).toBe(mockServerData.description)
      expect(server.author).toBe(mockServerData.author)
      expect(server.githubUrl).toBe(mockServerData.githubUrl)
      expect(server.dockerImage).toBe(mockServerData.dockerImage)
      expect(server.endpoint).toBe(mockServerData.endpoint)
      expect(server.status).toBe(mockServerData.status)
      expect(server.protocol).toBe(mockServerData.protocol)
      expect(server.capabilities).toEqual(mockServerData.capabilities)
    })

    it('sets default dates when not provided', () => {
      const server = new Server(
        mockServerData.id,
        mockServerData.name,
        mockServerData.description,
        mockServerData.author,
        mockServerData.githubUrl
      )

      expect(server.createdAt).toBeInstanceOf(Date)
      expect(server.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('fromDiscovery', () => {
    it('creates a server from discovery data', () => {
      const discoveryData = {
        id: 'discovered-1',
        name: 'Discovered Server',
        description: 'A discovered server',
        author: 'Author',
        github_url: 'https://github.com/test/discovered',
        docker_image: 'test/discovered:latest',
        endpoint: 'http://localhost:4000',
        protocol: ServerProtocol.SSE,
        capabilities: { tools: [] }
      }

      const server = Server.fromDiscovery(discoveryData)

      expect(server.id).toBe(discoveryData.id)
      expect(server.name).toBe(discoveryData.name)
      expect(server.githubUrl).toBe(discoveryData.github_url)
      expect(server.status).toBe(ServerStatus.DISCOVERED)
    })

    it('handles both snake_case and camelCase properties', () => {
      const discoveryData = {
        id: 'test-1',
        name: 'Test',
        githubUrl: 'https://github.com/test',
        dockerImage: 'test:latest'
      }

      const server = Server.fromDiscovery(discoveryData)

      expect(server.githubUrl).toBe(discoveryData.githubUrl)
      expect(server.dockerImage).toBe(discoveryData.dockerImage)
    })
  })

  describe('isRunning', () => {
    it('returns true when status is RUNNING', () => {
      const server = new Server(
        'test',
        'Test',
        'Test',
        'Author',
        'https://github.com/test',
        undefined,
        undefined,
        ServerStatus.RUNNING
      )

      expect(server.isRunning()).toBe(true)
    })

    it('returns false when status is not RUNNING', () => {
      const server = new Server(
        'test',
        'Test',
        'Test',
        'Author',
        'https://github.com/test',
        undefined,
        undefined,
        ServerStatus.STOPPED
      )

      expect(server.isRunning()).toBe(false)
    })
  })

  describe('canDeploy', () => {
    it('returns true when status is DISCOVERED', () => {
      const server = new Server(
        'test',
        'Test',
        'Test',
        'Author',
        'https://github.com/test',
        undefined,
        undefined,
        ServerStatus.DISCOVERED
      )

      expect(server.canDeploy()).toBe(true)
    })

    it('returns true when status is STOPPED', () => {
      const server = new Server(
        'test',
        'Test',
        'Test',
        'Author',
        'https://github.com/test',
        undefined,
        undefined,
        ServerStatus.STOPPED
      )

      expect(server.canDeploy()).toBe(true)
    })

    it('returns false when status is RUNNING', () => {
      const server = new Server(
        'test',
        'Test',
        'Test',
        'Author',
        'https://github.com/test',
        undefined,
        undefined,
        ServerStatus.RUNNING
      )

      expect(server.canDeploy()).toBe(false)
    })

    it('returns false when status is ERROR', () => {
      const server = new Server(
        'test',
        'Test',
        'Test',
        'Author',
        'https://github.com/test',
        undefined,
        undefined,
        ServerStatus.ERROR
      )

      expect(server.canDeploy()).toBe(false)
    })
  })

  describe('hasTools', () => {
    it('returns true when server has tools', () => {
      const server = new Server(
        'test',
        'Test',
        'Test',
        'Author',
        'https://github.com/test',
        undefined,
        undefined,
        ServerStatus.RUNNING,
        undefined,
        {
          tools: [{ name: 'tool1' }]
        }
      )

      expect(server.hasTools()).toBe(true)
    })

    it('returns false when server has no tools', () => {
      const server = new Server(
        'test',
        'Test',
        'Test',
        'Author',
        'https://github.com/test',
        undefined,
        undefined,
        ServerStatus.RUNNING,
        undefined,
        {
          tools: []
        }
      )

      expect(server.hasTools()).toBe(false)
    })

    it('returns false when capabilities is undefined', () => {
      const server = new Server(
        'test',
        'Test',
        'Test',
        'Author',
        'https://github.com/test'
      )

      expect(server.hasTools()).toBe(false)
    })
  })
})