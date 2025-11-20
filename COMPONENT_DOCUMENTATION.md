# Student Marketplace - Component Documentation

## Overview

The Student Marketplace frontend is built with React, TypeScript, and Tailwind CSS, using shadcn-ui components for a consistent design system. This documentation provides comprehensive information about all components, their props, usage examples, and integration patterns.

## Component Architecture

### Design Principles
- **Composition over Inheritance**: Components are designed to be composable and reusable
- **TypeScript First**: All components are fully typed with comprehensive interfaces
- **Accessibility**: Components follow WCAG 2.1 guidelines with proper ARIA attributes
- **Performance**: Optimized with React.memo, lazy loading, and proper dependency management
- **Testing**: All components have comprehensive test coverage

### Folder Structure
```
src/components/
├── auth/           # Authentication-related components
├── layout/         # Layout and navigation components  
├── product/        # Product-specific components
├── ui/             # Reusable UI components (shadcn-ui based)
├── upload/         # File upload components
└── *.tsx           # Standalone components
```

## Authentication Components

### LoginForm

**Location**: `src/components/auth/LoginForm.tsx`

**Purpose**: Handles user authentication with form validation and error handling.

**Props**:
```typescript
interface LoginFormProps {
  onSuccess?: (user: User) => void;
  redirectTo?: string;
  showRegisterLink?: boolean;
}
```

**Usage**:
```tsx
import { LoginForm } from '@/components/auth/LoginForm';

function LoginPage() {
  const handleLoginSuccess = (user: User) => {
    console.log('User logged in:', user);
    navigate('/dashboard');
  };

  return (
    <LoginForm 
      onSuccess={handleLoginSuccess}
      redirectTo="/dashboard"
      showRegisterLink={true}
    />
  );
}
```

**Features**:
- Form validation with Zod schema
- Real-time field validation
- Loading states during authentication
- Error message display
- Redirect handling after successful login
- Remember me functionality

**Validation Rules**:
- Username/Email: Required, valid format
- Password: Required, minimum 6 characters

### RegisterForm

**Location**: `src/components/auth/RegisterForm.tsx`

**Purpose**: User registration with comprehensive validation and security features.

**Props**:
```typescript
interface RegisterFormProps {
  onSuccess?: (user: User) => void;
  redirectTo?: string;
  showLoginLink?: boolean;
  requireTermsAcceptance?: boolean;
}
```

**Usage**:
```tsx
import { RegisterForm } from '@/components/auth/RegisterForm';

function RegisterPage() {
  return (
    <RegisterForm 
      onSuccess={(user) => navigate('/welcome')}
      requireTermsAcceptance={true}
      showLoginLink={true}
    />
  );
}
```

**Features**:
- Multi-step validation
- Password strength indicator
- Email format validation
- Username availability checking
- Terms and conditions acceptance
- Automatic login after registration

### ProtectedRoute

**Location**: `src/components/auth/ProtectedRoute.tsx`

**Purpose**: Route protection for authenticated users only.

