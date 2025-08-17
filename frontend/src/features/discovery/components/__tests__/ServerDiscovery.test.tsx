import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ServerDiscovery } from '../ServerDiscovery'
import { useServerStore } from '@/presentation/stores/serverStore'
import { Server, ServerStatus } from '@/domain/entities/Server'

// Mock the store
jest.mock('@/presentation/stores/serverStore')

describe('ServerDiscovery', () => {
  const mockDiscoverServers = jest.fn()
  const mockDeployServer = jest.fn()
  
  const mockServers = [
    new Server(
      'server-1',
      'Test Server 1',
      'Description 1',
      'Author 1',
      'https://github.com/test/server1',
      'test/server1:latest',
      'http://localhost:3000',
      ServerStatus.DISCOVERED
    ),
    new Server(
      'server-2',
      'Test Server 2',
      'Description 2',
      'Author 2',
      'https://github.com/test/server2',
      'test/server2:latest',
      'http://localhost:3001',
      ServerStatus.DISCOVERED
    )
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementation
    ;(useServerStore as unknown as jest.Mock).mockReturnValue({
      servers: [],
      loading: false,
      error: null,
      discoverServers: mockDiscoverServers,
      deployServer: mockDeployServer
    })
  })

  describe('Search Functionality', () => {
    it('renders search input and button', () => {
      render(<ServerDiscovery />)
      
      expect(screen.getByPlaceholderText(/search for mcp servers/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /discover/i })).toBeInTheDocument()
    })

    it('calls discoverServers with query on form submit', async () => {
      render(<ServerDiscovery />)
      
      const input = screen.getByPlaceholderText(/search for mcp servers/i)
      const button = screen.getByRole('button', { name: /discover/i })
      
      fireEvent.change(input, { target: { value: 'test query' } })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(mockDiscoverServers).toHaveBeenCalledWith('test query')
      })
    })

    it('shows loading state when searching', () => {
      ;(useServerStore as unknown as jest.Mock).mockReturnValue({
        servers: [],
        loading: true,
        error: null,
        discoverServers: mockDiscoverServers,
        deployServer: mockDeployServer
      })
      
      render(<ServerDiscovery />)
      
      expect(screen.getByText(/searching/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when error exists', () => {
      const errorMessage = 'Failed to discover servers'
      ;(useServerStore as unknown as jest.Mock).mockReturnValue({
        servers: [],
        loading: false,
        error: errorMessage,
        discoverServers: mockDiscoverServers,
        deployServer: mockDeployServer
      })
      
      render(<ServerDiscovery />)
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  describe('Server Display', () => {
    it('displays discovered servers', () => {
      ;(useServerStore as unknown as jest.Mock).mockReturnValue({
        servers: mockServers,
        loading: false,
        error: null,
        discoverServers: mockDiscoverServers,
        deployServer: mockDeployServer
      })
      
      render(<ServerDiscovery />)
      
      expect(screen.getByText('Test Server 1')).toBeInTheDocument()
      expect(screen.getByText('Test Server 2')).toBeInTheDocument()
      expect(screen.getByText('Author 1')).toBeInTheDocument()
      expect(screen.getByText('Author 2')).toBeInTheDocument()
    })

    it('shows empty state when no servers found', () => {
      ;(useServerStore as unknown as jest.Mock).mockReturnValue({
        servers: [],
        loading: false,
        error: null,
        discoverServers: mockDiscoverServers,
        deployServer: mockDeployServer
      })
      
      render(<ServerDiscovery />)
      
      expect(screen.getByText(/no servers discovered yet/i)).toBeInTheDocument()
    })

    it('renders GitHub links for servers', () => {
      ;(useServerStore as unknown as jest.Mock).mockReturnValue({
        servers: mockServers,
        loading: false,
        error: null,
        discoverServers: mockDiscoverServers,
        deployServer: mockDeployServer
      })
      
      render(<ServerDiscovery />)
      
      const githubLinks = screen.getAllByText(/view on github/i)
      expect(githubLinks).toHaveLength(2)
      
      githubLinks.forEach((link, index) => {
        expect(link.closest('a')).toHaveAttribute('href', mockServers[index].githubUrl)
        expect(link.closest('a')).toHaveAttribute('target', '_blank')
      })
    })
  })

  describe('Deployment', () => {
    it('calls deployServer when deploy button is clicked', async () => {
      ;(useServerStore as unknown as jest.Mock).mockReturnValue({
        servers: mockServers,
        loading: false,
        error: null,
        discoverServers: mockDiscoverServers,
        deployServer: mockDeployServer
      })
      
      render(<ServerDiscovery />)
      
      const deployButtons = screen.getAllByRole('button', { name: /deploy/i })
      fireEvent.click(deployButtons[0])
      
      await waitFor(() => {
        expect(mockDeployServer).toHaveBeenCalledWith('server-1')
      })
    })

    it('shows deploying state for specific server', async () => {
      ;(useServerStore as unknown as jest.Mock).mockReturnValue({
        servers: mockServers,
        loading: false,
        error: null,
        discoverServers: mockDiscoverServers,
        deployServer: jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
      })
      
      render(<ServerDiscovery />)
      
      const deployButtons = screen.getAllByRole('button', { name: /deploy/i })
      fireEvent.click(deployButtons[0])
      
      await waitFor(() => {
        expect(screen.getByText(/deploying/i)).toBeInTheDocument()
      })
    })

    it('disables deploy button for servers that cannot be deployed', () => {
      const runningServer = new Server(
        'server-3',
        'Running Server',
        'Description',
        'Author',
        'https://github.com/test/server3',
        'test/server3:latest',
        'http://localhost:3002',
        ServerStatus.RUNNING
      )
      
      ;(useServerStore as unknown as jest.Mock).mockReturnValue({
        servers: [runningServer],
        loading: false,
        error: null,
        discoverServers: mockDiscoverServers,
        deployServer: mockDeployServer
      })
      
      render(<ServerDiscovery />)
      
      const deployButton = screen.getByRole('button', { name: /deploy/i })
      expect(deployButton).toBeDisabled()
    })
  })

  describe('Pagination', () => {
    it('shows pagination controls when there are many servers', () => {
      const manyServers = Array.from({ length: 15 }, (_, i) => 
        new Server(
          `server-${i}`,
          `Server ${i}`,
          `Description ${i}`,
          `Author ${i}`,
          `https://github.com/test/server${i}`,
          `test/server${i}:latest`,
          `http://localhost:${3000 + i}`,
          ServerStatus.DISCOVERED
        )
      )
      
      ;(useServerStore as unknown as jest.Mock).mockReturnValue({
        servers: manyServers,
        loading: false,
        error: null,
        discoverServers: mockDiscoverServers,
        deployServer: mockDeployServer
      })
      
      render(<ServerDiscovery />)
      
      expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
    })

    it('navigates between pages', async () => {
      const manyServers = Array.from({ length: 15 }, (_, i) => 
        new Server(
          `server-${i}`,
          `Server ${i}`,
          `Description ${i}`,
          `Author ${i}`,
          `https://github.com/test/server${i}`,
          `test/server${i}:latest`,
          `http://localhost:${3000 + i}`,
          ServerStatus.DISCOVERED
        )
      )
      
      ;(useServerStore as unknown as jest.Mock).mockReturnValue({
        servers: manyServers,
        loading: false,
        error: null,
        discoverServers: mockDiscoverServers,
        deployServer: mockDeployServer
      })
      
      render(<ServerDiscovery />)
      
      // Initially on page 1
      expect(screen.getByText('Server 0')).toBeInTheDocument()
      expect(screen.queryByText('Server 9')).not.toBeInTheDocument()
      
      // Navigate to page 2
      const nextButton = screen.getByRole('button', { name: /next/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Server 0')).not.toBeInTheDocument()
        expect(screen.getByText('Server 9')).toBeInTheDocument()
      })
      
      // Navigate back to page 1
      const prevButton = screen.getByRole('button', { name: /previous/i })
      fireEvent.click(prevButton)
      
      await waitFor(() => {
        expect(screen.getByText('Server 0')).toBeInTheDocument()
        expect(screen.queryByText('Server 9')).not.toBeInTheDocument()
      })
    })
  })
})