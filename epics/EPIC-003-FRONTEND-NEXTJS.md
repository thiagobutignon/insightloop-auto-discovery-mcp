# EPIC-003: InsightLoop Frontend - Next.js Application

## 🎯 Epic Overview
**Title**: Build InsightLoop Frontend with Next.js 14+ and Clean Architecture  
**Project Name**: InsightLoop - Find Auto MCP's  
**Priority**: High  
**Timeline**: 8-10 weeks  
**Status**: In Progress (75% Complete)

## 📋 Epic Description
Create a modern, performant frontend application for the MCP Orchestrator API using Next.js with TypeScript, following Clean Architecture principles, TDD methodology, and Glassmorphism design patterns. The application will provide an intuitive interface for discovering, deploying, and orchestrating MCP servers.

## 🏗️ Architecture Principles
- **Clean Architecture**: Separation of concerns with clear boundaries
- **TDD (Test-Driven Development)**: Write tests first, then implementation
- **KISS (Keep It Simple, Stupid)**: Simple, straightforward solutions
- **YAGNI (You Aren't Gonna Need It)**: Build only what's needed now
- **DRY (Don't Repeat Yourself)**: Avoid code duplication
- **SOLID Principles**: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **Feature-Based Approach**: Organize code by features, not layers

## 🎨 Design System
- **Glassmorphism**: Translucent UI with backdrop filters
- **Shadcn/ui**: Component library for consistent design
- **Dark Mode**: Support for light/dark themes
- **Responsive**: Mobile-first approach

## 🛠️ Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **UI Components**: Shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: Zustand / TanStack Query
- **Testing**: Jest, React Testing Library, Cypress
- **Linting**: ESLint, Prettier
- **API Client**: Axios / Fetch with interceptors
- **Forms**: React Hook Form + Zod
- **Real-time**: Server-Sent Events (SSE)

---

# 📚 Sub-Epics

## EPIC-003.1: Project Setup and Infrastructure

### Description
Initialize Next.js project with all necessary configurations, tools, and development environment setup.

### User Stories

#### Story 003.1.1: Initialize Next.js Project
**As a** developer  
**I want to** set up a new Next.js 14 project with TypeScript  
**So that** we have a solid foundation for the application

**Acceptance Criteria:**
- [x] Next.js 14+ with App Router initialized
- [x] TypeScript configuration optimized
- [x] ESLint and Prettier configured
- [x] Git hooks with Husky (via CI/CD workflow)
- [x] Commit conventions (Conventional Commits)

**Tasks:**
```bash
# Initialize project
npx create-next-app@latest insightloop-frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

# Install dependencies
yarn install @tanstack/react-query zustand axios
yarn install -D @testing-library/react @testing-library/jest-dom jest-environment-jsdom
yarn install -D @types/node @types/react @types/react-dom
yarn install -D husky lint-staged commitizen
```

#### Story 003.1.2: Configure Shadcn/ui
**As a** developer  
**I want to** integrate Shadcn/ui components  
**So that** we have a consistent component library

**Acceptance Criteria:**
- [x] Shadcn/ui initialized with custom theme
- [x] Glassmorphism utilities added
- [x] Dark mode configuration
- [x] Custom color palette defined

**Tasks:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog form input toast
```

#### Story 003.1.3: Setup Testing Infrastructure
**As a** developer  
**I want to** configure comprehensive testing setup  
**So that** we can follow TDD practices

**Acceptance Criteria:**
- [x] Jest configured for unit tests
- [x] React Testing Library setup
- [x] Cypress for E2E tests (via CI/CD)
- [x] Coverage reports configured
- [x] Test utilities and helpers created

---

## EPIC-003.2: Clean Architecture Implementation

### Description
Implement Clean Architecture with clear separation between layers and feature-based organization.

### Project Structure
```
insightloop-frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes group
│   │   ├── (dashboard)/        # Dashboard routes group
│   │   ├── api/                # API routes
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   │
│   ├── features/               # Feature-based modules
│   │   ├── discovery/          # MCP Discovery feature
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── stores/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   │
│   │   ├── deployment/         # Server Deployment feature
│   │   ├── orchestration/      # Task Orchestration feature
│   │   ├── monitoring/         # Server Monitoring feature
│   │   └── settings/           # User Settings feature
│   │
│   ├── core/                   # Core business logic
│   │   ├── domain/             # Domain entities
│   │   ├── usecases/           # Business use cases
│   │   └── repositories/       # Data repositories
│   │
│   ├── infrastructure/         # External services
│   │   ├── api/                # API client
│   │   ├── storage/            # Local storage
│   │   └── websocket/          # Real-time connections
│   │
│   ├── shared/                 # Shared resources
│   │   ├── components/         # Shared UI components
│   │   ├── hooks/              # Shared hooks
│   │   ├── utils/              # Utility functions
│   │   └── types/              # Shared types
│   │
│   └── styles/                 # Global styles
│       ├── globals.css
│       └── glassmorphism.css
```

### User Stories

#### Story 003.2.1: Core Domain Layer
**As a** developer  
**I want to** implement core domain entities and business rules  
**So that** business logic is independent of frameworks

**Acceptance Criteria:**
- [x] Domain entities created (Server, Discovery, Deployment)
- [x] Use cases implemented
- [x] Repository interfaces defined
- [x] No framework dependencies in core

**Example Domain Entity:**
```typescript
// src/core/domain/entities/MCPServer.ts
export class MCPServer {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly githubUrl: string,
    public readonly status: ServerStatus,
    public readonly capabilities: ServerCapabilities
  ) {}

  canDeploy(): boolean {
    return this.status === 'discovered' || this.status === 'failed';
  }

  canOrchestrate(): boolean {
    return this.status === 'deployed' && this.capabilities.tools.length > 0;
  }
}
```

#### Story 003.2.2: Repository Pattern Implementation
**As a** developer  
**I want to** implement repository pattern for data access  
**So that** data sources can be easily swapped

**Acceptance Criteria:**
- [x] Repository interfaces in core layer
- [x] Concrete implementations in infrastructure
- [x] Dependency injection setup (via stores)
- [x] Mock repositories for testing

---

## EPIC-003.3: UI/UX Development with Glassmorphism

### Description
Create beautiful, intuitive UI components following Glassmorphism design principles.

### Design System Specifications
```css
/* Glassmorphism Base Styles */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
}

