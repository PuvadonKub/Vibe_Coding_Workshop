import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '../Home';
import { AuthProvider } from '@/contexts/AuthContext';
import { createMockUser, createMockProduct, createMockCategory } from '../../../tests/utils';

// Mock API hooks
const mockProducts = [
  createMockProduct({ id: '1', title: 'Test Product 1', price: 99.99 }),
  createMockProduct({ id: '2', title: 'Test Product 2', price: 149.99 }),
];

const mockCategories = [
  createMockCategory({ id: '1', name: 'Electronics' }),
  createMockCategory({ id: '2', name: 'Books' }),
];

vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    data: { products: mockProducts, total: mockProducts.length },
    isLoading: false,
    error: null
  })
}));

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    data: mockCategories,
    isLoading: false,
    error: null
  })
}));

const renderHome = (user = null) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider initialUser={user}>
          <Home />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Home Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders home page with hero section', () => {
    renderHome();
    
    expect(screen.getByText(/student marketplace/i)).toBeInTheDocument();
    expect(screen.getByText(/buy, sell, and discover/i)).toBeInTheDocument();
  });

  it('shows navigation for unauthenticated users', () => {
    renderHome();
    
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  it('shows navigation for authenticated users', () => {
    const mockUser = createMockUser();
    renderHome(mockUser);
    
    expect(screen.getByText(/my products/i)).toBeInTheDocument();
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
    expect(screen.getByText(/sign out/i)).toBeInTheDocument();
  });

  it('displays featured listings', () => {
    renderHome();
    
    expect(screen.getByText(/featured listings/i)).toBeInTheDocument();
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
  });

  it('displays categories', () => {
    renderHome();
    
    expect(screen.getByText(/browse categories/i)).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
  });

  it('navigates to marketplace when browsing all products', () => {
    renderHome();
    
    const browseAllButton = screen.getByText(/browse all/i);
    expect(browseAllButton.closest('a')).toHaveAttribute('href', '/marketplace');
  });

  it('filters products by category', async () => {
    renderHome();
    
    const electronicsCategory = screen.getByText('Electronics');
    fireEvent.click(electronicsCategory);
    
    // Should navigate to marketplace with category filter
    await waitFor(() => {
      expect(electronicsCategory.closest('a')).toHaveAttribute('href', '/marketplace?category=1');
    });
  });

  it('displays product details correctly', () => {
    renderHome();
    
    // Check product card details
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(require('@/hooks/useProducts').useProducts).mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    });

    renderHome();
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    vi.mocked(require('@/hooks/useProducts').useProducts).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load products')
    });

    renderHome();
    
    expect(screen.getByText(/error loading products/i)).toBeInTheDocument();
  });

  it('handles empty products state', () => {
    vi.mocked(require('@/hooks/useProducts').useProducts).mockReturnValue({
      data: { products: [], total: 0 },
      isLoading: false,
      error: null
    });

    renderHome();
    
    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });

  it('displays footer information', () => {
    renderHome();
    
    expect(screen.getByText(/© 2024 Student Marketplace/i)).toBeInTheDocument();
  });

  it('shows theme toggle button', () => {
    renderHome();
    
    const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeToggle).toBeInTheDocument();
  });

  it('handles responsive design elements', () => {
    renderHome();
    
    // Check for mobile menu trigger
    const mobileMenuButton = screen.getByRole('button', { name: /toggle menu/i });
    expect(mobileMenuButton).toBeInTheDocument();
  });
});