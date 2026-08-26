describe('AI Chat Functionality', () => {
  beforeEach(() => {
    cy.visit('/chat')
    cy.waitForPageLoad()
  })

  it('should display chat interface correctly', () => {
    cy.get('[data-testid="chat-interface"]').should('be.visible')
    cy.get('[data-testid="chat-messages"]').should('be.visible')
    cy.get('[data-testid="chat-input"]').should('be.visible')
  })

  it('should handle the chat flow', () => {
    // Test initial greeting
    cy.get('[data-testid="chat-messages"]')
      .should('contain', 'Where would you like to study?')

    // Test sending a message
    cy.get('[data-testid="chat-input"] input').type('USA')
    cy.get('[data-testid="send-button"]').click()
    
    // Check message appears in chat
    cy.get('[data-testid="chat-messages"]')
      .should('contain', 'USA')

    // Wait for AI response
    cy.get('[data-testid="typing-indicator"]').should('be.visible')
    cy.get('[data-testid="typing-indicator"]').should('not.exist', { timeout: 10000 })
  })

  it('should progress through conversation stages', () => {
    // Simulate complete conversation flow
    const answers = [
      'USA',
      'Masters',
      'Computer Science', 
      '85%',
      '50 Lakhs INR'
    ]

    answers.forEach((answer, index) => {
      if (index > 0) {
        cy.wait(2000) // Wait for previous response
      }
      
      cy.get('[data-testid="chat-input"] input').clear().type(answer)
      cy.get('[data-testid="send-button"]').click()
    })

    // Should reach contact details stage
    cy.get('[data-testid="chat-messages"]', { timeout: 15000 })
      .should('contain', 'contact details')
  })

  it('should handle OTP verification flow', () => {
    // Navigate through conversation to OTP stage
    cy.get('[data-testid="chat-input"] input').type('test@example.com')
    cy.get('[data-testid="send-button"]').click()
    
    cy.get('[data-testid="chat-input"] input').clear().type('John Doe')
    cy.get('[data-testid="send-button"]').click()
    
    cy.get('[data-testid="chat-input"] input').clear().type('+1234567890')
    cy.get('[data-testid="send-button"]').click()

    // Should show OTP input
    cy.get('[data-testid="otp-input"]', { timeout: 10000 }).should('be.visible')
  })

  it('should display university results after verification', () => {
    // Mock successful OTP verification
    cy.window().then((win) => {
      win.localStorage.setItem('chat_verified', 'true')
    })

    cy.reload()
    
    // Should display university results
    cy.get('[data-testid="university-results"]', { timeout: 15000 })
      .should('be.visible')
    
    // Check for university cards
    cy.get('[data-testid="university-card"]').should('have.length.at.least', 1)
  })

  it('should show expert help section', () => {
    // Mock completed conversation
    cy.window().then((win) => {
      win.localStorage.setItem('chat_completed', 'true')
    })

    cy.reload()
    
    // Should show expert help
    cy.get('[data-testid="expert-help"]', { timeout: 10000 })
      .should('be.visible')
    
    cy.get('[data-testid="expert-help"]')
      .should('contain', 'Call: 9259597979')
      .and('contain', 'WhatsApp: 9502127788')
  })
})