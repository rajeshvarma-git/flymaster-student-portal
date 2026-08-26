describe('Scholarship Finder', () => {
  beforeEach(() => {
    cy.visit('/scholarships')
    cy.waitForPageLoad()
  })

  it('should display scholarship listings correctly', () => {
    cy.get('[data-testid="scholarship-grid"]').should('be.visible')
    cy.get('[data-testid="scholarship-card"]').should('have.length.at.least', 1)
    cy.get('[data-testid="scholarship-filters"]').should('be.visible')
  })

  it('should show scholarship details', () => {
    cy.get('[data-testid="scholarship-card"]').first().within(() => {
      cy.get('[data-testid="scholarship-name"]').should('be.visible')
      cy.get('[data-testid="scholarship-provider"]').should('be.visible')
      cy.get('[data-testid="scholarship-amount"]').should('be.visible')
      cy.get('[data-testid="eligibility-match"]').should('be.visible')
      cy.get('[data-testid="application-deadline"]').should('be.visible')
    })
  })

  it('should filter scholarships by country', () => {
    cy.get('[data-testid="country-filter"]').select('USA')
    
    cy.get('[data-testid="scholarship-card"]').each(($card) => {
      cy.wrap($card).should('contain', 'USA')
    })
  })

  it('should filter by degree level', () => {
    cy.get('[data-testid="degree-filter"]').select('Masters')
    
    cy.get('[data-testid="scholarship-card"]').should('be.visible')
  })

  it('should search scholarships', () => {
    cy.get('[data-testid="scholarship-search"]').type('Fulbright')
    
    cy.get('[data-testid="scholarship-card"]').should('contain', 'Fulbright')
  })

  it('should show scholarship details modal', () => {
    cy.get('[data-testid="view-details"]').first().click()
    
    cy.get('[data-testid="scholarship-modal"]').should('be.visible')
    cy.get('[data-testid="scholarship-description"]').should('be.visible')
    cy.get('[data-testid="eligibility-requirements"]').should('be.visible')
    cy.get('[data-testid="application-process"]').should('be.visible')
  })

  it('should handle scholarship bookmarking', () => {
    cy.get('[data-testid="bookmark-scholarship"]').first().click()
    
    // Should show bookmarked state
    cy.get('[data-testid="bookmark-scholarship"]').first()
      .should('have.class', 'bookmarked')
  })

  it('should display eligibility matching', () => {
    cy.get('[data-testid="scholarship-card"]').each(($card) => {
      cy.wrap($card).find('[data-testid="eligibility-score"]')
        .should('be.visible')
        .invoke('text')
        .should('match', /\d+%/)
    })
  })

  it('should show application deadlines with status', () => {
    cy.get('[data-testid="scholarship-card"]').each(($card) => {
      cy.wrap($card).find('[data-testid="deadline-status"]')
        .should('be.visible')
        .and('contain.oneOf', ['days left', 'Expired', 'weeks left'])
    })
  })

  it('should link to external scholarship websites', () => {
    cy.get('[data-testid="view-details"]').first().click()
    
    cy.get('[data-testid="external-website"]').should('have.attr', 'href')
      .and('include', 'http')
  })

  it('should display scholarship statistics', () => {
    cy.get('[data-testid="scholarship-stats"]').within(() => {
      cy.get('[data-testid="total-scholarships"]').should('contain', '500+')
      cy.get('[data-testid="total-funding"]').should('contain', '$2.5M+')
      cy.get('[data-testid="students-funded"]').should('contain', '1,200+')
      cy.get('[data-testid="success-rate"]').should('contain', '85%')
    })
  })

  it('should show scholarship requirements', () => {
    cy.get('[data-testid="view-details"]').first().click()
    
    cy.get('[data-testid="requirements-list"]').within(() => {
      cy.get('[data-testid="requirement-item"]').should('have.length.at.least', 1)
    })
  })
})