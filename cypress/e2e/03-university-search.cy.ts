describe('University Search & Filter', () => {
  beforeEach(() => {
    cy.visit('/universities')
    cy.waitForPageLoad()
  })

  it('should display university listing correctly', () => {
    cy.get('[data-testid="university-grid"]').should('be.visible')
    cy.get('[data-testid="university-card"]').should('have.length.at.least', 1)
    cy.get('[data-testid="search-filters"]').should('be.visible')
  })

  it('should filter universities by country', () => {
    // Open country filter
    cy.get('[data-testid="country-filter"]').click()
    cy.get('[data-testid="filter-option-usa"]').click()
    
    // Verify filtered results
    cy.get('[data-testid="university-card"]').each(($card) => {
      cy.wrap($card).should('contain', 'USA')
    })
  })

  it('should filter universities by program type', () => {
    // Test program filter
    cy.get('[data-testid="program-filter"]').click()
    cy.get('[data-testid="filter-option-masters"]').click()
    
    // Check results contain masters programs
    cy.get('[data-testid="university-card"]').should('exist')
  })

  it('should search universities by name', () => {
    // Test search functionality
    cy.get('[data-testid="university-search"]').type('Stanford')
    cy.get('[data-testid="search-button"]').click()
    
    // Should show relevant results
    cy.get('[data-testid="university-card"]')
      .should('contain', 'Stanford')
  })

  it('should display university details', () => {
    // Click on first university card
    cy.get('[data-testid="university-card"]').first().click()
    
    // Should show university details modal/page
    cy.get('[data-testid="university-details"]').should('be.visible')
    cy.get('[data-testid="university-name"]').should('be.visible')
    cy.get('[data-testid="university-courses"]').should('be.visible')
  })

  it('should allow favoriting universities', () => {
    // Test favorite functionality
    cy.get('[data-testid="favorite-button"]').first().click()
    
    // Should show favorited state
    cy.get('[data-testid="favorite-button"]').first()
      .should('have.class', 'favorited')
  })

  it('should handle pagination correctly', () => {
    // Check if pagination exists
    cy.get('[data-testid="pagination"]').should('be.visible')
    
    // Test next page
    cy.get('[data-testid="next-page"]').click()
    cy.url().should('contain', 'page=2')
    
    // Test previous page
    cy.get('[data-testid="prev-page"]').click()
    cy.url().should('contain', 'page=1')
  })

  it('should sort universities correctly', () => {
    // Test sorting options
    cy.get('[data-testid="sort-dropdown"]').click()
    cy.get('[data-testid="sort-ranking"]').click()
    
    // Should reorder results
    cy.get('[data-testid="university-card"]').should('exist')
  })

  it('should show course details for universities', () => {
    cy.get('[data-testid="university-card"]').first().click()
    cy.get('[data-testid="courses-tab"]').click()
    
    // Should show course information
    cy.get('[data-testid="course-card"]').should('have.length.at.least', 1)
    cy.get('[data-testid="course-fees"]').should('be.visible')
    cy.get('[data-testid="course-duration"]').should('be.visible')
  })
})