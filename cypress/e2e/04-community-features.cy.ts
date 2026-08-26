describe('Community Features', () => {
  beforeEach(() => {
    cy.visit('/community')
    cy.waitForPageLoad()
  })

  it('should display community feed correctly', () => {
    cy.get('[data-testid="community-feed"]').should('be.visible')
    cy.get('[data-testid="post-card"]').should('have.length.at.least', 1)
    cy.get('[data-testid="create-post-button"]').should('be.visible')
  })

  it('should show different post types', () => {
    // Check for different post types
    cy.get('[data-testid="post-card"]').should('contain', 'Discussion')
    cy.get('[data-testid="poll-post"]').should('exist')
    cy.get('[data-testid="question-post"]').should('exist')
  })

  it('should handle post interactions', () => {
    // Test liking a post
    cy.get('[data-testid="like-button"]').first().click()
    cy.get('[data-testid="like-count"]').first().should('contain', '1')
    
    // Test commenting
    cy.get('[data-testid="comment-button"]').first().click()
    cy.get('[data-testid="comment-input"]').type('Great post!')
    cy.get('[data-testid="submit-comment"]').click()
    
    cy.get('[data-testid="comment-list"]').should('contain', 'Great post!')
  })

  it('should allow creating new posts', () => {
    cy.get('[data-testid="create-post-button"]').click()
    
    // Fill out post form
    cy.get('[data-testid="post-title"]').type('Test Post Title')
    cy.get('[data-testid="post-content"]').type('This is a test post content')
    cy.get('[data-testid="post-category"]').select('academic')
    cy.get('[data-testid="post-tags"]').type('test,academic,help')
    
    cy.get('[data-testid="publish-post"]').click()
    
    // Should show success and new post
    cy.get('[data-testid="community-feed"]').should('contain', 'Test Post Title')
  })

  it('should filter posts by category', () => {
    // Test category filtering
    cy.get('[data-testid="category-financial"]').click()
    
    cy.get('[data-testid="post-card"]').each(($post) => {
      cy.wrap($post).should('contain', 'Financial')
    })
  })

  it('should display trending topics', () => {
    cy.get('[data-testid="trending-topics"]').should('be.visible')
    cy.get('[data-testid="trending-topic"]').should('have.length.at.least', 3)
    
    // Click on trending topic
    cy.get('[data-testid="trending-topic"]').first().click()
    cy.get('[data-testid="community-feed"]').should('be.visible')
  })

  it('should handle poll voting', () => {
    // Find a poll post
    cy.get('[data-testid="poll-post"]').first().within(() => {
      // Vote on first option
      cy.get('[data-testid="poll-option"]').first().click()
      
      // Should show updated percentage
      cy.get('[data-testid="poll-results"]').should('be.visible')
      cy.get('[data-testid="vote-count"]').should('contain', 'votes')
    })
  })

  it('should search posts correctly', () => {
    cy.get('[data-testid="search-posts"]').type('Germany')
    cy.get('[data-testid="search-button"]').click()
    
    cy.get('[data-testid="post-card"]').each(($post) => {
      cy.wrap($post).should('contain', 'Germany')
    })
  })

  it('should show community stats', () => {
    cy.get('[data-testid="community-stats"]').should('be.visible')
    cy.get('[data-testid="active-members"]').should('contain', '12,450+')
    cy.get('[data-testid="posts-this-week"]').should('contain', '234')
    cy.get('[data-testid="success-stories"]').should('contain', '1,890')
  })
})