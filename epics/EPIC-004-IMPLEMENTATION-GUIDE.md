# EPIC-004: InsightLoop Frontend Implementation Guide

## 🚀 Quick Start Implementation

This epic provides the actual implementation steps and code for building the InsightLoop frontend based on EPIC-003 specifications.

---

## Phase 1: Project Initialization

### Step 1: Create Next.js Project
```bash
# Create the project
npx create-next-app@latest insightloop-frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd insightloop-frontend

# Install core dependencies
yarn install \
  @tanstack/react-query@5.17.9 \
  zustand@4.4.7 \
  react-hook-form@7.48.2 \
  zod@3.22.4 \
  @hookform/resolvers@3.3.4 \
  clsx@2.1.0 \
  tailwind-merge@2.2.0 \
  lucide-react@0.309.0 \
  date-fns@3.2.0 \
  recharts@2.10.4

# Install dev dependencies
yarn install -D \
  @testing-library/react@14.1.2 \
  @testing-library/jest-dom@6.2.0 \
  @testing-library/user-event@14.5.2 \
  jest@29.7.0 \
  jest-environment-jsdom@29.7.0 \
  @types/jest@29.5.11 \
  cypress@13.6.3 \
  @typescript-eslint/eslint-plugin@6.18.1 \
  @typescript-eslint/parser@6.18.1 \
  prettier@3.2.2 \
  prettier-plugin-tailwindcss@0.5.11 \
  husky@8.0.3 \
  lint-staged@15.2.0 \
  commitizen@4.3.0 \
  cz-conventional-changelog@3.3.0
```

### Step 2: Initialize Shadcn/ui
```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# When prompted, use these settings:
# - Would you like to use TypeScript? → Yes
# - Which style would you like to use? → Default
# - Which color would you like to use as base color? → Slate
# - Where is your global CSS file? → src/styles/globals.css
# - Would you like to use CSS variables for colors? → Yes
# - Where is your tailwind.config.js located? → tailwind.config.ts
# - Configure the import alias for components? → @/components
# - Configure the import alias for utils? → @/lib/utils

# Add essential components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add navigation-menu
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add sheet
```

### Step 3: Configure Project Structure
```bash
# Create the Clean Architecture structure
mkdir -p src/{features,core,infrastructure,shared}
mkdir -p src/features/{discovery,deployment,orchestration,monitoring,settings}
mkdir -p src/core/{domain,usecases,repositories}
mkdir -p src/infrastructure/{api,storage,websocket}
mkdir -p src/shared/{components,hooks,utils,types}
mkdir -p src/styles

# Create feature subdirectories
for feature in discovery deployment orchestration monitoring settings; do
  mkdir -p src/features/$feature/{components,hooks,services,stores,types,utils}
done

# Create test directories
mkdir -p __tests__/{unit,integration,e2e}
mkdir -p cypress/{e2e,fixtures,support}
```

---

## Phase 2: Core Configuration Files

### File: `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.1)",
          dark: "rgba(0, 0, 0, 0.2)",
          border: "rgba(255, 255, 255, 0.2)",
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        "gradient": "gradient 8s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        gradient: {
          to: { 'background-position': '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

### File: `src/styles/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
    --radius: 0.5rem;
  }

  .light {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
  }
}

@layer components {
  /* Glassmorphism Base Classes */
  .glass {
    @apply bg-glass backdrop-blur-md border border-glass-border rounded-2xl;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
  }

  .glass-dark {
    @apply bg-glass-dark backdrop-blur-md border border-white/10 rounded-2xl;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .glass-card {
    @apply glass p-6 transition-all duration-300;
  }

  .glass-card:hover {
    @apply transform -translate-y-1;
    box-shadow: 0 12px 40px rgba(31, 38, 135, 0.2);
  }

  /* Gradient Backgrounds */
  .gradient-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .animated-gradient-bg {
    background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
    background-size: 400% 400%;
    animation: gradient 15s ease infinite;
  }

  /* Animated Mesh Background */
  .mesh-gradient {
    background-image: 
      radial-gradient(at 47% 33%, hsl(162, 77%, 40%) 0, transparent 59%),
      radial-gradient(at 82% 65%, hsl(218, 100%, 71%) 0, transparent 55%);
  }
}

@layer utilities {
  /* Custom Animations */
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }

  .animate-pulse-slow {
    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  /* Text Gradients */
  .text-gradient {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600;
  }

  /* Custom Scrollbar */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    @apply bg-transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    @apply bg-gray-400 dark:bg-gray-600 rounded-full;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500 dark:bg-gray-500;
  }
}
```

### File: `src/lib/utils.ts`
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
```

---

## Phase 3: Core Domain Implementation

