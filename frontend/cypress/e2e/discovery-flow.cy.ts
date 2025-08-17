describe('Discovery Flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should navigate to discovery page and search for servers', () => {
    // Navigate to discovery page
    cy.contains('Discover').click()
    cy.url().should('include', '/discover')
    
    // Check page title
    cy.contains('Discover MCP Servers').should('be.visible')
    
    // Search for a server
    cy.get('input[placeholder*="Search"]').type('context')
    cy.get('button[type="submit"]').click()
    
    // Wait for results
    cy.get('[data-testid="server-card"]', { timeout: 10000 }).should('have.length.greaterThan', 0)
    
    // Check server card content
    cy.get('[data-testid="server-card"]').first().within(() => {
      cy.get('h3').should('exist')
      cy.get('p').should('exist')
      cy.contains('Deploy').should('be.visible')
    })
  })

  it('should filter search results', () => {
    cy.visit('/discover')
    
    // Apply language filter
    cy.get('[data-testid="language-filter"]').select('typescript')
    
    // Apply stars filter
    cy.get('[data-testid="min-stars"]').type('10')
    
    // Apply date filter
    cy.get('[data-testid="updated-after"]').type('2024-01-01')
    
    // Submit filters
    cy.get('[data-testid="apply-filters"]').click()
    
    // Verify filters are applied
    cy.get('[data-testid="active-filters"]').should('contain', 'TypeScript')
    cy.get('[data-testid="active-filters"]').should('contain', '10+ stars')
  })

  it('should view server details', () => {
    cy.visit('/discover')
    
    // Click on a server card
    cy.get('[data-testid="server-card"]').first().click()
    
    // Check details modal/page
    cy.get('[data-testid="server-details"]').should('be.visible')
    cy.get('[data-testid="server-details"]').within(() => {
      cy.contains('README').should('be.visible')
      cy.contains('Capabilities').should('be.visible')
      cy.contains('Deploy').should('be.visible')
    })
  })
})

describe('Deployment Flow', () => {
  beforeEach(() => {
    cy.visit('/servers')
  })

  it('should deploy a server using Docker', () => {
    // Open deployment wizard
    cy.contains('Deploy New Server').click()
    
    // Select Docker deployment
    cy.get('[data-testid="deployment-method"]').within(() => {
      cy.contains('Docker').click()
    })
    
    // Fill in configuration
    cy.get('input[name="serverName"]').type('test-server')
    cy.get('input[name="port"]').type('3000')
    
    // Add environment variables
    cy.get('[data-testid="add-env-var"]').click()
    cy.get('input[name="env-key-0"]').type('API_KEY')
    cy.get('input[name="env-value-0"]').type('test-key')
    
    // Deploy
    cy.get('[data-testid="deploy-button"]').click()
    
    // Wait for deployment
    cy.get('[data-testid="deployment-status"]', { timeout: 30000 })
      .should('contain', 'Success')
    
    // Verify server appears in list
    cy.get('[data-testid="server-list"]').should('contain', 'test-server')
  })

  it('should manage running servers', () => {
    // Check server status
    cy.get('[data-testid="server-card"]').first().within(() => {
      cy.get('[data-testid="server-status"]').should('contain', 'Running')
      
      // Stop server
      cy.get('[data-testid="stop-server"]').click()
    })
    
    // Confirm stop
    cy.get('[data-testid="confirm-stop"]').click()
    
    // Verify server stopped
    cy.get('[data-testid="server-card"]').first().within(() => {
      cy.get('[data-testid="server-status"]').should('contain', 'Stopped')
      
      // Start server again
      cy.get('[data-testid="start-server"]').click()
    })
    
    // Verify server started
    cy.get('[data-testid="server-card"]').first().within(() => {
      cy.get('[data-testid="server-status"]').should('contain', 'Running')
    })
  })

  it('should view server logs', () => {
    cy.get('[data-testid="server-card"]').first().within(() => {
      cy.get('[data-testid="view-logs"]').click()
    })
    
    // Check logs viewer
    cy.get('[data-testid="logs-viewer"]').should('be.visible')
    cy.get('[data-testid="logs-content"]').should('not.be.empty')
    
    // Filter logs
    cy.get('input[placeholder*="Filter"]').type('error')
    cy.get('[data-testid="logs-content"]').should('contain', 'error')
    
    // Close logs
    cy.get('[data-testid="close-logs"]').click()
    cy.get('[data-testid="logs-viewer"]').should('not.exist')
  })
})