**Props**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  redirectTo?: string;
  requiredRole?: UserRole;
}
```

**Usage**:
```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/profile" element={
        <ProtectedRoute redirectTo="/login">
          <ProfilePage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```

## Product Components

### ProductCard

**Location**: `src/components/product/ProductCard.tsx`

**Purpose**: Display product information in a card format with actions.

**Props**:
```typescript
interface ProductCardProps {
  product: Product;
  showActions?: boolean;
  compact?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onView?: (productId: string) => void;
  className?: string;
}
```

**Usage**:
```tsx
import { ProductCard } from '@/components/product/ProductCard';

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map(product => (
        <ProductCard 
          key={product.id}
          product={product}
          showActions={true}
          onView={(id) => navigate(`/products/${id}`)}
          onEdit={(product) => setEditingProduct(product)}
        />
      ))}
    </div>
  );
}
```

**Features**:
- Responsive design with mobile optimization
- Image lazy loading with fallbacks
- Price formatting with currency
- Status badges (available, sold, pending)
- Action buttons (edit, delete, view)
- Hover effects and animations
- Accessibility features (keyboard navigation, screen reader support)

### ProductList

**Location**: `src/components/product/ProductList.tsx`

**Purpose**: Grid/list display of multiple products with loading and empty states.

**Props**:
```typescript
interface ProductListProps {
  products: Product[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  layout?: 'grid' | 'list';
  showActions?: boolean;
  onProductAction?: (action: string, product: Product) => void;
  className?: string;
}
```

**Usage**:
```tsx
import { ProductList } from '@/components/product/ProductList';

function MarketplacePage() {
  const { products, loading, error } = useProducts(filters);

  return (
    <ProductList
      products={products}
      loading={loading}
      error={error}
      layout="grid"
      emptyMessage="No products found matching your criteria"
      onProductAction={(action, product) => {
        switch(action) {
          case 'view':
            navigate(`/products/${product.id}`);
            break;
          case 'edit':
            setEditingProduct(product);
            break;
        }
      }}
    />
  );
}
```

**Features**:
- Multiple layout options (grid/list)
- Skeleton loading states
- Error boundary integration
- Empty state handling
- Infinite scroll support
- Batch action capabilities

### ProductForm

**Location**: `src/components/product/ProductForm.tsx`

**Purpose**: Create and edit product listings with validation and image upload.

**Props**:
```typescript
interface ProductFormProps {
  product?: Product; // For editing
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  categories: Category[];
}
```

**Usage**:
```tsx
import { ProductForm } from '@/components/product/ProductForm';

function CreateProductPage() {
  const { categories } = useCategories();
  
  const handleSubmit = async (data: ProductFormData) => {
    await createProduct(data);
    navigate('/my-products');
  };

  return (
    <ProductForm
      categories={categories}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/my-products')}
    />
  );
}
```

**Features**:
- Rich text editor for descriptions
- Image upload with preview and cropping
- Category selection with search
- Price validation and formatting
- Draft saving functionality
- Real-time validation feedback

## Layout Components

### Navbar

**Location**: `src/components/layout/Navbar.tsx`

**Purpose**: Main navigation with user menu, search, and responsive design.

**Props**:
```typescript
interface NavbarProps {
  user?: User | null;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  fixed?: boolean;
  transparent?: boolean;
}
```

**Usage**:
```tsx
import { Navbar } from '@/components/layout/Navbar';

function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  return (
    <>
      <Navbar 
        user={user}
        showSearch={true}
        onSearch={(query) => navigate(`/search?q=${query}`)}
      />
      <main>{children}</main>
    </>
  );
}
```

**Features**:
- Responsive hamburger menu
- User dropdown with profile actions
- Search bar with autocomplete
- Shopping cart indicator
- Notification badges
- Theme toggle integration

### Footer

**Location**: `src/components/layout/Footer.tsx`

**Purpose**: Site footer with links, contact information, and social media.

**Props**:
```typescript
interface FooterProps {
  showNewsletter?: boolean;
  showSocialLinks?: boolean;
  compactMode?: boolean;
}
```

**Usage**:
```tsx
import { Footer } from '@/components/layout/Footer';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main>{children}</main>
      <Footer 
        showNewsletter={true}
        showSocialLinks={true}
      />
    </>
  );
}
```

## UI Components (shadcn-ui based)

### Button

**Location**: `src/components/ui/button.tsx`

**Purpose**: Customizable button component with multiple variants and sizes.

**Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
**Sizes**: `default`, `sm`, `lg`, `icon`

**Usage**:
```tsx
import { Button } from '@/components/ui/button';

function ActionButtons() {
  return (
    <div className="flex gap-2">
      <Button variant="default" size="lg">
        Primary Action
      </Button>
      <Button variant="outline" size="default">
        Secondary Action  
      </Button>
      <Button variant="destructive" size="sm">
        Delete
      </Button>
    </div>
  );
}
```

### Input

**Location**: `src/components/ui/input.tsx`

**Purpose**: Form input component with validation states and accessibility.

**Props**:
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helper?: string;
}
```

**Usage**:
```tsx
import { Input } from '@/components/ui/input';

function ContactForm() {
  return (
    <form>
      <Input
        label="Email Address"
        type="email"
        placeholder="john@example.com"
        error={errors.email?.message}
        helper="We'll never share your email"
      />
    </form>
  );
}
```

### Dialog

**Location**: `src/components/ui/dialog.tsx`

**Purpose**: Modal dialog component with overlay and animation.