### File: `src/core/domain/entities/MCPServer.ts`
```typescript
export enum ServerStatus {
  DISCOVERED = 'discovered',
  VALIDATED = 'validated',
  DEPLOYED = 'deployed',
  FAILED = 'failed'
}

export enum DeploymentMethod {
  DOCKER = 'docker',
  NPX = 'npx',
  E2B = 'e2b',
  LOCAL = 'local',
  AUTO = 'auto',
  EXTERNAL = 'external'
}

export interface ServerCapabilities {
  tools: Tool[]
  resources: Resource[]
  protocol: string
  endpoint?: string
}

export interface Tool {
  name: string
  description: string
  parameters?: Record<string, any>
}

export interface Resource {
  name: string
  type: string
  uri: string
}

export class MCPServer {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly githubUrl: string,
    public readonly description: string | null,
    public readonly status: ServerStatus,
    public readonly deployMethod: DeploymentMethod,
    public readonly endpoint: string | null,
    public readonly capabilities: ServerCapabilities | null,
    public readonly createdAt: Date,
    public readonly error: string | null
  ) {}

  static fromJSON(json: any): MCPServer {
    return new MCPServer(
      json.id,
      json.name,
      json.github_url,
      json.description,
      json.status as ServerStatus,
      json.deploy_method as DeploymentMethod,
      json.endpoint,
      json.capabilities,
      new Date(json.created_at),
      json.error
    )
  }

  canDeploy(): boolean {
    return this.status === ServerStatus.DISCOVERED || 
           this.status === ServerStatus.FAILED
  }

  canOrchestrate(): boolean {
    return this.status === ServerStatus.DEPLOYED && 
           this.capabilities !== null &&
           this.capabilities.tools.length > 0
  }

  isRunning(): boolean {
    return this.status === ServerStatus.DEPLOYED && 
           this.endpoint !== null
  }

  getToolCount(): number {
    return this.capabilities?.tools.length ?? 0
  }
}
```

### File: `src/core/repositories/IMCPServerRepository.ts`
```typescript
import { MCPServer } from '../domain/entities/MCPServer'

export interface DiscoveryQuery {
  query: string
  limit?: number
  autoDeloy?: boolean
}

export interface DeploymentRequest {
  githubUrl: string
  method: 'docker' | 'npx' | 'e2b' | 'auto'
  port?: number
}

export interface OrchestrationRequest {
  serverId: string
  prompt: string
  context?: Record<string, any>
}

export interface IMCPServerRepository {
  // Discovery
  discoverServers(query: DiscoveryQuery): Promise<MCPServer[]>
  
  // Server Management
  getServers(): Promise<MCPServer[]>
  getServer(id: string): Promise<MCPServer | null>
  registerServer(name: string, endpoint: string, githubUrl?: string): Promise<MCPServer>
  
  // Deployment
  deployServer(request: DeploymentRequest): Promise<MCPServer>
  
  // Orchestration
  orchestrateTask(request: OrchestrationRequest): Promise<any>
  orchestrateTaskStream(request: OrchestrationRequest): AsyncIterable<any>
  
  // Tools
  invokeTool(serverId: string, toolName: string, args: any): Promise<any>
}
```

### File: `src/core/usecases/DiscoverServers.ts`
```typescript
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
```

---

## Phase 4: Infrastructure Layer

### File: `src/infrastructure/api/MCPApiClient.ts`
```typescript
import { MCPServer } from '@/core/domain/entities/MCPServer'
import { 
  IMCPServerRepository,
  DiscoveryQuery,
  DeploymentRequest,
  OrchestrationRequest 
} from '@/core/repositories/IMCPServerRepository'

export class MCPApiClient implements IMCPServerRepository {
  private baseURL: string
  private defaultHeaders: HeadersInit

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    
    const headers = {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    })

    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }

    return response
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP error! status: ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return await response.json()
    }
    
    return await response.text() as T
  }

  async discoverServers(query: DiscoveryQuery): Promise<MCPServer[]> {
    const response = await this.fetchWithAuth('/api/discover', {
      method: 'POST',
      body: JSON.stringify(query),
    })
    const data = await this.handleResponse<any[]>(response)
    return data.map(item => MCPServer.fromJSON(item))
  }

  async getServers(): Promise<MCPServer[]> {
    const response = await this.fetchWithAuth('/api/servers')
    const data = await this.handleResponse<any[]>(response)
    return data.map(item => MCPServer.fromJSON(item))
  }

  async getServer(id: string): Promise<MCPServer | null> {
    try {
      const response = await this.fetchWithAuth(`/api/servers/${id}`)
      if (response.status === 404) {
        return null
      }
      const data = await this.handleResponse<any>(response)
      return MCPServer.fromJSON(data)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async registerServer(name: string, endpoint: string, githubUrl?: string): Promise<MCPServer> {
    const response = await this.fetchWithAuth('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        endpoint,
        github_url: githubUrl
      }),
    })
    const data = await this.handleResponse<any>(response)
    return MCPServer.fromJSON(data)
  }

  async deployServer(request: DeploymentRequest): Promise<MCPServer> {
    const response = await this.fetchWithAuth('/api/deploy', {
      method: 'POST',
      body: JSON.stringify({
        github_url: request.githubUrl,
        method: request.method,
        port: request.port
      }),
    })
    const data = await this.handleResponse<any>(response)
    return MCPServer.fromJSON(data)
  }

  async orchestrateTask(request: OrchestrationRequest): Promise<any> {
    const response = await this.fetchWithAuth('/api/orchestrate', {
      method: 'POST',
      body: JSON.stringify({
        server_id: request.serverId,
        prompt: request.prompt,
        context: request.context
      }),
    })
    return this.handleResponse(response)
  }

  async *orchestrateTaskStream(request: OrchestrationRequest): AsyncIterable<any> {
    const response = await fetch(`${this.baseURL}/api/orchestrate/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        server_id: request.serverId,
        prompt: request.prompt,
        context: request.context
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              yield data
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async invokeTool(serverId: string, toolName: string, args: any): Promise<any> {
    const response = await this.fetchWithAuth('/api/invoke', {
      method: 'POST',
      body: JSON.stringify({
        server_id: serverId,
        tool_name: toolName,
        args
      }),
    })
    return this.handleResponse(response)
  }
}
```

---

## Phase 5: State Management

### File: `src/features/discovery/stores/discoveryStore.ts`
```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { MCPServer } from '@/core/domain/entities/MCPServer'

