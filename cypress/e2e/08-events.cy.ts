describe('Events & Webinars', () => {
  beforeEach(() => {
    cy.visit('/events')
    cy.waitForPageLoad()
  })

  it('should display events correctly', () => {
    cy.get('[data-testid="events-dashboard"]').should('be.visible')
    cy.get('[data-testid="event-tabs"]').should('be.visible')
    cy.get('[data-testid="event-stats"]').should('be.visible')
  })

  it('should show different event categories', () => {
    const eventTabs = ['upcoming', 'past', 'registered']
    
    eventTabs.forEach(tab => {
      cy.get('[data-testid="event-tabs"]').contains(tab).click()
      cy.get('[data-testid="events-grid"]').should('be.visible')
    })
  })

  it('should display event information correctly', () => {
    cy.get('[data-testid="event-card"]').first().within(() => {
      cy.get('[data-testid="event-title"]').should('be.visible')
      cy.get('[data-testid="event-host"]').should('be.visible')
      cy.get('[data-testid="event-date"]').should('be.visible')
      cy.get('[data-testid="event-duration"]').should('be.visible')
      cy.get('[data-testid="attendee-count"]').should('be.visible')
    })
  })

  it('should handle event registration', () => {
    // Find upcoming event
    cy.get('[data-testid="event-tabs"]').contains('upcoming').click()
    
    cy.get('[data-testid="register-event"]').first().click()
    
    // Should show registration success or form
    cy.get('[data-testid="registration-success"]').should('be.visible')
  })

  it('should show event details modal', () => {
    cy.get('[data-testid="view-event-details"]').first().click()
    
    cy.get('[data-testid="event-modal"]').should('be.visible')
    cy.get('[data-testid="event-description"]').should('be.visible')
    cy.get('[data-testid="event-agenda"]').should('be.visible')
    cy.get('[data-testid="host-information"]').should('be.visible')
  })

  it('should filter events by type', () => {
    // Test event type filters
    cy.get('[data-testid="event-filter-webinar"]').click()
    
    cy.get('[data-testid="event-card"]').each(($card) => {
      cy.wrap($card).should('contain', 'webinar')
    })
  })

  it('should search events', () => {
    cy.get('[data-testid="search-events"]').type('Germany')
    
    cy.get('[data-testid="event-card"]').should('contain', 'Germany')
  })

  it('should show event pricing correctly', () => {
    cy.get('[data-testid="event-card"]').each(($card) => {
      cy.wrap($card).find('[data-testid="event-price"]')
        .should('be.visible')
        .and('contain.oneOf', ['Free', '$'])
    })
  })

  it('should handle past events with recordings', () => {
    cy.get('[data-testid="event-tabs"]').contains('past').click()
    
    // Check for recording availability
    cy.get('[data-testid="watch-recording"]').should('exist')
    
    cy.get('[data-testid="watch-recording"]').first().click()
    
    // Should navigate to recording or show player
    cy.url().should('match', /\/recording|\/watch/)
  })

  it('should display event agenda', () => {
    cy.get('[data-testid="view-event-details"]').first().click()
    
    cy.get('[data-testid="event-agenda"]').within(() => {
      cy.get('[data-testid="agenda-item"]').should('have.length.at.least', 1)
      cy.get('[data-testid="agenda-time"]').should('be.visible')
      cy.get('[data-testid="agenda-topic"]').should('be.visible')
    })
  })

  it('should show event statistics', () => {
    cy.get('[data-testid="event-stats"]').within(() => {
      cy.get('[data-testid="upcoming-events"]').should('be.visible')
      cy.get('[data-testid="total-registrations"]').should('contain', '2,450+')
      cy.get('[data-testid="expert-speakers"]').should('contain', '50+')
      cy.get('[data-testid="recorded-sessions"]').should('contain', '25')
    })
  })

  it('should handle event registration states', () => {
    // Check different registration states
    cy.get('[data-testid="event-card"]').each(($card) => {
      cy.wrap($card).find('[data-testid="registration-button"]')
        .should('contain.oneOf', ['Register', 'Registered', 'Full'])
    })
  })
})