**Usage**:
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function DeleteConfirmation({ open, onClose, onConfirm }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to delete this product?</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Specialized Components

### SearchBar

**Location**: `src/components/SearchBar.tsx`

**Purpose**: Advanced search with filters, suggestions, and history.

**Props**:
```typescript
interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
  suggestions?: string[];
  recentSearches?: string[];
}
```

**Usage**:
```tsx
import { SearchBar } from '@/components/SearchBar';

function HomePage() {
  const handleSearch = (query: string, filters: SearchFilters) => {
    navigate(`/search?q=${query}&filters=${JSON.stringify(filters)}`);
  };

  return (
    <SearchBar
      onSearch={handleSearch}
      showFilters={true}
      suggestions={popularSearches}
      placeholder="Search for products..."
    />
  );
}
```

**Features**:
- Debounced search input
- Filter dropdown with categories/price ranges
- Search history persistence
- Autocomplete suggestions
- Keyboard navigation (arrow keys, enter, escape)

### CategoryFilter

**Location**: `src/components/CategoryFilter.tsx`

**Purpose**: Category selection with product counts and hierarchy.

**Props**:
```typescript
interface CategoryFilterProps {
  categories: Category[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  showCounts?: boolean;
  multiSelect?: boolean;
}
```

**Usage**:
```tsx
import { CategoryFilter } from '@/components/CategoryFilter';

function FiltersPanel() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  return (
    <CategoryFilter
      categories={categories}
      selectedIds={selectedCategories}
      onSelectionChange={setSelectedCategories}
      showCounts={true}
      multiSelect={true}
    />
  );
}
```

### ImageUpload

**Location**: `src/components/upload/ImageUpload.tsx`

**Purpose**: Drag-and-drop image upload with preview and editing.

**Props**:
```typescript
interface ImageUploadProps {
  onUpload: (files: File[]) => Promise<UploadResult[]>;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  showPreview?: boolean;
  enableCropping?: boolean;
}
```

**Usage**:
```tsx
import { ImageUpload } from '@/components/upload/ImageUpload';

function ProductImageUpload() {
  const handleUpload = async (files: File[]) => {
    const results = await uploadImages(files);
    setProductImages(results.map(r => r.url));
    return results;
  };

  return (
    <ImageUpload
      onUpload={handleUpload}
      maxFiles={5}
      maxSize={5 * 1024 * 1024} // 5MB
      acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
      showPreview={true}
      enableCropping={true}
    />
  );
}
```

## Component Testing

### Testing Utilities

**Location**: `src/test/utils.tsx`

**Purpose**: Custom testing utilities and providers for component tests.

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';

export function renderWithProviders(
  component: React.ReactElement,
  options: { user?: User; initialRoute?: string } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider initialUser={options.user}>
          {component}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

### Example Component Test

```typescript
import { renderWithProviders } from '@/test/utils';
import { ProductCard } from '@/components/product/ProductCard';

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: '1',
    title: 'Test Product',
    description: 'Test description',
    price: 99.99,
    image_url: 'https://example.com/image.jpg',
    status: 'available',
    seller: { id: '1', username: 'seller' },
    category: { id: '1', name: 'Electronics' }
  };

  it('renders product information correctly', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('calls onView when clicked', async () => {
    const onView = jest.fn();
    renderWithProviders(
      <ProductCard product={mockProduct} onView={onView} />
    );
    
    fireEvent.click(screen.getByText('Test Product'));
    await waitFor(() => {
      expect(onView).toHaveBeenCalledWith(mockProduct.id);
    });
  });
});
```

## Performance Optimization

### React.memo Usage

Components are optimized with React.memo when appropriate:

```typescript
import React, { memo } from 'react';

interface ProductCardProps {
  product: Product;
  onView?: (id: string) => void;
}

export const ProductCard = memo<ProductCardProps>(({ product, onView }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.product.id === nextProps.product.id &&
         prevProps.product.updated_at === nextProps.product.updated_at;
});
```

### Lazy Loading

Large components are lazy-loaded to improve initial bundle size:

```typescript
import { lazy, Suspense } from 'react';

const ProductForm = lazy(() => import('@/components/product/ProductForm'));
const ImageUpload = lazy(() => import('@/components/upload/ImageUpload'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductForm />
    </Suspense>
  );
}
```

## Accessibility Features

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Proper tab order and focus management
- Keyboard shortcuts for common actions

### Screen Reader Support
- Semantic HTML structure
- ARIA labels and descriptions
- Live regions for dynamic content updates

### Color and Contrast
- WCAG 2.1 AA compliant color contrast
- High contrast mode support
- Color-blind friendly design

## Styling Guidelines

### Tailwind CSS Classes
```typescript
// ✅ Good: Semantic, readable classes
<div className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow">
  <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Title</h2>
  <p className="text-gray-600 text-sm">Product description</p>
</div>

// ❌ Avoid: Complex, hard to read classes
<div className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95">
```

### Component Variants

Use consistent variant patterns across components:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

## Integration Patterns

### Form Integration
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productSchema = z.object({
  title: z.string().min(3).max(100),
  price: z.number().min(0),
  category_id: z.string().uuid(),
});

function ProductFormIntegration() {
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      price: 0,
      category_id: '',
    },
  });

  return (
    <Form {...form}>
      <ProductForm onSubmit={form.handleSubmit} />
    </Form>
  );
}
```

### API Integration
```typescript
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

function ProductListIntegration() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.products.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.products.delete(id),
    onSuccess: () => {
      // Invalidate and refetch products
      queryClient.invalidateQueries(['products']);
    },
  });

  return (
    <ProductList
      products={products}
      loading={isLoading}
      onDelete={(product) => deleteMutation.mutate(product.id)}
    />
  );
}
```

---

This component documentation provides comprehensive information for developers working with the Student Marketplace frontend. Each component is designed to be reusable, accessible, and performant while maintaining consistency across the application.