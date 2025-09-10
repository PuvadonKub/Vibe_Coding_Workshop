# GitHub Copilot Instructions

## 🎯 Project Overview
This is a Student Marketplace web application built with:
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

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

## 🔒 Security Guidelines

### Data Handling
- Never expose sensitive data in code
- Validate all user inputs
- Use proper authentication checks
- Implement proper error boundaries

### API Integration
- Use proper error handling
- Implement request timeout
- Follow RESTful practices
- Use proper type checking

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

### Unit Testing
- Write tests for components
- Test business logic
- Cover edge cases
- Use React Testing Library

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

## 🚫 Prohibited Practices

1. Never commit:
   - API keys or secrets
   - Personal information
   - Unhandled errors
   - Testing credentials

2. Avoid:
   - Inline styles (use Tailwind)
   - Any type in TypeScript
   - Direct DOM manipulation
   - Unnecessary dependencies

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
