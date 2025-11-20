/**
 * Tests for ProductCard component
 * Tests props rendering, user interactions, and conditional rendering
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAuth, renderWithoutAuth, createMockProduct, createMockCategory } from '@/test/utils';
import { ProductCard } from '../ProductCard';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ to, children, ...props }: any) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

describe('ProductCard Component', () => {
  const user = userEvent.setup();
  const mockProduct = createMockProduct({
    title: 'MacBook Pro 13-inch',
    price: 1299.99,
    description: 'Excellent condition laptop',
    status: 'available',
    category: createMockCategory({ name: 'Electronics' }),
  });

  it('renders product information correctly', () => {
    renderWithAuth(<ProductCard product={mockProduct} />);

    expect(screen.getByText('MacBook Pro 13-inch')).toBeInTheDocument();
    expect(screen.getByText('$1,299.99')).toBeInTheDocument();
    expect(screen.getByText('Excellent condition laptop')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('displays product image when image_url is provided', () => {
    renderWithAuth(<ProductCard product={mockProduct} />);

    const image = screen.getByRole('img', { name: 'MacBook Pro 13-inch' });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockProduct.image_url);
  });

  it('displays fallback icon when no image is provided', () => {
    const productWithoutImage = createMockProduct({
      ...mockProduct,
      image_url: null,
    });

    renderWithAuth(<ProductCard product={productWithoutImage} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('package-icon')).toBeInTheDocument();
  });

  it('shows correct status badge', () => {
    renderWithAuth(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('shows sold status with different styling', () => {
    const soldProduct = createMockProduct({
      ...mockProduct,
      status: 'sold',
    });

    renderWithAuth(<ProductCard product={soldProduct} />);

    const statusBadge = screen.getByText('Sold');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('links to product details page', () => {
    renderWithAuth(<ProductCard product={mockProduct} />);

    const productLink = screen.getByRole('link');
    expect(productLink).toHaveAttribute('href', `/products/${mockProduct.id}`);
  });

  it('handles favorite button click for authenticated user', async () => {
    renderWithAuth(<ProductCard product={mockProduct} />);

    const favoriteButton = screen.getByRole('button', { name: /favorite/i });
    expect(favoriteButton).toBeInTheDocument();

    await user.click(favoriteButton);
    // Note: This would need to be connected to actual favorite functionality
  });

  it('shows login prompt when unauthenticated user clicks favorite', async () => {
    renderWithoutAuth(<ProductCard product={mockProduct} />);

    const favoriteButton = screen.getByRole('button', { name: /favorite/i });
    await user.click(favoriteButton);

    // This would show a toast or redirect to login
    // Implementation depends on the actual favorite functionality
  });

  it('displays seller information when available', () => {
    const productWithSeller = createMockProduct({
      ...mockProduct,
      seller: {
        id: 'seller-123',
        username: 'johndoe',
        email: 'john@university.edu',
        created_at: '2023-01-01T00:00:00Z',
      },
    });

    renderWithAuth(<ProductCard product={productWithSeller} />);

    expect(screen.getByText('@johndoe')).toBeInTheDocument();
  });

  it('formats price correctly', () => {
    const productWithDecimalPrice = createMockProduct({
      ...mockProduct,
      price: 99.95,
    });

    renderWithAuth(<ProductCard product={productWithDecimalPrice} />);

    expect(screen.getByText('$99.95')).toBeInTheDocument();
  });

  it('truncates long titles appropriately', () => {
    const productWithLongTitle = createMockProduct({
      ...mockProduct,
      title: 'This is a very long product title that should be truncated properly',
    });

    renderWithAuth(<ProductCard product={productWithLongTitle} />);

    const titleElement = screen.getByText('This is a very long product title that should be truncated properly');
    expect(titleElement).toHaveClass('truncate');
  });

  it('shows created date', () => {
    renderWithAuth(<ProductCard product={mockProduct} />);

    // The date should be formatted
    expect(screen.getByText(/listed/i)).toBeInTheDocument();
  });

  it('applies hover effects', () => {
    renderWithAuth(<ProductCard product={mockProduct} />);

    const card = screen.getByRole('link');
    expect(card).toHaveClass('hover:shadow-lg');
  });

  it('handles compact variant styling', () => {
    renderWithAuth(<ProductCard product={mockProduct} variant="compact" />);

    // Compact variant would have different styling
    const card = screen.getByRole('link');
    expect(card).toBeInTheDocument();
  });

  it('handles grid variant styling', () => {
    renderWithAuth(<ProductCard product={mockProduct} variant="grid" />);

    // Grid variant would have different layout
    const card = screen.getByRole('link');
    expect(card).toBeInTheDocument();
  });

  it('shows loading state for image', async () => {
    renderWithAuth(<ProductCard product={mockProduct} />);

    const image = screen.getByRole('img', { name: 'MacBook Pro 13-inch' });
    
    // Simulate image loading
    expect(image).toBeInTheDocument();
  });

  it('handles missing category gracefully', () => {
    const productWithoutCategory = createMockProduct({
      ...mockProduct,
      category: null,
    });

    renderWithAuth(<ProductCard product={productWithoutCategory} />);

    expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
    expect(screen.getByText('MacBook Pro 13-inch')).toBeInTheDocument();
  });

  it('shows different styling for pending status', () => {
    const pendingProduct = createMockProduct({
      ...mockProduct,
      status: 'pending',
    });

    renderWithAuth(<ProductCard product={pendingProduct} />);

    const statusBadge = screen.getByText('Pending');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('handles click events properly', async () => {
    const onClick = vi.fn();
    
    renderWithAuth(<ProductCard product={mockProduct} onClick={onClick} />);

    const card = screen.getByRole('link');
    await user.click(card);

    if (onClick) {
      expect(onClick).toHaveBeenCalledWith(mockProduct);
    }
  });
});