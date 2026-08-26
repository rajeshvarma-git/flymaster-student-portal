/// <reference types="cypress" />

// Custom commands for common test actions
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-cy attribute.
       * @example cy.dataCy('greeting')
       */
      dataCy(value: string): Chainable<JQuery<HTMLElement>>
      
      /**
       * Custom command to login as a test user
       * @example cy.login()
       */
      login(): Chainable<void>
      
      /**
       * Custom command to wait for page to load
       * @example cy.waitForPageLoad()
       */
      waitForPageLoad(): Chainable<void>
      
      /**
       * Custom command to check responsive design
       * @example cy.checkResponsive()
       */
      checkResponsive(): Chainable<void>
    }
  }
}

Cypress.Commands.add('dataCy', (value: string) => {
  return cy.get(`[data-cy=${value}]`)
})

Cypress.Commands.add('login', () => {
  // Mock login for testing
  cy.visit('/auth')
  cy.get('input[type="email"]').type('test@example.com')
  cy.get('input[type="password"]').type('password123')
  cy.get('button[type="submit"]').click()
  cy.url().should('include', '/dashboard')
})

Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible')
  cy.get('[data-testid="loading"]').should('not.exist')
})

Cypress.Commands.add('checkResponsive', () => {
  // Test mobile viewport
  cy.viewport('iphone-x')
  cy.get('body').should('be.visible')
  
  // Test tablet viewport
  cy.viewport('ipad-2')
  cy.get('body').should('be.visible')
  
  // Test desktop viewport
  cy.viewport(1280, 720)
  cy.get('body').should('be.visible')
})