# GitHub Copilot Instructions

## 🎯 Project Overview
This is a Student Marketplace web application built with:
- **Frontend**: Vite + TypeScript + React + shadcn-ui + Tailwind CSS
- **Backend**: FastAPI + Python (Alternative: Node.js/Express)
- **Database**: Prisma ORM + SQLite3
- **Authentication**: JWT tokens
- **Testing**: Jest + React Testing Library + Pytest

## 📝 Coding Standards

### TypeScript & React
```typescript
// ✅ DO: Use TypeScript interfaces for props
interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image?: string;
}

// ✅ DO: Use functional components with explicit return types
const ProductCard: React.FC<ProductCardProps> = ({ id, title, price, image }) => {
  return (
    // Component JSX
  );
};

// ❌ DON'T: Use any type
const handleData = (data: any) => { ... }
```

### Component Structure
- Place components in appropriate folders under `src/components`
- Use separate files for types/interfaces
- Keep components small and focused
- Use composition over inheritance

### State Management
- Use React hooks appropriately
- Implement proper error handling
- Follow React Query patterns for data fetching
- Use context for global state when necessary

## 🎨 UI/UX Guidelines

### shadcn-ui Usage
- Use existing shadcn-ui components when available
- Follow shadcn-ui component patterns
- Maintain consistent component styling
- Use proper form handling components

### Tailwind CSS
- Follow utility-first CSS approach
- Use consistent spacing and sizing
- Implement responsive design patterns
- Maintain design system tokens

## �️ Database & Prisma Guidelines

### Prisma Best Practices
```typescript
// ✅ DO: Use Prisma client properly
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { products: true }
});

// ✅ DO: Handle database errors
try {
  const product = await prisma.product.create({ data: productData });
} catch (error) {
  console.error('Database error:', error);
  throw new Error('Failed to create product');
}

// ❌ DON'T: Expose raw database errors to client
catch (error) {
  res.json({ error: error.message }); // Raw database error
}
```

### Schema Design
- Use meaningful field names
- Implement proper relationships
- Add appropriate indexes
- Use enum types for status fields
- Always include timestamps (createdAt, updatedAt)

## �🔒 Security Guidelines

### Data Handling
- Never expose sensitive data in code
- Validate all user inputs with Zod schemas
- Use proper authentication checks (JWT)
- Implement proper error boundaries
- Hash passwords with bcrypt
- Use environment variables for secrets

### API Integration
- Use proper error handling
- Implement request timeout
- Follow RESTful practices
- Use proper type checking
- Validate API responses
- Implement rate limiting

### Authentication & Authorization
```typescript
// ✅ DO: Validate JWT tokens
const token = req.headers.authorization?.replace('Bearer ', '');
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// ✅ DO: Check user permissions
if (decoded.userId !== resource.ownerId) {
  throw new Error('Unauthorized');
}
```

## 💻 Development Workflow

### Code Organization
```typescript
// ✅ DO: Organize imports
import { useState, useEffect } from 'react';
import type { ProductType } from '@/types';
import { Button } from '@/components/ui/button';

// ✅ DO: Use descriptive variable names
const isProductAvailable = stock > 0;

// ❌ DON'T: Use unclear abbreviations
const prd = getProduct();
```

### Comments and Documentation
- Write clear, concise comments
- Document complex logic
- Include JSDoc for functions
- Explain business rules

## 🚀 Performance

### Optimization
- Implement proper code splitting
- Use React.memo when necessary
- Optimize images and assets
- Follow lazy loading patterns

### Best Practices
- Avoid unnecessary re-renders
- Use proper key props in lists
- Implement proper error boundaries
- Follow accessibility guidelines

## 🧪 Testing Guidelines

### Frontend Testing
```typescript
// ✅ DO: Test component behavior
describe('ProductCard', () => {
  it('displays product information correctly', () => {
    const product = { id: '1', title: 'Test Product', price: 99.99 };
    render(<ProductCard product={product} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });
});

// ✅ DO: Test user interactions
it('calls onSelect when clicked', () => {
  const onSelect = jest.fn();
  render(<ProductCard product={product} onSelect={onSelect} />);
  fireEvent.click(screen.getByText('View Details'));
  expect(onSelect).toHaveBeenCalledWith('1');
});
```

### Backend Testing
```python
# ✅ DO: Test API endpoints
def test_create_product():
    response = client.post("/products/", json={
        "title": "Test Product",
        "price": 99.99,
        "sellerId": "user-123"
    })
    assert response.status_code == 201
    assert response.json()["title"] == "Test Product"

# ✅ DO: Test database operations
def test_user_creation():
    user = User.create(username="testuser", email="test@example.com")
    assert user.id is not None
    assert user.username == "testuser"
```

### Integration Testing
- Test complete user workflows
- Test API integration with frontend
- Test database transactions
- Test authentication flows

## 📚 Additional Resources

### Documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [shadcn-ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🔍 Code Review Checklist

1. Code Quality
   - [ ] Follows TypeScript best practices
   - [ ] Implements proper error handling
   - [ ] Uses appropriate React patterns
   - [ ] Follows project structure

2. Performance
   - [ ] Optimizes component renders
   - [ ] Implements proper loading states
   - [ ] Uses appropriate data fetching patterns
   - [ ] Follows accessibility guidelines

3. Security
   - [ ] Validates user inputs
   - [ ] Implements proper authentication
   - [ ] Handles sensitive data appropriately
   - [ ] Uses secure API calls

## 🎯 Project-Specific Rules

### Student Marketplace Features
```typescript
// ✅ DO: Create reusable marketplace components
interface MarketplaceItemProps {
  item: Product | Service;
  seller: User;
  onPurchase: (itemId: string) => void;
}

// ✅ DO: Implement proper product categories
enum ProductCategory {
  TEXTBOOKS = 'textbooks',
  ELECTRONICS = 'electronics',
  FURNITURE = 'furniture',
  CLOTHING = 'clothing'
}
```

### File Organization
- Components: `/src/components/marketplace/`
- Pages: `/src/pages/`
- Types: `/src/types/`
- Utils: `/src/lib/`
- API Routes: `/src/pages/api/` or `/backend/app/`

## 🚫 Prohibited Practices

1. Never commit:
   - API keys or secrets (.env files)
   - Personal information
   - Unhandled errors
   - Testing credentials
   - Database files (*.db)
   - Build artifacts

2. Avoid:
   - Inline styles (use Tailwind CSS)
   - `any` type in TypeScript
   - Direct DOM manipulation (use React patterns)
   - Unnecessary dependencies
   - Hardcoded URLs or endpoints
   - Unvalidated user inputs

3. Code Quality:
   - No console.log in production code
   - No unused imports or variables
   - No magic numbers (use constants)
   - No nested ternary operators

## 🔄 Version Control

### Commit Messages
- Use clear, descriptive messages
- Follow conventional commits
- Reference issues when applicable
- Keep commits focused

### Branch Strategy
- Use feature branches
- Keep branches up to date
- Clean up merged branches
- Follow PR guidelines

---

**Note:** These guidelines are designed to maintain code quality and consistency throughout the project. They should be followed by all team members and enforced during code reviews.
