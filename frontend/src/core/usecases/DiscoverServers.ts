import { IMCPServerRepository } from '../repositories/IMCPServerRepository'
import { MCPServer } from '../domain/entities/MCPServer'

export class DiscoverServersUseCase {
  constructor(private repository: IMCPServerRepository) {}

  async execute(query: string, limit: number = 10): Promise<MCPServer[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty')
    }

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100')
    }

    const servers = await this.repository.discoverServers({
      query: query.trim(),
      limit
    })

    // Sort by relevance (could be enhanced with scoring algorithm)
    return servers.sort((a, b) => {
      // Prioritize servers with more tools
      const toolDiff = b.getToolCount() - a.getToolCount()
      if (toolDiff !== 0) return toolDiff
      
      // Then by name
      return a.name.localeCompare(b.name)
    })
  }
}