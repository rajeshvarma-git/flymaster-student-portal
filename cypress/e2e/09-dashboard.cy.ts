describe('User Dashboard', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', 'mock-token')
    })
    cy.visit('/dashboard')
    cy.waitForPageLoad()
  })

  it('should display dashboard correctly', () => {
    cy.get('[data-testid="dashboard-sidebar"]').should('be.visible')
    cy.get('[data-testid="dashboard-content"]').should('be.visible')
  })

  it('should navigate between dashboard sections', () => {
    const sections = [
      { name: 'Profile', path: '/dashboard' },
      { name: 'Documents', path: '/dashboard/documents' },
      { name: 'Favorites', path: '/dashboard/favorites' },
      { name: 'Chat History', path: '/dashboard/chat-history' }
    ]

    sections.forEach(section => {
      cy.get('[data-testid="dashboard-sidebar"]').contains(section.name).click()
      cy.url().should('include', section.path)
    })
  })

  it('should display user profile information', () => {
    cy.visit('/dashboard')
    
    cy.get('[data-testid="profile-section"]').within(() => {
      cy.get('[data-testid="user-name"]').should('be.visible')
      cy.get('[data-testid="user-email"]').should('be.visible')
      cy.get('[data-testid="study-preferences"]').should('be.visible')
    })
  })

  it('should handle document management', () => {
    cy.visit('/dashboard/documents')
    
    cy.get('[data-testid="documents-section"]').should('be.visible')
    cy.get('[data-testid="upload-document"]').should('be.visible')
    cy.get('[data-testid="document-checklist"]').should('be.visible')
  })

  it('should show user favorites', () => {
    cy.visit('/dashboard/favorites')
    
    cy.get('[data-testid="favorites-section"]').should('be.visible')
    cy.get('[data-testid="favorite-universities"]').should('be.visible')
  })

  it('should display chat history', () => {
    cy.visit('/dashboard/chat-history')
    
    cy.get('[data-testid="chat-history-section"]').should('be.visible')
    cy.get('[data-testid="conversation-list"]').should('be.visible')
  })

  it('should handle admin sections for admin users', () => {
    // Mock admin user
    cy.window().then((win) => {
      win.localStorage.setItem('user-role', 'admin')
    })
    cy.reload()

    cy.get('[data-testid="admin-panel"]').should('be.visible')
    cy.get('[data-testid="analytics"]').should('be.visible')
  })

  it('should allow profile editing', () => {
    cy.visit('/dashboard')
    
    cy.get('[data-testid="edit-profile"]').click()
    
    cy.get('[data-testid="first-name"]').clear().type('John')
    cy.get('[data-testid="last-name"]').clear().type('Doe')
    cy.get('[data-testid="phone"]').clear().type('+1234567890')
    
    cy.get('[data-testid="save-profile"]').click()
    
    cy.get('[data-testid="profile-success"]').should('be.visible')
  })

  it('should handle document upload', () => {
    cy.visit('/dashboard/documents')
    
    // Mock file upload
    cy.get('[data-testid="file-upload"]').selectFile('cypress/fixtures/sample.pdf', {
      force: true
    })
    
    cy.get('[data-testid="document-type"]').select('academic_transcripts')
    cy.get('[data-testid="upload-submit"]').click()
    
    cy.get('[data-testid="upload-success"]').should('be.visible')
  })

  it('should show application tracking', () => {
    cy.visit('/dashboard')
    
    cy.get('[data-testid="application-tracker"]').should('be.visible')
    cy.get('[data-testid="application-status"]').should('be.visible')
  })

  it('should display sidebar collapse functionality', () => {
    cy.get('[data-testid="sidebar-toggle"]').click()
    cy.get('[data-testid="dashboard-sidebar"]').should('have.class', 'collapsed')
    
    cy.get('[data-testid="sidebar-toggle"]').click()
    cy.get('[data-testid="dashboard-sidebar"]').should('not.have.class', 'collapsed')
  })
})