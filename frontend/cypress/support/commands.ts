/// <reference types="cypress" />

// Custom commands for E2E tests

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      logout(): Chainable<void>
      deployServer(name: string, method: 'docker' | 'npx' | 'e2b'): Chainable<void>
      waitForServerStatus(serverName: string, status: string): Chainable<void>
      executeOrchestration(prompt: string, servers?: string[]): Chainable<void>
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')
  })
})

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click()
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/login')
})

// Deploy server command
Cypress.Commands.add('deployServer', (name: string, method: 'docker' | 'npx' | 'e2b' = 'docker') => {
  cy.visit('/servers')
  cy.contains('Deploy New Server').click()
  
  // Select deployment method
  cy.get(`[data-testid="method-${method}"]`).click()
  
  // Fill configuration
  cy.get('input[name="serverName"]').type(name)
  
  if (method === 'docker') {
    cy.get('input[name="dockerImage"]').type(`mcp/${name}:latest`)
    cy.get('input[name="port"]').type('3000')
  }
  
  // Deploy
  cy.get('[data-testid="deploy-button"]').click()
  
  // Wait for success
  cy.get('[data-testid="deployment-status"]', { timeout: 30000 })
    .should('contain', 'Success')
})

// Wait for server status
Cypress.Commands.add('waitForServerStatus', (serverName: string, status: string) => {
  cy.get(`[data-testid="server-${serverName}"]`).within(() => {
    cy.get('[data-testid="server-status"]', { timeout: 10000 })
      .should('contain', status)
  })
})

// Execute orchestration task
Cypress.Commands.add('executeOrchestration', (prompt: string, servers: string[] = []) => {
  cy.visit('/orchestrate')
  
  // Enter prompt
  cy.get('textarea[placeholder*="Describe"]').type(prompt)
  
  // Select servers if provided
  if (servers.length > 0) {
    cy.get('[data-testid="select-servers"]').click()
    servers.forEach(server => {
      cy.get(`[data-testid="server-${server}"]`).click()
    })
  }
  
  // Execute
  cy.get('[data-testid="execute-task"]').click()
  
  // Wait for completion
  cy.get('[data-testid="execution-status"]', { timeout: 60000 })
    .should('contain', 'Completed')
})

export {}