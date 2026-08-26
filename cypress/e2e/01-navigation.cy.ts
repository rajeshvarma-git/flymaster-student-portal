describe('Navigation Tests', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForPageLoad()
  })

  it('should display the homepage correctly', () => {
    // Check main elements are present
    cy.contains('Fly AI Pathfinder').should('be.visible')
    cy.contains('Your AI-Powered Study Abroad Companion').should('be.visible')
    cy.get('[data-testid="hero-section"]').should('be.visible')
  })

  it('should navigate to all main pages', () => {
    const pages = [
      { name: 'AI Chat', url: '/chat' },
      { name: 'Universities', url: '/universities' },
      { name: 'Community', url: '/community' },
      { name: 'Experts', url: '/experts' },
      { name: 'Test Prep', url: '/test-prep' },
      { name: 'Scholarships', url: '/scholarships' },
      { name: 'Events', url: '/events' }
    ]

    pages.forEach(page => {
      cy.visit(page.url)
      cy.url().should('include', page.url)
      cy.get('body').should('be.visible')
      cy.go('back')
    })
  })

  it('should handle mobile navigation correctly', () => {
    cy.viewport('iphone-x')
    
    // Check mobile bottom navigation is visible
    cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
    
    // Test mobile navigation links
    cy.get('[data-testid="mobile-bottom-nav"] a[href="/chat"]').click()
    cy.url().should('include', '/chat')
    
    cy.get('[data-testid="mobile-bottom-nav"] a[href="/universities"]').click()
    cy.url().should('include', '/universities')
  })

  it('should display proper page titles and metadata', () => {
    cy.visit('/universities')
    cy.title().should('contain', 'Universities')
    
    cy.visit('/chat')
    cy.title().should('contain', 'Chat')
  })

  it('should handle 404 pages gracefully', () => {
    cy.visit('/nonexistent-page', { failOnStatusCode: false })
    cy.contains('404').should('be.visible')
  })
})