interface DiscoveryState {
  // State
  servers: MCPServer[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  filters: {
    status?: string
    hasTools?: boolean
    deployMethod?: string
  }

  // Actions
  setServers: (servers: MCPServer[]) => void
  addServer: (server: MCPServer) => void
  updateServer: (id: string, server: MCPServer) => void
  removeServer: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSearchQuery: (query: string) => void
  setFilters: (filters: any) => void
  clearFilters: () => void
  reset: () => void
}

const initialState = {
  servers: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  filters: {}
}

export const useDiscoveryStore = create<DiscoveryState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setServers: (servers) => set({ servers }),
        
        addServer: (server) => 
          set((state) => ({ 
            servers: [...state.servers, server] 
          })),
        
        updateServer: (id, server) =>
          set((state) => ({
            servers: state.servers.map(s => s.id === id ? server : s)
          })),
        
        removeServer: (id) =>
          set((state) => ({
            servers: state.servers.filter(s => s.id !== id)
          })),
        
        setLoading: (isLoading) => set({ isLoading }),
        
        setError: (error) => set({ error }),
        
        setSearchQuery: (searchQuery) => set({ searchQuery }),
        
        setFilters: (filters) => 
          set((state) => ({ 
            filters: { ...state.filters, ...filters } 
          })),
        
        clearFilters: () => set({ filters: {} }),
        
        reset: () => set(initialState),
      }),
      {
        name: 'discovery-storage',
        partialize: (state) => ({ 
          searchQuery: state.searchQuery,
          filters: state.filters 
        }),
      }
    )
  )
)
```

---

## Phase 6: React Query Setup

### File: `src/lib/queryClient.ts`
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})
```

### File: `src/app/providers.tsx`
```typescript
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { queryClient } from '@/lib/queryClient'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

---

## Phase 7: Testing Setup

### File: `jest.config.js`
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/_*.{js,jsx,ts,tsx}',
  ],
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### File: `jest.setup.js`
```javascript
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return []
  }
}
```

---

## Phase 8: Package.json Scripts

### File: Update `package.json`
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "cypress open",
    "test:e2e:headless": "cypress run",
    "type-check": "tsc --noEmit",
    "prepare": "husky install",
    "commit": "cz"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  },
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  }
}
```

---

## Implementation Checklist

### Week 1-2: Foundation
- [ ] Initialize Next.js project
- [ ] Setup Shadcn/ui components
- [ ] Configure Tailwind with Glassmorphism
- [ ] Create project structure
- [ ] Setup testing framework
- [ ] Configure linting and formatting

### Week 3-4: Core Implementation
- [ ] Implement domain entities
- [ ] Create repository interfaces
- [ ] Build API client
- [ ] Setup state management
- [ ] Configure React Query

### Week 5-6: Features
- [ ] Discovery feature UI
- [ ] Deployment management
- [ ] Server monitoring
- [ ] Orchestration interface

### Week 7-8: Integration
- [ ] Backend API integration
- [ ] SSE implementation
- [ ] Error handling
- [ ] Loading states

### Week 9-10: Polish
- [ ] Unit tests (80% coverage)
- [ ] E2E tests
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment

---

**Note**: This implementation guide provides the actual code structure and setup for the InsightLoop frontend. Follow the steps sequentially and adapt as needed based on specific requirements.