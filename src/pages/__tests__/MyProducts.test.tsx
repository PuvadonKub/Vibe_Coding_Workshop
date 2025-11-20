import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyProducts from '../MyProducts';
import { AuthProvider } from '@/contexts/AuthContext';
import { createMockUser, createMockProduct } from '../../../tests/utils';

// Mock products for current user
const mockUserProducts = [
  createMockProduct({ 
    id: '1', 
    title: 'My Product 1', 
    price: 99.99,
    sellerId: 'user-123'
  }),
  createMockProduct({ 
    id: '2', 
    title: 'My Product 2', 
    price: 149.99,
    sellerId: 'user-123'
  }),
];

// Mock API hooks
vi.mock('@/hooks/useProducts', () => ({
  useUserProducts: () => ({
    data: { products: mockUserProducts, total: mockUserProducts.length },
    isLoading: false,
    error: null
  })
}));

// Mock delete product mutation
const mockDeleteMutation = {
  mutate: vi.fn(),
  isPending: false,
  error: null
};

vi.mock('@/hooks/useProductMutations', () => ({
  useDeleteProduct: () => mockDeleteMutation
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const renderMyProducts = (user = null) => {
  const mockUser = user || createMockUser({ id: 'user-123' });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider initialUser={mockUser}>
          <MyProducts />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('MyProducts Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders my products page with title', () => {
    renderMyProducts();
    
    expect(screen.getByRole('heading', { name: /my products/i })).toBeInTheDocument();
  });

  it('displays add product button', () => {
    renderMyProducts();
    
    const addButton = screen.getByRole('button', { name: /add new product/i });
    expect(addButton).toBeInTheDocument();
  });

  it('navigates to add product page', () => {
    renderMyProducts();
    
    const addButton = screen.getByRole('button', { name: /add new product/i });
    fireEvent.click(addButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/products/new');
  });

  it('displays user products', () => {
    renderMyProducts();
    
    expect(screen.getByText('My Product 1')).toBeInTheDocument();
    expect(screen.getByText('My Product 2')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });

  it('shows edit buttons for each product', () => {
    renderMyProducts();
    
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    expect(editButtons).toHaveLength(2);
  });

  it('shows delete buttons for each product', () => {
    renderMyProducts();
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons).toHaveLength(2);
  });

  it('navigates to edit product page', () => {
    renderMyProducts();
    
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/products/1/edit');
  });

  it('handles product deletion with confirmation', async () => {
    renderMyProducts();
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockDeleteMutation.mutate).toHaveBeenCalledWith('1', expect.any(Object));
    });
  });

  it('cancels product deletion', async () => {
    renderMyProducts();
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockDeleteMutation.mutate).not.toHaveBeenCalled();
  });

  it('shows empty state when no products', () => {
    vi.mocked(require('@/hooks/useProducts').useUserProducts).mockReturnValue({
      data: { products: [], total: 0 },
      isLoading: false,
      error: null
    });

    renderMyProducts();
    
    expect(screen.getByText(/no products yet/i)).toBeInTheDocument();
    expect(screen.getByText(/start selling/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(require('@/hooks/useProducts').useUserProducts).mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    });

    renderMyProducts();
    
    expect(screen.getByText(/loading your products/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    vi.mocked(require('@/hooks/useProducts').useUserProducts).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load products')
    });

    renderMyProducts();
    
    expect(screen.getByText(/error loading products/i)).toBeInTheDocument();
  });

  it('displays product stats', () => {
    renderMyProducts();
    
    expect(screen.getByText(/2 products/i)).toBeInTheDocument();
  });

  it('shows product availability status', () => {
    renderMyProducts();
    
    expect(screen.getAllByText(/available/i)).toHaveLength(2);
  });

  it('handles product view navigation', () => {
    renderMyProducts();
    
    const productCards = screen.getAllByRole('button', { name: /view details/i });
    fireEvent.click(productCards[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/products/1');
  });

  it('shows success message after product deletion', async () => {
    mockDeleteMutation.mutate.mockImplementation((_, { onSuccess }) => {
      onSuccess();
    });

    renderMyProducts();
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.getByText(/product deleted successfully/i)).toBeInTheDocument();
    });
  });

  it('shows error message on deletion failure', async () => {
    mockDeleteMutation.error = new Error('Failed to delete product');

    renderMyProducts();
    
    expect(screen.getByText(/failed to delete product/i)).toBeInTheDocument();
  });

  it('disables actions during deletion', () => {
    mockDeleteMutation.isPending = true;

    renderMyProducts();
    
    const deleteButtons = screen.getAllByRole('button', { name: /deleting/i });
    expect(deleteButtons[0]).toBeDisabled();
  });
});