describe('Orchestration Flow', () => {
  beforeEach(() => {
    cy.visit('/orchestrate')
  })

  it('should execute an orchestration task', () => {
    // Enter task prompt
    cy.get('textarea[placeholder*="Describe"]').type(
      'Fetch documentation for React hooks and summarize the main concepts'
    )
    
    // Select servers/tools
    cy.get('[data-testid="select-servers"]').click()
    cy.get('[data-testid="server-option"]').first().click()
    
    // Execute task
    cy.get('[data-testid="execute-task"]').click()
    
    // Wait for execution to start
    cy.get('[data-testid="execution-status"]').should('contain', 'Running')
    
    // Check for streaming updates
    cy.get('[data-testid="execution-log"]').should('be.visible')
    cy.get('[data-testid="execution-step"]').should('have.length.greaterThan', 0)
    
    // Wait for completion
    cy.get('[data-testid="execution-status"]', { timeout: 60000 })
      .should('contain', 'Completed')
    
    // Check results
    cy.get('[data-testid="execution-results"]').should('be.visible')
    cy.get('[data-testid="execution-results"]').should('contain', 'React')
  })

  it('should build and execute a workflow', () => {
    cy.visit('/orchestrate/workflow')
    
    // Add workflow nodes
    cy.get('[data-testid="add-tool-node"]').click()
    cy.get('[data-testid="node-tool-1"]').should('be.visible')
    
    // Configure node
    cy.get('[data-testid="node-tool-1"]').click()
    cy.get('select[name="tool"]').select('fetch-docs')
    cy.get('input[name="toolArg"]').type('React')
    
    // Add another node
    cy.get('[data-testid="add-tool-node"]').click()
    cy.get('[data-testid="node-tool-2"]').should('be.visible')
    
    // Connect nodes
    cy.get('[data-testid="connect-mode"]').click()
    cy.get('[data-testid="node-start"]').click()
    cy.get('[data-testid="node-tool-1"]').click()
    cy.get('[data-testid="node-tool-1"]').click()
    cy.get('[data-testid="node-tool-2"]').click()
    
    // Save workflow
    cy.get('input[name="workflowName"]').type('Test Workflow')
    cy.get('[data-testid="save-workflow"]').click()
    
    // Execute workflow
    cy.get('[data-testid="execute-workflow"]').click()
    
    // Monitor execution
    cy.get('[data-testid="workflow-execution"]').should('be.visible')
    cy.get('[data-testid="node-status-tool-1"]').should('contain', 'completed')
    cy.get('[data-testid="node-status-tool-2"]').should('contain', 'completed')
  })

  it('should handle orchestration errors gracefully', () => {
    // Enter invalid task
    cy.get('textarea[placeholder*="Describe"]').type('Invalid task that will fail')
    
    // Execute without selecting servers
    cy.get('[data-testid="execute-task"]').click()
    
    // Check for error message
    cy.get('[data-testid="error-message"]').should('contain', 'Please select at least one server')
    
    // Select server and retry with bad configuration
    cy.get('[data-testid="select-servers"]').click()
    cy.get('[data-testid="server-option"]').first().click()
    cy.get('[data-testid="execute-task"]').click()
    
    // Wait for error
    cy.get('[data-testid="execution-status"]', { timeout: 10000 })
      .should('contain', 'Failed')
    
    // Check error details
    cy.get('[data-testid="error-details"]').should('be.visible')
    cy.get('[data-testid="retry-button"]').should('be.visible')
  })
})

describe('User Authentication Flow', () => {
  it('should handle user login', () => {
    cy.visit('/login')
    
    // Fill login form
    cy.get('input[name="email"]').type('user@example.com')
    cy.get('input[name="password"]').type('password123')
    
    // Submit
    cy.get('button[type="submit"]').click()
    
    // Verify redirect to dashboard
    cy.url().should('eq', Cypress.config().baseUrl + '/')
    cy.get('[data-testid="user-menu"]').should('contain', 'user@example.com')
  })

  it('should handle user logout', () => {
    // Login first
    cy.login('user@example.com', 'password123')
    
    // Open user menu
    cy.get('[data-testid="user-menu"]').click()
    
    // Click logout
    cy.get('[data-testid="logout-button"]').click()
    
    // Verify redirect to login
    cy.url().should('include', '/login')
    cy.get('[data-testid="user-menu"]').should('not.exist')
  })
})

describe('Error Recovery', () => {
  it('should recover from network errors', () => {
    // Simulate network failure
    cy.intercept('GET', '/api/servers', { forceNetworkError: true }).as('getServersError')
    
    cy.visit('/servers')
    cy.wait('@getServersError')
    
    // Check error message
    cy.get('[data-testid="error-boundary"]').should('contain', 'Something went wrong')
    
    // Retry
    cy.intercept('GET', '/api/servers', { fixture: 'servers.json' }).as('getServersSuccess')
    cy.get('[data-testid="retry-button"]').click()
    cy.wait('@getServersSuccess')
    
    // Verify recovery
    cy.get('[data-testid="server-list"]').should('be.visible')
  })

  it('should handle SSE reconnection', () => {
    cy.visit('/orchestrate')
    
    // Start a task
    cy.get('textarea').type('Test task')
    cy.get('[data-testid="execute-task"]').click()
    
    // Simulate SSE disconnect
    cy.window().then((win) => {
      // Force close EventSource
      const eventSources = win.performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('/stream'))
      if (eventSources.length > 0) {
        // Simulate disconnect
        cy.wait(2000)
      }
    })
    
    // Check reconnection indicator
    cy.get('[data-testid="reconnecting-indicator"]').should('be.visible')
    
    // Wait for reconnection
    cy.get('[data-testid="connected-indicator"]', { timeout: 10000 }).should('be.visible')
  })
})