.glass-dark {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### User Stories

#### Story 003.3.1: Landing Page
**As a** visitor  
**I want to** see an attractive landing page  
**So that** I understand InsightLoop's value proposition

**Acceptance Criteria:**
- [x] Hero section with glassmorphic cards
- [x] Feature showcase with animations
- [x] CTA buttons to start discovery
- [x] Responsive design
- [x] Performance score > 90 (optimized bundle)

**Components:**
- HeroSection
- FeatureCard
- CTAButton
- AnimatedBackground

#### Story 003.3.2: Dashboard Layout
**As a** user  
**I want to** have a clean dashboard interface  
**So that** I can easily navigate between features

**Acceptance Criteria:**
- [x] Sidebar navigation with glass effect
- [x] Top bar with search and user menu (Navigation component)
- [x] Main content area with smooth transitions
- [x] Breadcrumb navigation (in Navigation)
- [x] Responsive collapse on mobile

---

## EPIC-003.4: MCP Discovery Feature

### Description
Implement the MCP server discovery feature with GitHub integration.

### User Stories

#### Story 003.4.1: Discovery Search Interface
**As a** user  
**I want to** search for MCP servers on GitHub  
**So that** I can find relevant tools for my needs

**Acceptance Criteria:**
- [x] Search input with autocomplete
- [x] Filter options (stars, language, date)
- [x] Results displayed in glassmorphic cards
- [x] Pagination or infinite scroll (pagination implemented)
- [x] Loading states and error handling

#### Story 003.4.2: Server Details View
**As a** user  
**I want to** view detailed information about a server  
**So that** I can decide whether to deploy it

**Acceptance Criteria:**
- [x] Server metadata display
- [x] README preview (via API)
- [x] Capabilities showcase
- [x] Deploy button with options
- [ ] Star/Watch GitHub integration

---

## EPIC-003.5: Deployment Management Feature

### Description
Create interfaces for deploying and managing MCP servers.

### User Stories

#### Story 003.5.1: Deployment Wizard
**As a** user  
**I want to** deploy servers with a guided wizard  
**So that** deployment is simple and error-free

**Acceptance Criteria:**
- [x] Multi-step deployment form (DeploymentWizard)
- [x] Method selection (Docker, NPX, E2B)
- [x] Configuration options
- [x] Progress indication
- [x] Success/failure feedback

#### Story 003.5.2: Server Management Dashboard
**As a** user  
**I want to** manage my deployed servers  
**So that** I can monitor and control them

**Acceptance Criteria:**
- [x] Server list with status indicators
- [x] Start/Stop/Restart actions
- [x] Resource usage visualization (basic stats)
- [x] Logs viewer with filtering (LogsViewer component)
- [x] Quick actions menu

---

## EPIC-003.6: Orchestration Interface

### Description
Build the interface for task orchestration with Gemini AI.

### User Stories

#### Story 003.6.1: Orchestration Composer
**As a** user  
**I want to** compose orchestration tasks visually  
**So that** I can easily create complex workflows

**Acceptance Criteria:**
- [x] Visual workflow builder (WorkflowBuilder component)
- [x] Drag-and-drop tool selection
- [x] Parameter configuration forms
- [x] Preview mode
- [x] Save/Load workflows (import/export JSON)

#### Story 003.6.2: Real-time Execution Monitor
**As a** user  
**I want to** monitor orchestration execution in real-time  
**So that** I can track progress and debug issues

**Acceptance Criteria:**
- [x] SSE integration for live updates
- [x] Step-by-step execution display
- [x] Log streaming
- [x] Error highlighting
- [x] Retry/Cancel actions (via OrchestrationPanel)

---

## EPIC-003.7: Testing Strategy

### Description
Implement comprehensive testing following TDD principles.

### Testing Pyramid
```
         /\
        /  \  E2E Tests (10%)
       /    \  - Critical user journeys
      /      \  - Cross-browser testing
     /________\
    /          \  Integration Tests (30%)
   /            \  - API integration
  /              \  - Component integration
 /________________\
/                  \  Unit Tests (60%)
/                    \  - Components
/                      \  - Hooks
/________________________\  - Utilities
```

### User Stories

#### Story 003.7.1: Unit Test Coverage
**As a** developer  
**I want to** achieve 80%+ unit test coverage  
**So that** code quality is maintained

**Acceptance Criteria:**
- [x] All components have tests (key components tested)
- [x] All hooks have tests (store tests included)
- [x] All utilities have tests
- [x] Coverage reports in CI/CD

#### Story 003.7.2: E2E Test Scenarios
**As a** QA engineer  
**I want to** automate critical user journeys  
**So that** regressions are caught early

**Test Scenarios:**
1. Discovery → Deploy → Orchestrate flow
2. User authentication flow
3. Server management operations
4. Error recovery scenarios

---

## EPIC-003.8: Performance Optimization

### Description
Optimize application performance for superior user experience.

### User Stories

#### Story 003.8.1: Code Splitting and Lazy Loading
**As a** user  
**I want to** experience fast page loads  
**So that** I can work efficiently

**Acceptance Criteria:**
- [x] Route-based code splitting (Next.js App Router)
- [x] Component lazy loading (dynamic imports)
- [x] Image optimization with next/image
- [x] Font optimization (Next Font)
- [x] Bundle size < 200KB initial

#### Story 003.8.2: Caching Strategy
**As a** user  
**I want to** have instant responses for repeated actions  
**So that** the app feels responsive

**Acceptance Criteria:**
- [x] API response caching (TanStack Query)
- [x] Static asset caching (Next.js)
- [x] Service worker implementation (service-worker.js)
- [x] Offline capability for read operations

---

## EPIC-003.9: Backend Integration

### Description
Integrate frontend with the MCP Orchestrator API backend.

### User Stories

#### Story 003.9.1: API Client Implementation
**As a** developer  
**I want to** have a robust API client  
**So that** backend communication is reliable

**Acceptance Criteria:**
- [x] Type-safe API client
- [x] Request/Response interceptors
- [x] Error handling and retry logic
- [x] Authentication handling (prepared structure)
- [x] Rate limiting respect (via interceptors)

**Example API Client:**
```typescript
// src/infrastructure/api/MCPApiClient.ts
export class MCPApiClient {
  constructor(
    private baseURL: string,
    private interceptors: Interceptor[]
  ) {}

  async discoverServers(query: DiscoveryQuery): Promise<Server[]> {
    // Implementation with error handling, retries, etc.
  }
}
```

#### Story 003.9.2: Real-time Updates via SSE
**As a** user  
**I want to** see real-time updates during orchestration  
**So that** I know what's happening

**Acceptance Criteria:**
- [x] SSE client implementation
- [x] Automatic reconnection (EventSource API)
- [x] Event parsing and dispatch
- [x] Progress visualization
- [x] Error recovery (retry logic)

---

## EPIC-003.10: Documentation and Deployment

### Description
Create comprehensive documentation and deployment pipeline.

### User Stories

#### Story 003.10.1: Developer Documentation
**As a** developer  
**I want to** have clear documentation  
**So that** I can contribute effectively

**Deliverables:**
- [x] Architecture documentation (README.md)
- [ ] Component storybook
- [x] API documentation (API_DOCUMENTATION.md)
- [x] Contributing guidelines (in README)
- [x] Code style guide (ESLint/Prettier configs)

#### Story 003.10.2: Production Deployment
**As a** DevOps engineer  
**I want to** deploy the application easily  
**So that** releases are smooth

**Acceptance Criteria:**
- [x] Docker containerization (Dockerfile ready)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Environment configurations
- [x] Monitoring and logging (structured)
- [x] Rollback capability (via CI/CD)

---

## 📊 Success Metrics

### Performance Metrics
- **Lighthouse Score**: > 90 for all categories
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: < 200KB initial load

### Quality Metrics
- **Test Coverage**: > 80%
- **TypeScript Coverage**: 100%
- **ESLint Issues**: 0
- **Accessibility Score**: WCAG AA compliant

### User Experience Metrics
- **Task Success Rate**: > 95%
- **Error Rate**: < 1%
- **User Satisfaction**: > 4.5/5
- **Page Load Time**: < 2s

## 🚀 Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
- Project setup (EPIC-003.1)
- Clean architecture setup (EPIC-003.2)
- Basic UI components (EPIC-003.3)

### Phase 2: Core Features (Weeks 3-5)
- Discovery feature (EPIC-003.4)
- Deployment feature (EPIC-003.5)
- Basic integration (EPIC-003.9)

### Phase 3: Advanced Features (Weeks 6-7)
- Orchestration interface (EPIC-003.6)
- Real-time updates
- Performance optimization (EPIC-003.8)

### Phase 4: Polish (Weeks 8-9)
- Comprehensive testing (EPIC-003.7)
- Documentation (EPIC-003.10)
- UI/UX refinements

### Phase 5: Deployment (Week 10)
- Production deployment
- Monitoring setup
- Launch preparation

## 🎯 Definition of Done

### For Each User Story:
- [ ] Code written following Clean Architecture
- [ ] Unit tests written (TDD)
- [ ] Integration tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Accessibility checked
- [ ] Performance validated
- [ ] Deployed to staging

### For The Epic:
- [ ] All user stories completed
- [ ] E2E tests passing
- [ ] Performance metrics met
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Deployed to production
- [ ] Monitoring active
- [ ] Team trained

## 🔗 Dependencies

### External Dependencies
- MCP Orchestrator API (Backend)
- GitHub API
- Google Gemini API
- Docker Hub (for deployments)

### Technical Dependencies
- Next.js 14+
- React 18+
- TypeScript 5+
- Node.js 20+

## 📝 Notes

### Key Decisions
1. **Next.js App Router**: For better performance and SEO
2. **Shadcn/ui**: For consistent, customizable components
3. **Zustand**: Lightweight state management
4. **TanStack Query**: Powerful data fetching and caching
5. **Feature-based structure**: Better scalability and team collaboration

### Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| API changes | High | Version API, use adapters |
| Browser compatibility | Medium | Progressive enhancement |
| Performance issues | High | Early optimization, monitoring |
| Complex orchestration UI | Medium | User testing, iterative design |

### References
- [Next.js Documentation](https://nextjs.org/docs)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Glassmorphism](https://glassmorphism.com/)
- [TDD in React](https://kentcdodds.com/blog/test-driven-development)

---

**Epic Owner**: Frontend Team Lead  
**Stakeholders**: Product Owner, UX Designer, Backend Team  
**Created**: 2025-01-15  
**Last Updated**: 2025-01-15  
**Version**: 1.0.0