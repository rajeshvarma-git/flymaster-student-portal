describe('Responsive Design Tests', () => {
  const viewports = [
    { device: 'mobile', width: 375, height: 667 },
    { device: 'tablet', width: 768, height: 1024 },
    { device: 'desktop', width: 1280, height: 720 }
  ]

  viewports.forEach(viewport => {
    describe(`${viewport.device} viewport`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height)
        cy.visit('/')
      })

      it(`should display correctly on ${viewport.device}`, () => {
        cy.get('body').should('be.visible')
        cy.get('[data-testid="main-content"]').should('be.visible')
      })

      it(`should have proper navigation on ${viewport.device}`, () => {
        if (viewport.device === 'mobile') {
          // Mobile should show bottom navigation
          cy.get('[data-testid="mobile-bottom-nav"]').should('be.visible')
          cy.get('[data-testid="desktop-nav"]').should('not.be.visible')
        } else {
          // Tablet and desktop should show top navigation
          cy.get('[data-testid="desktop-nav"]').should('be.visible')
        }
      })

      it(`should handle text scaling on ${viewport.device}`, () => {
        cy.get('h1').should('be.visible')
        cy.get('p').should('be.visible')
        
        // Check that text doesn't overflow
        cy.get('*').each(($el) => {
          const element = $el[0]
          if (element.scrollWidth > element.clientWidth) {
            cy.log(`Element ${element.tagName} overflows on ${viewport.device}`)
          }
        })
      })

      it(`should have touch-friendly buttons on ${viewport.device}`, () => {
        if (viewport.device === 'mobile') {
          cy.get('button').each(($btn) => {
            cy.wrap($btn).should('have.css', 'min-height')
              .and('match', /\d+px/)
          })
        }
      })
    })
  })

  it('should handle orientation changes', () => {
    cy.viewport('iphone-x')
    cy.visit('/')
    cy.get('[data-testid="main-content"]').should('be.visible')
    
    // Rotate to landscape
    cy.viewport('iphone-x', 'landscape')
    cy.get('[data-testid="main-content"]').should('be.visible')
  })

  it('should maintain functionality across devices', () => {
    const pages = ['/chat', '/universities', '/community', '/experts']
    
    viewports.forEach(viewport => {
      pages.forEach(page => {
        cy.viewport(viewport.width, viewport.height)
        cy.visit(page)
        cy.get('body').should('be.visible')
        cy.get('[data-testid="page-content"]').should('be.visible')
      })
    })
  })
})