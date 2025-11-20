/**
 * Test utilities for React components
 * Provides custom render function with providers and mock data
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider, AuthContextType } from '@/contexts/AuthContext';
import type { User, Product, Category } from '@/types';

// Mock data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  username: 'testuser',
  email: 'test@university.edu',
  full_name: 'Test User',
  bio: 'Test user bio',
  location: 'Test Campus',
  phone: '+1-555-0123',
  website: 'https://testuser.com',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides,
});

export const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'product-123',
  title: 'Test Product',
  description: 'This is a test product',
  price: 99.99,
  status: 'available',
  image_url: 'https://example.com/image.jpg',
  seller_id: 'user-123',
  category_id: 'category-123',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides,
});

export const createMockCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'category-123',
  name: 'Test Category',
  description: 'Test category description',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides,
});

// Mock API responses
export const mockApiResponses = {
  products: {
    products: [createMockProduct(), createMockProduct({ id: 'product-456', title: 'Another Product' })],
    total: 2,
    page: 1,
    per_page: 10,
    pages: 1,
  },
  categories: {
    categories: [
      createMockCategory(),
      createMockCategory({ id: 'category-456', name: 'Electronics' }),
    ],
  },
  user: createMockUser(),
};

// Test providers wrapper
interface AllTheProvidersProps {
  children: React.ReactNode;
  initialAuthState?: Partial<AuthContextType>;
}

const AllTheProviders = ({ children, initialAuthState }: AllTheProvidersProps) => {
  // Create a new QueryClient for each test
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  // Mock AuthContext value
  const defaultAuthValue: AuthContextType = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    updateUser: vi.fn(),
    ...initialAuthState,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <AuthProvider value={defaultAuthValue}>
          <BrowserRouter>{children}</BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    initialAuthState?: Partial<AuthContextType>;
  }
) => {
  const { initialAuthState, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders initialAuthState={initialAuthState}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Custom render function for authenticated users
export const renderWithAuth = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    user?: Partial<User>;
  }
) => {
  const { user = {}, ...renderOptions } = options || {};
  const mockUser = createMockUser(user);
  
  return customRender(ui, {
    initialAuthState: {
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
    },
    ...renderOptions,
  });
};

// Custom render function for unauthenticated users
export const renderWithoutAuth = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return customRender(ui, {
    initialAuthState: {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    },
    ...options,
  });
};

// Mock router functions
export const mockNavigate = vi.fn();
export const mockUseNavigate = () => mockNavigate;

// Mock query functions
export const mockUseQuery = vi.fn();
export const mockUseMutation = vi.fn();

// Mock toast function
export const mockToast = vi.fn();

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { vi, expect } from 'vitest';