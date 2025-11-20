import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductDetails from '../ProductDetails';
import { AuthProvider } from '@/contexts/AuthContext';
import { createMockUser, createMockProduct } from '../../../tests/utils';

// Mock product data
const mockProduct = createMockProduct({
  id: 'product-123',
  title: 'Test Product',
  description: 'This is a test product description',
  price: 99.99,
  sellerId: 'seller-456',
  seller: {
    id: 'seller-456',
    username: 'testuser',
    email: 'test@example.com'
  }
});

// Mock API hooks
vi.mock('@/hooks/useProducts', () => ({
  useProduct: () => ({
    data: mockProduct,
    isLoading: false,
    error: null
  })
}));

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'product-123' })
  };
});

const renderProductDetails = (user = null, initialEntries = ['/products/product-123']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider initialUser={user}>
          <ProductDetails />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProductDetails Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product details page', () => {
    renderProductDetails();
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('This is a test product description')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('displays seller information', () => {
    renderProductDetails();
    
    expect(screen.getByText(/sold by/i)).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('shows contact seller button for authenticated users', () => {
    const mockUser = createMockUser({ id: 'buyer-789' });
    renderProductDetails(mockUser);
    
    expect(screen.getByRole('button', { name: /contact seller/i })).toBeInTheDocument();
  });

  it('shows login prompt for unauthenticated users', () => {
    renderProductDetails();
    
    expect(screen.getByText(/sign in to contact seller/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('hides contact button for product owner', () => {
    const mockUser = createMockUser({ id: 'seller-456' });
    renderProductDetails(mockUser);
    
    expect(screen.queryByRole('button', { name: /contact seller/i })).not.toBeInTheDocument();
    expect(screen.getByText(/this is your product/i)).toBeInTheDocument();
  });

  it('shows edit and delete buttons for product owner', () => {
    const mockUser = createMockUser({ id: 'seller-456' });
    renderProductDetails(mockUser);
    
    expect(screen.getByRole('button', { name: /edit product/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete product/i })).toBeInTheDocument();
  });

  it('displays product images', () => {
    const productWithImages = {
      ...mockProduct,
      images: [
        { id: '1', url: '/image1.jpg', altText: 'Product image 1' },
        { id: '2', url: '/image2.jpg', altText: 'Product image 2' }
      ]
    };

    vi.mocked(require('@/hooks/useProducts').useProduct).mockReturnValue({
      data: productWithImages,
      isLoading: false,
      error: null
    });

    renderProductDetails();
    
    expect(screen.getByAltText('Product image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Product image 2')).toBeInTheDocument();
  });

  it('shows placeholder when no images', () => {
    renderProductDetails();
    
    expect(screen.getByText(/no image available/i)).toBeInTheDocument();
  });

  it('displays product category', () => {
    const productWithCategory = {
      ...mockProduct,
      category: { id: '1', name: 'Electronics', description: 'Electronic items' }
    };

    vi.mocked(require('@/hooks/useProducts').useProduct).mockReturnValue({
      data: productWithCategory,
      isLoading: false,
      error: null
    });

    renderProductDetails();
    
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('shows availability status', () => {
    renderProductDetails();
    
    expect(screen.getByText(/available/i)).toBeInTheDocument();
  });

  it('displays created date', () => {
    renderProductDetails();
    
    expect(screen.getByText(/listed/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(require('@/hooks/useProducts').useProduct).mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    });

    renderProductDetails();
    
    expect(screen.getByText(/loading product/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    vi.mocked(require('@/hooks/useProducts').useProduct).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Product not found')
    });

    renderProductDetails();
    
    expect(screen.getByText(/product not found/i)).toBeInTheDocument();
  });

  it('shows 404 message for non-existent product', () => {
    vi.mocked(require('@/hooks/useProducts').useProduct).mockReturnValue({
      data: null,
      isLoading: false,
      error: { status: 404, message: 'Product not found' }
    });

    renderProductDetails();
    
    expect(screen.getByText(/product not found/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to marketplace/i })).toBeInTheDocument();
  });

  it('handles contact seller action', async () => {
    const mockUser = createMockUser({ id: 'buyer-789' });
    renderProductDetails(mockUser);
    
    const contactButton = screen.getByRole('button', { name: /contact seller/i });
    fireEvent.click(contactButton);
    
    // Should open contact dialog or navigate to messaging
    await waitFor(() => {
      expect(screen.getByText(/contact testuser/i)).toBeInTheDocument();
    });
  });

  it('navigates back to marketplace', () => {
    renderProductDetails();
    
    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });

  it('displays related products', () => {
    const relatedProducts = [
      createMockProduct({ id: '2', title: 'Related Product 1' }),
      createMockProduct({ id: '3', title: 'Related Product 2' })
    ];

    vi.mocked(require('@/hooks/useProducts').useProduct).mockReturnValue({
      data: { ...mockProduct, relatedProducts },
      isLoading: false,
      error: null
    });

    renderProductDetails();
    
    expect(screen.getByText(/similar products/i)).toBeInTheDocument();
    expect(screen.getByText('Related Product 1')).toBeInTheDocument();
    expect(screen.getByText('Related Product 2')).toBeInTheDocument();
  });

  it('handles image gallery navigation', () => {
    const productWithImages = {
      ...mockProduct,
      images: [
        { id: '1', url: '/image1.jpg', altText: 'Image 1' },
        { id: '2', url: '/image2.jpg', altText: 'Image 2' },
        { id: '3', url: '/image3.jpg', altText: 'Image 3' }
      ]
    };

    vi.mocked(require('@/hooks/useProducts').useProduct).mockReturnValue({
      data: productWithImages,
      isLoading: false,
      error: null
    });

    renderProductDetails();
    
    const nextButton = screen.getByRole('button', { name: /next image/i });
    const prevButton = screen.getByRole('button', { name: /previous image/i });
    
    expect(nextButton).toBeInTheDocument();
    expect(prevButton).toBeInTheDocument();
  });

  it('shows product condition if available', () => {
    const productWithCondition = {
      ...mockProduct,
      condition: 'Like New'
    };

    vi.mocked(require('@/hooks/useProducts').useProduct).mockReturnValue({
      data: productWithCondition,
      isLoading: false,
      error: null
    });

    renderProductDetails();
    
    expect(screen.getByText('Like New')).toBeInTheDocument();
  });
});