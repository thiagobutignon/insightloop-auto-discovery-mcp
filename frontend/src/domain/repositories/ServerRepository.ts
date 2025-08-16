import { Server } from '../entities/Server'

export interface ServerRepository {
  discover(query?: string): Promise<Server[]>
  getById(id: string): Promise<Server | null>
  deploy(id: string): Promise<Server>
  stop(id: string): Promise<void>
  getRunningServers(): Promise<Server[]>
  updateCapabilities(id: string, capabilities: any): Promise<Server>
}