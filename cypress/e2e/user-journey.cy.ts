/**
 * User Journey End-to-End Tests
 * 
 * This test suite covers the complete user flow:
 * Registration → Login → Product Creation → Product Viewing → Search/Filter → Logout
 */

describe('Student Marketplace - Complete User Journey', () => {
  let testUser: {
    username: string
    email: string
    password: string
  }

  before(() => {
    // Load test data
    cy.fixture('test-data').then((data) => {
      testUser = data.users[0]
    })
    
    // Clean up any existing test data
    cy.cleanupTestData()
  })

  after(() => {
    // Clean up test data after tests
    cy.cleanupTestData()
  })

  describe('User Authentication Flow', () => {
    it('should allow user registration', () => {
      cy.visit('/')
      
      // Navigate to registration
      cy.get('[data-testid=navbar-register]').click()
      cy.url().should('include', '/register')
      
      // Fill registration form
      cy.register(testUser)
      
      // Should redirect to login or home page
      cy.url().should('not.include', '/register')
      
      // Check for success message or user menu
      cy.get('[data-testid=success-message]')
        .should('be.visible')
        .and('contain', 'Registration successful')
    })

    it('should allow user login', () => {
      cy.visit('/login')
      
      // Login with test user
      cy.login(testUser.username, testUser.password)
      
      // Should redirect to home page
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      
      // User menu should be visible
      cy.get('[data-testid=user-menu]').should('be.visible')
      cy.get('[data-testid=user-menu]').should('contain', testUser.username)
    })

    it('should protect authenticated routes', () => {
      // Try to access protected route without login
      cy.visit('/my-products')
      
      // Should redirect to login
      cy.url().should('include', '/login')
      
      // Login and try again
      cy.login(testUser.username, testUser.password)
      cy.visit('/my-products')
      
      // Should now access the page
      cy.url().should('include', '/my-products')
      cy.get('[data-testid=my-products-page]').should('be.visible')
    })
  })

  describe('Product Management Flow', () => {
    beforeEach(() => {
      // Login before each product test
      cy.login(testUser.username, testUser.password)
    })

    it('should allow product creation', () => {
      cy.fixture('test-data').then((data) => {
        const product = data.products[0]
        
        cy.createProduct(product)
        
        // Verify product appears in user's products
        cy.visit('/my-products')
        cy.get('[data-testid=product-card]')
          .should('contain', product.title)
          .and('contain', `$${product.price}`)
      })
    })

    it('should allow product editing', () => {
      cy.visit('/my-products')
      
      // Click edit on first product
      cy.get('[data-testid=edit-product-button]').first().click()
      
      // Update product details
      const updatedTitle = 'Updated Test Laptop'
      cy.get('[data-testid=product-title-input]').clear().type(updatedTitle)
      cy.get('[data-testid=product-submit]').click()
      
      // Verify update
      cy.get('[data-testid=success-message]').should('be.visible')
      cy.get('[data-testid=product-card]').should('contain', updatedTitle)
    })

    it('should show product details', () => {
      cy.visit('/')
      
      // Click on a product card
      cy.get('[data-testid=product-card]').first().click()
      
      // Should navigate to product details
      cy.url().should('include', '/products/')
      
      // Verify product details are displayed
      cy.get('[data-testid=product-title]').should('be.visible')
      cy.get('[data-testid=product-price]').should('be.visible')
      cy.get('[data-testid=product-description]').should('be.visible')
      cy.get('[data-testid=seller-info]').should('be.visible')
    })
  })

  describe('Search and Filtering Flow', () => {
    beforeEach(() => {
      cy.visit('/')
    })

    it('should search products by title', () => {
      const searchTerm = 'laptop'
      
      cy.searchProducts(searchTerm)
      
      // Verify search results
      cy.get('[data-testid=product-card]').each(($card) => {
        cy.wrap($card).should('contain.text', searchTerm)
      })
    })

    it('should filter products by category', () => {
      cy.filterByCategory('Electronics')
      
      // Verify filtered results
      cy.get('[data-testid=active-filter]').should('contain', 'Electronics')
      cy.get('[data-testid=product-card]').should('exist')
    })

    it('should filter products by price range', () => {
      // Set price range filter
      cy.get('[data-testid=min-price-input]').type('50')
      cy.get('[data-testid=max-price-input]').type('200')
      cy.get('[data-testid=apply-filters]').click()
      
      // Verify products are within price range
      cy.get('[data-testid=product-price]').each(($price) => {
        const price = parseFloat($price.text().replace('$', ''))
        expect(price).to.be.within(50, 200)
      })
    })

    it('should clear all filters', () => {
      // Apply some filters first
      cy.filterByCategory('Electronics')
      cy.get('[data-testid=min-price-input]').type('50')
      
      // Clear all filters
      cy.get('[data-testid=clear-filters]').click()
      
      // Verify filters are cleared
      cy.get('[data-testid=active-filter]').should('not.exist')
      cy.get('[data-testid=min-price-input]').should('have.value', '')
    })
  })

  describe('Navigation and User Experience', () => {
    beforeEach(() => {
      cy.login(testUser.username, testUser.password)
    })

    it('should navigate between pages', () => {
      // Test navigation to different pages
      const pages = [
        { link: '[data-testid=nav-home]', url: '/', element: '[data-testid=marketplace]' },
        { link: '[data-testid=nav-my-products]', url: '/my-products', element: '[data-testid=my-products-page]' },
        { link: '[data-testid=nav-profile]', url: '/profile', element: '[data-testid=profile-page]' }
      ]

      pages.forEach((page) => {
        cy.get(page.link).click()
        cy.url().should('include', page.url)
        cy.get(page.element).should('be.visible')
      })
    })

    it('should handle pagination', () => {
      cy.visit('/')
      
      // Check if pagination exists (assuming more than 12 products)
      cy.get('[data-testid=pagination]').then(($pagination) => {
        if ($pagination.length > 0) {
          // Click next page
          cy.get('[data-testid=next-page]').click()
          
          // Verify URL contains page parameter
          cy.url().should('include', 'page=2')
          
          // Verify different products are shown
          cy.get('[data-testid=product-card]').should('exist')
        }
      })
    })

    it('should handle responsive design', () => {
      // Test mobile viewport
      cy.viewport('iphone-x')
      cy.visit('/')
      
      // Mobile menu should be visible
      cy.get('[data-testid=mobile-menu-button]').should('be.visible')
      cy.get('[data-testid=mobile-menu-button]').click()
      cy.get('[data-testid=mobile-menu]').should('be.visible')
      
      // Test tablet viewport
      cy.viewport('ipad-2')
      cy.visit('/')
      
      // Navigation should adapt to tablet size
      cy.get('[data-testid=navbar]').should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Intercept API calls and simulate network error
      cy.intercept('GET', '**/products**', { forceNetworkError: true }).as('networkError')
      
      cy.visit('/')
      cy.wait('@networkError')
      
      // Should show error message
      cy.get('[data-testid=error-message]').should('be.visible')
      cy.get('[data-testid=retry-button]').should('be.visible')
    })

    it('should validate form inputs', () => {
      cy.login(testUser.username, testUser.password)
      cy.visit('/my-products')
      cy.get('[data-testid=create-product-button]').click()
      
      // Try to submit empty form
      cy.get('[data-testid=product-submit]').click()
      
      // Should show validation errors
      cy.get('[data-testid=field-error]').should('have.length.at.least', 2)
    })

    it('should handle 404 pages', () => {
      cy.visit('/non-existent-page', { failOnStatusCode: false })
      
      // Should show 404 page
      cy.get('[data-testid=not-found-page]').should('be.visible')
      cy.get('[data-testid=home-link]').click()
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })
  })

  describe('User Logout', () => {
    it('should allow user logout', () => {
      cy.login(testUser.username, testUser.password)
      
      // Logout
      cy.logout()
      
      // Verify user is logged out
      cy.get('[data-testid=login-button]').should('be.visible')
      cy.get('[data-testid=user-menu]').should('not.exist')
    })

    it('should redirect to login when accessing protected routes after logout', () => {
      cy.visit('/my-products')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })
  })
})