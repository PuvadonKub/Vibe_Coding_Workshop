/**
 * Tests for ProductForm component
 * Tests form validation, submission, and edit/create modes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAuth, createMockProduct, createMockCategory, mockToast } from '@/test/utils';
import { ProductForm } from '../ProductForm';

// Mock the useToast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock react-query
const mockUseMutation = vi.fn();
const mockUseQuery = vi.fn();
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useMutation: mockUseMutation,
    useQuery: mockUseQuery,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
  },
  queryKeys: {
    categories: () => ['categories'],
    products: () => ['products'],
  },
}));

describe('ProductForm Component', () => {
  const user = userEvent.setup();
  const mockCategories = [
    createMockCategory({ id: 'cat-1', name: 'Electronics' }),
    createMockCategory({ id: 'cat-2', name: 'Books' }),
  ];

  const onSuccess = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
    
    // Mock categories query
    mockUseQuery.mockReturnValue({
      data: { categories: mockCategories },
      isLoading: false,
      error: null,
    });

    // Mock mutation
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('renders create form with all required fields', () => {
    renderWithAuth(<ProductForm onSuccess={onSuccess} onCancel={onCancel} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/image/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create product/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders edit form with pre-populated data', () => {
    const mockProduct = createMockProduct({
      title: 'iPhone 14 Pro',
      description: 'Latest iPhone model',
      price: 999.99,
      category_id: 'cat-1',
    });

    renderWithAuth(
      <ProductForm 
        product={mockProduct} 
        onSuccess={onSuccess} 
        onCancel={onCancel} 
      />
    );

    expect(screen.getByDisplayValue('iPhone 14 Pro')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Latest iPhone model')).toBeInTheDocument();
    expect(screen.getByDisplayValue('999.99')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update product/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    renderWithAuth(<ProductForm onSuccess={onSuccess} onCancel={onCancel} />);

    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/price must be greater than 0/i)).toBeInTheDocument();
      expect(screen.getByText(/please select a category/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid price', async () => {
    renderWithAuth(<ProductForm onSuccess={onSuccess} onCancel={onCancel} />);

    const priceInput = screen.getByLabelText(/price/i);
    await user.type(priceInput, '-10');

    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/price must be greater than 0/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for title that is too long', async () => {
    renderWithAuth(<ProductForm onSuccess={onSuccess} onCancel={onCancel} />);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'A'.repeat(201)); // Assuming max length is 200

    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title must be less than 200 characters/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data for creating new product', async () => {
    const mockMutate = vi.fn();
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    renderWithAuth(<ProductForm onSuccess={onSuccess} onCancel={onCancel} />);

    // Fill form
    await user.type(screen.getByLabelText(/title/i), 'MacBook Pro');
    await user.type(screen.getByLabelText(/description/i), 'Great laptop for development');
    await user.type(screen.getByLabelText(/price/i), '1299.99');
    
    // Select category
    await user.click(screen.getByLabelText(/category/i));
    await user.click(screen.getByText('Electronics'));

    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        title: 'MacBook Pro',
        description: 'Great laptop for development',
        price: 1299.99,
        category_id: 'cat-1',
        image_url: undefined,
      });
    });
  });

  it('submits form with valid data for updating existing product', async () => {
    const mockProduct = createMockProduct();
    const mockMutate = vi.fn();
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    renderWithAuth(
      <ProductForm 
        product={mockProduct} 
        onSuccess={onSuccess} 
        onCancel={onCancel} 
      />
    );

    // Update title
    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Product Title');

    const submitButton = screen.getByRole('button', { name: /update product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        id: mockProduct.id,
        title: 'Updated Product Title',
        description: mockProduct.description,
        price: mockProduct.price,
        category_id: mockProduct.category_id,
        image_url: mockProduct.image_url,
      });
    });
  });

  it('handles image file selection', async () => {
    renderWithAuth(<ProductForm onSuccess={onSuccess} onCancel={onCancel} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/image/i);

    await user.upload(fileInput, file);

    expect(fileInput.files![0]).toBe(file);
    expect(fileInput.files).toHaveLength(1);
  });

  it('shows error for invalid image file type', async () => {
    renderWithAuth(<ProductForm onSuccess={onSuccess} onCancel={onCancel} />);

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/image/i);

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/please select a valid image file/i)).toBeInTheDocument();
    });
  });

  it('handles cancel button click', async () => {
    renderWithAuth(<ProductForm onSuccess={onSuccess} onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('shows loading state while submitting', () => {
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    });

    renderWithAuth(<ProductForm onSuccess={onSuccess} onCancel={onCancel} />);

    const submitButton = screen.getByRole('button', { name: /creating.../i });
    expect(submitButton).toBeDisabled();
  });

  it('displays categories in select dropdown', async () => {
    renderWithAuth(<ProductForm onSuccess={onSuccess} onCancel={onCancel} />);

    const categorySelect = screen.getByLabelText(/category/i);
    await user.click(categorySelect);

    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
  });

  it('shows loading state for categories', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderWithAuth(<ProductForm onSuccess={onSuccess} onCancel={onCancel} />);

    expect(screen.getByText(/loading categories.../i)).toBeInTheDocument();
  });

  it('handles mutation success', async () => {
    const mockMutate = vi.fn((data, { onSuccess: successCallback }) => {
      successCallback(createMockProduct(data));
    });

    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    renderWithAuth(<ProductForm onSuccess={onSuccess} onCancel={onCancel} />);

    // Fill and submit form
    await user.type(screen.getByLabelText(/title/i), 'Test Product');
    await user.type(screen.getByLabelText(/price/i), '99.99');
    await user.click(screen.getByLabelText(/category/i));
    await user.click(screen.getByText('Electronics'));

    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('handles mutation error', async () => {
    const mockMutate = vi.fn((data, { onError: errorCallback }) => {
      errorCallback(new Error('Failed to create product'));
    });

    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    renderWithAuth(<ProductForm onSuccess={onSuccess} onCancel={onCancel} />);

    // Fill and submit form
    await user.type(screen.getByLabelText(/title/i), 'Test Product');
    await user.type(screen.getByLabelText(/price/i), '99.99');
    await user.click(screen.getByLabelText(/category/i));
    await user.click(screen.getByText('Electronics'));

    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to create product',
        variant: 'destructive',
      });
    });
  });

  it('formats price input correctly', async () => {
    renderWithAuth(<ProductForm onSuccess={onSuccess} onCancel={onCancel} />);

    const priceInput = screen.getByLabelText(/price/i);
    await user.type(priceInput, '123.456');

    expect(priceInput).toHaveValue(123.456);
  });

  it('shows character count for description', async () => {
    renderWithAuth(<ProductForm onSuccess={onSuccess} onCancel={onCancel} />);

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'Test description');

    expect(screen.getByText(/16\/500 characters/i)).toBeInTheDocument();
  });
});