describe('Expert Counselors', () => {
  beforeEach(() => {
    cy.visit('/experts')
    cy.waitForPageLoad()
  })

  it('should display expert counselors correctly', () => {
    cy.get('[data-testid="experts-grid"]').should('be.visible')
    cy.get('[data-testid="expert-card"]').should('have.length.at.least', 1)
    cy.get('[data-testid="search-experts"]').should('be.visible')
  })

  it('should show expert details and credentials', () => {
    cy.get('[data-testid="expert-card"]').first().within(() => {
      // Check expert information
      cy.get('[data-testid="expert-name"]').should('be.visible')
      cy.get('[data-testid="expert-rating"]').should('be.visible')
      cy.get('[data-testid="expert-experience"]').should('be.visible')
      cy.get('[data-testid="expert-specializations"]').should('be.visible')
      cy.get('[data-testid="verified-badge"]').should('be.visible')
    })
  })

  it('should filter experts by specialization', () => {
    // Test specialization filter
    cy.get('[data-testid="specialization-filter"]').select('USA')
    
    cy.get('[data-testid="expert-card"]').each(($card) => {
      cy.wrap($card).should('contain', 'USA')
    })
  })

  it('should allow booking sessions', () => {
    // Click book session on first expert
    cy.get('[data-testid="book-session"]').first().click()
    
    // Should open booking modal
    cy.get('[data-testid="booking-modal"]').should('be.visible')
    cy.get('[data-testid="expert-info"]').should('be.visible')
    cy.get('[data-testid="session-benefits"]').should('be.visible')
  })

  it('should handle date and time selection', () => {
    cy.get('[data-testid="book-session"]').first().click()
    
    // Select date
    cy.get('[data-testid="date-picker"]').should('be.visible')
    cy.get('[data-testid="available-date"]').first().click()
    
    // Select time slot
    cy.get('[data-testid="time-slot"]').first().click()
    cy.get('[data-testid="time-slot"]').first().should('have.class', 'selected')
  })

  it('should show session types and pricing', () => {
    cy.get('[data-testid="book-session"]').first().click()
    
    // Check session options
    cy.get('[data-testid="session-type"]').should('be.visible')
    cy.get('[data-testid="session-cost"]').should('be.visible')
    cy.get('[data-testid="free-consultation"]').should('contain', 'Free')
  })

  it('should complete booking process', () => {
    cy.get('[data-testid="book-session"]').first().click()
    
    // Fill booking form
    cy.get('[data-testid="available-date"]').first().click()
    cy.get('[data-testid="time-slot"]').first().click()
    cy.get('[data-testid="session-type"]').select('consultation')
    
    cy.get('[data-testid="finish-booking"]').click()
    
    // Should show confirmation
    cy.get('[data-testid="booking-success"]').should('be.visible')
  })

  it('should allow messaging experts', () => {
    cy.get('[data-testid="message-expert"]').first().click()
    
    // Should open message interface or redirect
    cy.url().should('match', /\/messages|\/chat/)
  })

  it('should display expert achievements', () => {
    cy.get('[data-testid="expert-card"]').first().within(() => {
      cy.get('[data-testid="success-rate"]').should('be.visible')
      cy.get('[data-testid="students-helped"]').should('be.visible')
      cy.get('[data-testid="reviews-count"]').should('be.visible')
    })
  })

  it('should search experts by name or expertise', () => {
    cy.get('[data-testid="search-experts"]').type('Kamalakannan')
    
    cy.get('[data-testid="expert-card"]').should('contain', 'Kamalakannan')
  })

  it('should show expert availability', () => {
    cy.get('[data-testid="expert-card"]').each(($card) => {
      cy.wrap($card).find('[data-testid="next-available"]').should('be.visible')
    })
  })
})