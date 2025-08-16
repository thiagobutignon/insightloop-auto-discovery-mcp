import { renderHook, act, waitFor } from '@testing-library/react'
import { useServerStore } from '../serverStore'
import { ServerRepositoryImpl } from '@/infrastructure/repositories/ServerRepositoryImpl'
import { Server, ServerStatus } from '@/domain/entities/Server'

// Mock the repository
jest.mock('@/infrastructure/repositories/ServerRepositoryImpl')

describe('serverStore', () => {
  const mockServer = new Server(
    'test-1',
    'Test Server',
    'A test server',
    'Test Author',
    'https://github.com/test/server',
    'test/server:latest',
    'http://localhost:3000',
    ServerStatus.DISCOVERED
  )

  beforeEach(() => {
    // Reset store state
    useServerStore.setState({
      servers: [],
      runningServers: [],
      selectedServer: null,
      loading: false,
      error: null
    })
    
    // Reset all mocks
    jest.clearAllMocks()
  })

  describe('discoverServers', () => {
    it('fetches and sets servers successfully', async () => {
      const mockDiscoverServers = jest.fn().mockResolvedValue([mockServer])
      ;(ServerRepositoryImpl as jest.Mock).mockImplementation(() => ({
        discover: mockDiscoverServers
      }))

      const { result } = renderHook(() => useServerStore())

      await act(async () => {
        await result.current.discoverServers('test query')
      })

      expect(mockDiscoverServers).toHaveBeenCalledWith('test query')
      expect(result.current.servers).toEqual([mockServer])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('sets error when discovery fails', async () => {
      const mockError = new Error('Discovery failed')
      const mockDiscoverServers = jest.fn().mockRejectedValue(mockError)
      ;(ServerRepositoryImpl as jest.Mock).mockImplementation(() => ({
        discover: mockDiscoverServers
      }))

      const { result } = renderHook(() => useServerStore())

      await act(async () => {
        await result.current.discoverServers('test query')
      })

      expect(result.current.servers).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Discovery failed')
    })

    it('sets loading state during discovery', async () => {
      const mockDiscoverServers = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([mockServer]), 100))
      )
      ;(ServerRepositoryImpl as jest.Mock).mockImplementation(() => ({
        discover: mockDiscoverServers
      }))

      const { result } = renderHook(() => useServerStore())

      act(() => {
        result.current.discoverServers('test query')
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('deployServer', () => {
    it('deploys server and adds to running servers', async () => {
      const deployedServer = new Server(
        'test-1',
        'Test Server',
        'A test server',
        'Test Author',
        'https://github.com/test/server',
        'test/server:latest',
        'http://localhost:3000',
        ServerStatus.RUNNING
      )

      const mockDeploy = jest.fn().mockResolvedValue(deployedServer)
      ;(ServerRepositoryImpl as jest.Mock).mockImplementation(() => ({
        deploy: mockDeploy
      }))

      const { result } = renderHook(() => useServerStore())

      await act(async () => {
        await result.current.deployServer('test-1')
      })

      expect(mockDeploy).toHaveBeenCalledWith('test-1')
      expect(result.current.runningServers).toContainEqual(deployedServer)
      expect(result.current.loading).toBe(false)
    })

    it('sets error when deployment fails', async () => {
      const mockError = new Error('Deployment failed')
      const mockDeploy = jest.fn().mockRejectedValue(mockError)
      ;(ServerRepositoryImpl as jest.Mock).mockImplementation(() => ({
        deploy: mockDeploy
      }))

      const { result } = renderHook(() => useServerStore())

      await act(async () => {
        await result.current.deployServer('test-1')
      })

      expect(result.current.error).toBe('Deployment failed')
      expect(result.current.loading).toBe(false)
    })
  })

  describe('stopServer', () => {
    it('stops server and removes from running servers', async () => {
      const runningServer = new Server(
        'test-1',
        'Test Server',
        'A test server',
        'Test Author',
        'https://github.com/test/server',
        'test/server:latest',
        'http://localhost:3000',
        ServerStatus.RUNNING
      )

      // Set initial state with a running server
      useServerStore.setState({
        runningServers: [runningServer]
      })

      const mockStop = jest.fn().mockResolvedValue(undefined)
      ;(ServerRepositoryImpl as jest.Mock).mockImplementation(() => ({
        stop: mockStop
      }))

      const { result } = renderHook(() => useServerStore())

      await act(async () => {
        await result.current.stopServer('test-1')
      })

      expect(mockStop).toHaveBeenCalledWith('test-1')
      expect(result.current.runningServers).toEqual([])
      expect(result.current.loading).toBe(false)
    })
  })

  describe('loadRunningServers', () => {
    it('loads running servers successfully', async () => {
      const runningServers = [
        new Server(
          'test-1',
          'Test Server 1',
          'A test server',
          'Test Author',
          'https://github.com/test/server1',
          'test/server1:latest',
          'http://localhost:3000',
          ServerStatus.RUNNING
        ),
        new Server(
          'test-2',
          'Test Server 2',
          'Another test server',
          'Test Author',
          'https://github.com/test/server2',
          'test/server2:latest',
          'http://localhost:3001',
          ServerStatus.RUNNING
        )
      ]

      const mockGetRunningServers = jest.fn().mockResolvedValue(runningServers)
      ;(ServerRepositoryImpl as jest.Mock).mockImplementation(() => ({
        getRunningServers: mockGetRunningServers
      }))

      const { result } = renderHook(() => useServerStore())

      await act(async () => {
        await result.current.loadRunningServers()
      })

      expect(mockGetRunningServers).toHaveBeenCalled()
      expect(result.current.runningServers).toEqual(runningServers)
      expect(result.current.loading).toBe(false)
    })
  })

  describe('selectServer', () => {
    it('sets selected server', () => {
      const { result } = renderHook(() => useServerStore())

      act(() => {
        result.current.selectServer(mockServer)
      })

      expect(result.current.selectedServer).toEqual(mockServer)
    })

    it('clears selected server when null is passed', () => {
      const { result } = renderHook(() => useServerStore())

      // First set a server
      act(() => {
        result.current.selectServer(mockServer)
      })

      // Then clear it
      act(() => {
        result.current.selectServer(null)
      })

      expect(result.current.selectedServer).toBe(null)
    })
  })

  describe('clearError', () => {
    it('clears error state', () => {
      // Set initial error state
      useServerStore.setState({
        error: 'Some error'
      })

      const { result } = renderHook(() => useServerStore())

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })
  })
})