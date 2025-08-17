# InsightLoop Frontend

A modern Next.js 15 application for discovering, deploying, and orchestrating Model Context Protocol (MCP) servers with AI-powered automation.

## Features

- **MCP Server Discovery**: Search and discover MCP servers from GitHub repositories
- **Automated Deployment**: Deploy servers with multiple methods (Docker, NPX, E2B, Local)
- **Server Management**: Monitor and control deployed servers with real-time status
- **AI Orchestration**: Create and manage AI-powered workflows using MCP tools
- **Beautiful UI**: Modern glassmorphism design with smooth animations
- **Real-time Updates**: Server-sent events for live status updates

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Architecture**: Clean Architecture (Domain, Infrastructure, Presentation layers)
- **UI Components**: Custom glassmorphism components with Lucide icons

## Project Structure

```
src/
├── app/                      # Next.js app router pages
│   ├── discover/            # Discovery page
│   ├── servers/             # Server management
│   ├── orchestration/       # AI orchestration
│   └── settings/            # Application settings
├── core/                    # Core business logic
│   ├── domain/              # Domain entities and interfaces
│   ├── usecases/            # Business use cases
│   └── repositories/        # Repository interfaces
├── infrastructure/          # External services and implementations
│   ├── api/                 # API clients
│   ├── repositories/        # Repository implementations
│   └── services/            # External service integrations
├── features/                # Feature-specific modules
│   ├── discovery/           # Discovery feature
│   ├── servers/             # Server management feature
│   ├── orchestration/       # Orchestration feature
│   └── deployment/          # Deployment feature
└── shared/                  # Shared components and utilities
    ├── components/          # Reusable UI components
    ├── hooks/               # Custom React hooks
    └── utils/               # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

Build for production:

```bash
npm run build
```

### Production

Run the production build:

```bash
npm start
```

## Key Features

### 1. Server Discovery
- Search MCP servers by GitHub URL
- Browse popular MCP servers
- Filter by capabilities and tags
- View server details and documentation

### 2. Deployment Options
- **Docker**: Isolated container deployment
- **NPX**: Direct Node.js execution
- **E2B**: Cloud sandbox deployment
- **Local**: Local machine execution
- **Auto**: Automatic method selection

### 3. Server Management
- Real-time server status monitoring
- Start/stop/restart controls
- Resource usage metrics
- Log viewing and debugging
- Server capability inspection

### 4. AI Orchestration
- Create multi-step AI workflows
- Chain MCP tool calls
- Visual workflow builder
- Execution monitoring
- Result streaming

### 5. Settings
- API configuration
- Theme customization
- Notification preferences
- Security settings
- Performance tuning

## API Integration

The frontend integrates with a backend API that provides:

- MCP server discovery endpoints
- Deployment orchestration
- Server management operations
- Real-time status updates via SSE
- AI workflow execution

## Architecture

The application follows Clean Architecture principles:

1. **Domain Layer**: Core business entities and logic
2. **Use Cases**: Application-specific business rules
3. **Infrastructure**: External service implementations
4. **Presentation**: UI components and pages

This separation ensures:
- Testability
- Maintainability
- Flexibility to change external dependencies
- Clear separation of concerns

## State Management

- **Zustand**: Global application state
- **React Query**: Server state and caching
- **Local Storage**: User preferences and settings

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.