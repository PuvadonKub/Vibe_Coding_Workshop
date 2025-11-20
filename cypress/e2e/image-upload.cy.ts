/**
 * Image Upload Feature E2E Tests
 */

describe('Image Upload Feature', () => {
  let testUser: any

  before(() => {
    cy.fixture('test-data').then((data) => {
      testUser = data.users[0]
    })
    cy.cleanupTestData()
  })

  beforeEach(() => {
    cy.login(testUser.username, testUser.password)
  })

  it('should upload single image when creating product', () => {
    cy.visit('/my-products')
    cy.get('[data-testid=create-product-button]').click()

    // Fill basic product info
    cy.get('[data-testid=product-title-input]').type('Product with Image')
    cy.get('[data-testid=product-description-input]').type('Test description')
    cy.get('[data-testid=product-price-input]').type('99.99')
    cy.get('[data-testid=product-category-select]').click()
    cy.get('[data-value="electronics"]').click()

    // Upload image using fixture
    cy.get('[data-testid=image-upload-input]').selectFile('cypress/fixtures/test-image.jpg')

    // Verify image preview appears
    cy.get('[data-testid=image-preview]').should('be.visible')
    cy.get('[data-testid=image-preview] img').should('have.attr', 'src')

    // Submit product
    cy.get('[data-testid=product-submit]').click()

    // Verify success
    cy.get('[data-testid=success-message]').should('be.visible')

    // Verify image appears in product card
    cy.get('[data-testid=product-card]')
      .should('contain', 'Product with Image')
      .find('img')
      .should('be.visible')
  })

  it('should upload multiple images', () => {
    cy.visit('/my-products')
    cy.get('[data-testid=create-product-button]').click()

    // Fill basic product info
    cy.get('[data-testid=product-title-input]').type('Multi-Image Product')
    cy.get('[data-testid=product-description-input]').type('Test description')
    cy.get('[data-testid=product-price-input]').type('149.99')
    cy.get('[data-testid=product-category-select]').click()
    cy.get('[data-value="electronics"]').click()

    // Upload multiple images
    cy.get('[data-testid=image-upload-input]').selectFile([
      'cypress/fixtures/test-image.jpg',
      'cypress/fixtures/test-image-2.jpg'
    ])

    // Verify multiple previews appear
    cy.get('[data-testid=image-preview]').should('have.length', 2)

    // Submit product
    cy.get('[data-testid=product-submit]').click()

    // Verify success
    cy.get('[data-testid=success-message]').should('be.visible')
  })

  it('should handle drag and drop upload', () => {
    cy.visit('/my-products')
    cy.get('[data-testid=create-product-button]').click()

    // Simulate drag and drop
    cy.get('[data-testid=image-upload-dropzone]').as('dropzone')
    
    cy.fixture('test-image.jpg').then((fileContent) => {
      cy.get('@dropzone').trigger('dragenter')
      cy.get('@dropzone').should('have.class', 'drag-over')
      
      cy.get('@dropzone').trigger('drop', {
        dataTransfer: {
          files: [
            new File([fileContent], 'test-image.jpg', { type: 'image/jpeg' })
          ]
        }
      })
    })

    // Verify upload starts
    cy.get('[data-testid=upload-progress]').should('be.visible')
    cy.get('[data-testid=image-preview]').should('be.visible')
  })

  it('should validate file types and sizes', () => {
    cy.visit('/my-products')
    cy.get('[data-testid=create-product-button]').click()

    // Try to upload invalid file type
    cy.get('[data-testid=image-upload-input]').selectFile('cypress/fixtures/test-data.json')

    // Should show error message
    cy.get('[data-testid=error-message]')
      .should('be.visible')
      .and('contain', 'Please select only image files')

    // Try to upload file that's too large (mock large file)
    cy.intercept('POST', '**/upload/image', {
      statusCode: 400,
      body: { detail: 'File too large. Maximum size is 5MB' }
    }).as('uploadError')

    cy.get('[data-testid=image-upload-input]').selectFile('cypress/fixtures/test-image.jpg')
    cy.wait('@uploadError')

    // Should show size error
    cy.get('[data-testid=error-message]')
      .should('be.visible')
      .and('contain', 'File too large')
  })

  it('should remove uploaded images', () => {
    cy.visit('/my-products')
    cy.get('[data-testid=create-product-button]').click()

    // Upload image
    cy.get('[data-testid=image-upload-input]').selectFile('cypress/fixtures/test-image.jpg')
    cy.get('[data-testid=image-preview]').should('be.visible')

    // Remove image
    cy.get('[data-testid=remove-image-button]').click()

    // Verify image is removed
    cy.get('[data-testid=image-preview]').should('not.exist')
  })
})