/**
 * Tests for ProductList component
 * Tests product display, loading states, and empty states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAuth, createMockProduct, mockApiResponses } from '@/test/utils';
import { ProductList } from '../ProductList';

// Mock react-query
const mockUseQuery = vi.fn();
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: mockUseQuery,
  };
});

// Mock ProductCard component
vi.mock('../ProductCard', () => ({
  ProductCard: ({ product }: any) => (
    <div data-testid="product-card">
      <h3>{product.title}</h3>
      <p>${product.price}</p>
    </div>
  ),
}));

describe('ProductList Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderWithAuth(<ProductList />);

    expect(screen.getByText(/loading products/i)).toBeInTheDocument();
  });

  it('renders products when data is loaded', () => {
    mockUseQuery.mockReturnValue({
      data: mockApiResponses.products,
      isLoading: false,
      error: null,
    });

    renderWithAuth(<ProductList />);

    const productCards = screen.getAllByTestId('product-card');
    expect(productCards).toHaveLength(2);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Another Product')).toBeInTheDocument();
  });

  it('shows empty state when no products are available', () => {
    mockUseQuery.mockReturnValue({
      data: { products: [], total: 0, page: 1, per_page: 10, pages: 0 },
      isLoading: false,
      error: null,
    });

    renderWithAuth(<ProductList />);

    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
    expect(screen.getByText(/try adjusting your search/i)).toBeInTheDocument();
  });

  it('shows error state when there is an error', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch products'),
    });

    renderWithAuth(<ProductList />);

    expect(screen.getByText(/error loading products/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('handles retry button click', async () => {
    const refetch = vi.fn();
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch products'),
      refetch,
    });

    renderWithAuth(<ProductList />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    expect(refetch).toHaveBeenCalled();
  });

  it('displays pagination information', () => {
    const paginatedData = {
      products: [createMockProduct(), createMockProduct()],
      total: 25,
      page: 2,
      per_page: 10,
      pages: 3,
    };

    mockUseQuery.mockReturnValue({
      data: paginatedData,
      isLoading: false,
      error: null,
    });

    renderWithAuth(<ProductList />);

    expect(screen.getByText(/showing 11-20 of 25 products/i)).toBeInTheDocument();
  });

  it('renders products in grid layout by default', () => {
    mockUseQuery.mockReturnValue({
      data: mockApiResponses.products,
      isLoading: false,
      error: null,
    });

    renderWithAuth(<ProductList />);

    const container = screen.getByTestId('products-grid');
    expect(container).toHaveClass('grid');
  });

  it('renders products in list layout when specified', () => {
    mockUseQuery.mockReturnValue({
      data: mockApiResponses.products,
      isLoading: false,
      error: null,
    });

    renderWithAuth(<ProductList layout="list" />);

    const container = screen.getByTestId('products-list');
    expect(container).toHaveClass('space-y-4');
  });

  it('handles search filters correctly', () => {
    const searchFilters = {
      search: 'laptop',
      category_id: 'electronics',
      min_price: 100,
      max_price: 2000,
    };

    mockUseQuery.mockReturnValue({
      data: mockApiResponses.products,
      isLoading: false,
      error: null,
    });

    renderWithAuth(<ProductList filters={searchFilters} />);

    // Verify that useQuery was called with correct parameters
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['products', searchFilters]),
      })
    );
  });

  it('shows loading skeleton for individual products', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderWithAuth(<ProductList />);

    const skeletons = screen.getAllByTestId('product-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles infinite scroll loading', async () => {
    const fetchNextPage = vi.fn();
    mockUseQuery.mockReturnValue({
      data: mockApiResponses.products,
      isLoading: false,
      error: null,
      hasNextPage: true,
      fetchNextPage,
      isFetchingNextPage: false,
    });

    renderWithAuth(<ProductList enableInfiniteScroll />);

    // Simulate scrolling to bottom
    const loadMoreButton = screen.getByRole('button', { name: /load more/i });
    await user.click(loadMoreButton);

    expect(fetchNextPage).toHaveBeenCalled();
  });

  it('shows "Load More" button when there are more pages', () => {
    mockUseQuery.mockReturnValue({
      data: { 
        ...mockApiResponses.products,
        page: 1,
        pages: 3
      },
      isLoading: false,
      error: null,
      hasNextPage: true,
    });

    renderWithAuth(<ProductList />);

    expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
  });

  it('disables "Load More" button when loading more products', () => {
    mockUseQuery.mockReturnValue({
      data: mockApiResponses.products,
      isLoading: false,
      error: null,
      hasNextPage: true,
      isFetchingNextPage: true,
    });

    renderWithAuth(<ProductList />);

    const loadMoreButton = screen.getByRole('button', { name: /loading more.../i });
    expect(loadMoreButton).toBeDisabled();
  });

  it('handles sorting options', () => {
    const sortBy = 'price_asc';
    mockUseQuery.mockReturnValue({
      data: mockApiResponses.products,
      isLoading: false,
      error: null,
    });

    renderWithAuth(<ProductList sortBy={sortBy} />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['products', expect.objectContaining({ sort: sortBy })]),
      })
    );
  });

  it('shows results count', () => {
    mockUseQuery.mockReturnValue({
      data: { ...mockApiResponses.products, total: 42 },
      isLoading: false,
      error: null,
    });

    renderWithAuth(<ProductList />);

    expect(screen.getByText(/42 products/i)).toBeInTheDocument();
  });

  it('handles category filtering', () => {
    const categoryId = 'electronics-123';
    mockUseQuery.mockReturnValue({
      data: mockApiResponses.products,
      isLoading: false,
      error: null,
    });

    renderWithAuth(<ProductList categoryId={categoryId} />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['products', expect.objectContaining({ category_id: categoryId })]),
      })
    );
  });

  it('refreshes data when filters change', async () => {
    const { rerender } = renderWithAuth(<ProductList filters={{ search: 'laptop' }} />);
    
    mockUseQuery.mockReturnValue({
      data: mockApiResponses.products,
      isLoading: false,
      error: null,
    });

    // Change filters
    rerender(<ProductList filters={{ search: 'phone' }} />);

    await waitFor(() => {
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining(['products', expect.objectContaining({ search: 'phone' })]),
        })
      );
    });
  });
});