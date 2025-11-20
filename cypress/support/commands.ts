// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom commands for Student Marketplace E2E testing

/**
 * Custom command to log in a user
 */
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-testid=username-input]').type(username)
  cy.get('[data-testid=password-input]').type(password)
  cy.get('[data-testid=login-submit]').click()
  cy.url().should('not.include', '/login')
})

/**
 * Custom command to register a new user
 */
Cypress.Commands.add('register', (userData: {
  username: string
  email: string
  password: string
}) => {
  cy.visit('/register')
  cy.get('[data-testid=username-input]').type(userData.username)
  cy.get('[data-testid=email-input]').type(userData.email)
  cy.get('[data-testid=password-input]').type(userData.password)
  cy.get('[data-testid=confirm-password-input]').type(userData.password)
  cy.get('[data-testid=register-submit]').click()
})

/**
 * Custom command to create a product
 */
Cypress.Commands.add('createProduct', (productData: {
  title: string
  description: string
  price: number
  category: string
}) => {
  cy.visit('/my-products')
  cy.get('[data-testid=create-product-button]').click()
  
  cy.get('[data-testid=product-title-input]').type(productData.title)
  cy.get('[data-testid=product-description-input]').type(productData.description)
  cy.get('[data-testid=product-price-input]').type(productData.price.toString())
  cy.get('[data-testid=product-category-select]').click()
  cy.get(`[data-value="${productData.category}"]`).click()
  
  cy.get('[data-testid=product-submit]').click()
  cy.get('[data-testid=success-message]').should('be.visible')
})

/**
 * Custom command to search for products
 */
Cypress.Commands.add('searchProducts', (searchTerm: string) => {
  cy.get('[data-testid=search-input]').clear().type(searchTerm)
  cy.get('[data-testid=search-results]').should('be.visible')
})

/**
 * Custom command to filter products by category
 */
Cypress.Commands.add('filterByCategory', (categoryName: string) => {
  cy.get('[data-testid=category-filter]').click()
  cy.get(`[data-testid="category-option-${categoryName}"]`).click()
  cy.get('[data-testid=product-list]').should('be.visible')
})

/**
 * Custom command to logout
 */
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid=user-menu]').click()
  cy.get('[data-testid=logout-button]').click()
  cy.url().should('include', '/')
})

/**
 * Custom command to clean up test data
 */
Cypress.Commands.add('cleanupTestData', () => {
  // This would typically call a backend endpoint to clean up test data
  cy.request('DELETE', `${Cypress.env('apiUrl')}/test/cleanup`)
})

// Type declarations for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>
      register(userData: {
        username: string
        email: string
        password: string
      }): Chainable<void>
      createProduct(productData: {
        title: string
        description: string
        price: number
        category: string
      }): Chainable<void>
      searchProducts(searchTerm: string): Chainable<void>
      filterByCategory(categoryName: string): Chainable<void>
      logout(): Chainable<void>
      cleanupTestData(): Chainable<void>
    }
  }
}