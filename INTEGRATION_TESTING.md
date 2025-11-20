# Integration Testing Guide

This document provides instructions for running the comprehensive integration tests implemented for the Student Marketplace application.

## Test Coverage

### 🔧 Backend Integration Tests

Located in `backend/tests/`:
- `test_integration.py` - Complete API workflows and database transactions
- `test_api_workflows.py` - Specific API workflows and edge cases

**Coverage includes:**
- Complete user authentication flow (registration → login → protected resources)
- Product CRUD operations with authorization
- Search and filtering functionality
- Image upload workflows
- Pagination and data management
- User permissions and security
- Database transaction integrity
- Error handling and validation

### 🌐 Frontend E2E Tests

Located in `cypress/e2e/`:
- `user-journey.cy.ts` - Complete user journey from registration to logout
- `image-upload.cy.ts` - Image upload feature testing
- `search-filter.cy.ts` - Advanced search and filtering functionality

**Coverage includes:**
- User authentication flow (register/login/logout)
- Product management (create/edit/delete/view)
- Search and filtering with various criteria
- Image upload and management
- Navigation and responsive design
- Error handling and validation
- Pagination and user experience

## Running Tests

### Prerequisites

1. **Backend Setup:**
   ```bash
   cd backend
   pip install -r requirements.txt
   pip install pytest pytest-asyncio httpx pillow
   ```

2. **Frontend Setup:**
   ```bash
   npm install
   ```

3. **Start Development Servers:**
   ```bash
   # Terminal 1: Backend API
   cd backend && python run_server.py
   
   # Terminal 2: Frontend Dev Server
   npm run dev
   ```

### Backend Integration Tests

```bash
# Run all backend tests
npm run test:backend

# Run only integration tests
npm run test:integration

# Run with verbose output
cd backend && python -m pytest tests/test_integration.py -v -s

# Run specific test class
cd backend && python -m pytest tests/test_integration.py::TestIntegrationWorkflows::test_complete_user_registration_and_authentication_flow -v
```

### Frontend E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Open Cypress interactive mode
npm run test:e2e:open

# Run specific test file
npx cypress run --spec "cypress/e2e/user-journey.cy.ts"

# Run with specific browser
npx cypress run --browser chrome
```

### Complete Test Suite

```bash
# Run all tests (unit + integration + E2E)
npm run test:all
```

## Test Data Management

### Backend Tests
- Uses SQLite in-memory database for isolation
- Each test function gets fresh database
- Automatic cleanup after each test

### E2E Tests
- Uses `cypress/fixtures/test-data.json` for consistent test data
- Custom commands in `cypress/support/commands.ts`
- Cleanup commands to reset state between tests

## Custom Test Commands

### Cypress Commands
```typescript
// Login user
cy.login('username', 'password')

// Register new user
cy.register({
  username: 'testuser',
  email: 'test@example.com', 
  password: 'password123'
})

// Create product
cy.createProduct({
  title: 'Test Product',
  description: 'Test description',
  price: 99.99,
  category: 'electronics'
})

// Search products
cy.searchProducts('laptop')

// Filter by category
cy.filterByCategory('Electronics')

// Clean up test data
cy.cleanupTestData()
```

## Test Configuration

### Cypress Configuration (`cypress.config.ts`)
```typescript
{
  baseUrl: 'http://localhost:5173',
  env: {
    apiUrl: 'http://localhost:8000'
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 10000
}
```

### Backend Test Configuration
- Test database: SQLite in-memory
- Dependency overrides for database session
- Automatic schema creation/cleanup

## Continuous Integration

### GitHub Actions Example
```yaml
name: Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          pip install -r backend/requirements.txt
          npm install
      - name: Run backend tests
        run: npm run test:backend
      - name: Run E2E tests
        run: npm run test:e2e
```

## Debugging Tests

### Backend Tests
```bash
# Run with debugging output
cd backend && python -m pytest tests/test_integration.py -v -s --tb=short

# Run single test with pdb
cd backend && python -m pytest tests/test_integration.py::TestIntegrationWorkflows::test_complete_user_registration_and_authentication_flow -v -s --pdb
```

### Cypress Tests
```bash
# Open Cypress with debugging
npm run cypress:open

# Run with video recording
npx cypress run --record --key <record-key>

# Debug mode with console output
npx cypress run --headed --no-exit
```

## Test Results and Reports

### Backend Test Reports
- Console output with detailed assertions
- Coverage reports available with `pytest-cov`
- JUnit XML reports for CI integration

### Cypress Test Reports
- Screenshots on failure (stored in `cypress/screenshots/`)
- Video recordings (stored in `cypress/videos/`)
- HTML reports with Mochawesome reporter

## Best Practices

1. **Test Isolation:** Each test should be independent and not rely on other tests
2. **Data Cleanup:** Always clean up test data to avoid interference
3. **Meaningful Assertions:** Use descriptive assertion messages
4. **Page Object Pattern:** Use page objects for complex E2E test scenarios
5. **Environment Separation:** Use separate test databases and environments

## Troubleshooting

### Common Issues

1. **Port Conflicts:** Ensure backend (8000) and frontend (5173) ports are available
2. **Database Locks:** SQLite database locks can occur with concurrent tests
3. **Timeout Issues:** Increase timeout values for slow operations
4. **Test Data Cleanup:** Ensure test data is properly cleaned between runs

### Debug Commands
```bash
# Check if servers are running
curl http://localhost:8000/health
curl http://localhost:5173

# View test logs
tail -f backend/logs/test.log

# Clear test database
rm -f backend/test_*.db
```

---

## Summary

The integration testing suite provides comprehensive coverage of:
- ✅ Complete user workflows from registration to product management
- ✅ API endpoint integration and data consistency  
- ✅ Frontend user experience and responsive design
- ✅ Image upload and file management
- ✅ Search, filtering, and pagination
- ✅ Security and authorization
- ✅ Error handling and edge cases

This ensures the Student Marketplace application works correctly as a complete system with all components properly integrated.