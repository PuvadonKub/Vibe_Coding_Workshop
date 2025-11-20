/**
 * Search and Filter Feature E2E Tests
 */

describe('Search and Filter Features', () => {
  let testData: any

  before(() => {
    cy.fixture('test-data').then((data) => {
      testData = data
    })
    cy.cleanupTestData()
    
    // Seed test data
    cy.login(testData.users[0].username, testData.users[0].password)
    
    // Create test products
    testData.products.forEach((product: any) => {
      cy.createProduct(product)
    })
    
    cy.logout()
  })

  beforeEach(() => {
    cy.visit('/')
  })

  describe('Search Functionality', () => {
    it('should search products by title', () => {
      cy.get('[data-testid=search-input]').type('laptop')
      
      // Should debounce and show results
      cy.get('[data-testid=product-card]').should('exist')
      cy.get('[data-testid=product-card]').should('contain.text', 'laptop')
    })

    it('should search products by description', () => {
      cy.get('[data-testid=search-input]').type('student')
      
      cy.get('[data-testid=product-card]').should('exist')
      // Results should contain products with 'student' in description
    })

    it('should show no results message for invalid search', () => {
      cy.get('[data-testid=search-input]').type('nonexistentproduct123')
      
      cy.get('[data-testid=no-results]').should('be.visible')
      cy.get('[data-testid=no-results]').should('contain', 'No products found')
    })

    it('should clear search results', () => {
      // Search first
      cy.get('[data-testid=search-input]').type('laptop')
      cy.get('[data-testid=product-card]').should('exist')
      
      // Clear search
      cy.get('[data-testid=clear-search]').click()
      cy.get('[data-testid=search-input]').should('have.value', '')
      
      // Should show all products again
      cy.get('[data-testid=product-card]').should('have.length.greaterThan', 1)
    })
  })

  describe('Category Filtering', () => {
    it('should filter products by category', () => {
      cy.get('[data-testid=category-filter]').click()
      cy.get('[data-testid=category-option-Electronics]').click()
      
      // Should show only electronics
      cy.get('[data-testid=active-filter-Electronics]').should('be.visible')
      cy.get('[data-testid=product-card]').should('exist')
    })

    it('should show product count per category', () => {
      cy.get('[data-testid=category-filter]').click()
      
      // Each category should show product count
      cy.get('[data-testid=category-option]').each(($option) => {
        cy.wrap($option).should('contain.text', '(')
      })
    })

    it('should allow multiple category selection', () => {
      cy.get('[data-testid=category-filter]').click()
      cy.get('[data-testid=category-option-Electronics]').click()
      cy.get('[data-testid=category-option-Textbooks]').click()
      
      // Should show products from both categories
      cy.get('[data-testid=active-filter-Electronics]').should('be.visible')
      cy.get('[data-testid=active-filter-Textbooks]').should('be.visible')
    })
  })

  describe('Price Filtering', () => {
    it('should filter by minimum price', () => {
      cy.get('[data-testid=min-price-input]').type('100')
      cy.get('[data-testid=apply-price-filter]').click()
      
      // All displayed products should be >= $100
      cy.get('[data-testid=product-price]').each(($price) => {
        const price = parseFloat($price.text().replace('$', ''))
        expect(price).to.be.at.least(100)
      })
    })

    it('should filter by maximum price', () => {
      cy.get('[data-testid=max-price-input]').type('100')
      cy.get('[data-testid=apply-price-filter]').click()
      
      // All displayed products should be <= $100
      cy.get('[data-testid=product-price]').each(($price) => {
        const price = parseFloat($price.text().replace('$', ''))
        expect(price).to.be.at.most(100)
      })
    })

    it('should filter by price range', () => {
      cy.get('[data-testid=min-price-input]').type('50')
      cy.get('[data-testid=max-price-input]').type('150')
      cy.get('[data-testid=apply-price-filter]').click()
      
      // All displayed products should be between $50-$150
      cy.get('[data-testid=product-price]').each(($price) => {
        const price = parseFloat($price.text().replace('$', ''))
        expect(price).to.be.within(50, 150)
      })
    })
  })

  describe('Status Filtering', () => {
    it('should filter by availability status', () => {
      cy.get('[data-testid=status-filter]').click()
      cy.get('[data-testid=status-option-available]').click()
      
      // Should show only available products
      cy.get('[data-testid=product-status]').each(($status) => {
        cy.wrap($status).should('contain.text', 'Available')
      })
    })

    it('should filter by sold status', () => {
      cy.get('[data-testid=status-filter]').click()
      cy.get('[data-testid=status-option-sold]').click()
      
      // Should show only sold products
      cy.get('[data-testid=product-status]').each(($status) => {
        cy.wrap($status).should('contain.text', 'Sold')
      })
    })
  })

  describe('Combined Filtering', () => {
    it('should apply multiple filters simultaneously', () => {
      // Apply category filter
      cy.get('[data-testid=category-filter]').click()
      cy.get('[data-testid=category-option-Electronics]').click()
      
      // Apply price filter
      cy.get('[data-testid=min-price-input]').type('100')
      cy.get('[data-testid=apply-price-filter]').click()
      
      // Apply search
      cy.get('[data-testid=search-input]').type('laptop')
      
      // Results should match all criteria
      cy.get('[data-testid=active-filter-Electronics]').should('be.visible')
      cy.get('[data-testid=active-price-filter]').should('contain', '$100')
      cy.get('[data-testid=product-card]').should('contain.text', 'laptop')
    })

    it('should clear all filters at once', () => {
      // Apply multiple filters
      cy.get('[data-testid=category-filter]').click()
      cy.get('[data-testid=category-option-Electronics]').click()
      cy.get('[data-testid=min-price-input]').type('50')
      cy.get('[data-testid=search-input]').type('laptop')
      
      // Clear all filters
      cy.get('[data-testid=clear-all-filters]').click()
      
      // All filters should be cleared
      cy.get('[data-testid=active-filter]').should('not.exist')
      cy.get('[data-testid=min-price-input]').should('have.value', '')
      cy.get('[data-testid=search-input]').should('have.value', '')
    })
  })

  describe('Sorting', () => {
    it('should sort by price (low to high)', () => {
      cy.get('[data-testid=sort-dropdown]').click()
      cy.get('[data-testid=sort-price-asc]').click()
      
      // Verify products are sorted by price ascending
      cy.get('[data-testid=product-price]').then(($prices) => {
        const prices = Array.from($prices).map(el => 
          parseFloat(el.textContent?.replace('$', '') || '0')
        )
        
        const sortedPrices = [...prices].sort((a, b) => a - b)
        expect(prices).to.deep.equal(sortedPrices)
      })
    })

    it('should sort by price (high to low)', () => {
      cy.get('[data-testid=sort-dropdown]').click()
      cy.get('[data-testid=sort-price-desc]').click()
      
      // Verify products are sorted by price descending
      cy.get('[data-testid=product-price]').then(($prices) => {
        const prices = Array.from($prices).map(el => 
          parseFloat(el.textContent?.replace('$', '') || '0')
        )
        
        const sortedPrices = [...prices].sort((a, b) => b - a)
        expect(prices).to.deep.equal(sortedPrices)
      })
    })

    it('should sort by newest first', () => {
      cy.get('[data-testid=sort-dropdown]').click()
      cy.get('[data-testid=sort-newest]').click()
      
      // URL should include sort parameter
      cy.url().should('include', 'sort=newest')
    })
  })
})