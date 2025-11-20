/**
 * React Query hooks for product management
 * Provides data fetching, caching, and state management for products
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '@/lib/api';
import type { 
  Product, 
  ProductCreate, 
  ProductUpdate, 
  ProductListResponse, 
  ProductQueryParams,
  ProductWithDetails 
} from '@/types';
import { useToast } from '@/components/ui/use-toast';

// ==================== Query Hooks ====================

/**
 * Hook to fetch products with optional filtering and pagination
 */
export const useProducts = (params: ProductQueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => api.getProducts(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a specific product by ID
 */
export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: queryKeys.product(productId),
    queryFn: () => api.getProduct(productId),
    enabled: !!productId,
  });
};

/**
 * Hook to fetch products by a specific user
 */
export const useUserProducts = (userId: string, params: ProductQueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.userProducts(userId, params),
    queryFn: () => api.getUserProducts(userId, params),
    enabled: !!userId,
  });
};

/**
 * Hook for searching products with debouncing
 */
export const useSearchProducts = (query: string, params: ProductQueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.products({ ...params, search: query }),
    queryFn: () => api.searchProducts(query, params),
    enabled: query.length >= 2, // Only search with 2+ characters
    staleTime: 30 * 1000, // 30 seconds
  });
};

// ==================== Mutation Hooks ====================

/**
 * Hook to create a new product
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (productData: ProductCreate) => api.createProduct(productData),
    onSuccess: (newProduct) => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['userProducts'] });
      
      toast({
        title: 'Success',
        description: 'Product created successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create product',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to update a product
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: ProductUpdate }) =>
      api.updateProduct(productId, data),
    onSuccess: (updatedProduct, { productId }) => {
      // Update the specific product in cache
      queryClient.setQueryData(queryKeys.product(productId), updatedProduct);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['userProducts'] });
      
      toast({
        title: 'Success',
        description: 'Product updated successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to delete a product
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (productId: string) => api.deleteProduct(productId),
    onSuccess: (_, productId) => {
      // Remove the product from cache
      queryClient.removeQueries({ queryKey: queryKeys.product(productId) });
      
      // Invalidate product lists
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['userProducts'] });
      
      toast({
        title: 'Success',
        description: 'Product deleted successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    },
  });
};

// ==================== Utility Hooks ====================

/**
 * Hook to get optimistic updates for better UX
 */
export const useOptimisticProductUpdate = () => {
  const queryClient = useQueryClient();

  const updateProductOptimistically = (productId: string, updates: Partial<Product>) => {
    queryClient.setQueryData(queryKeys.product(productId), (oldData: ProductWithDetails) => {
      if (!oldData) return oldData;
      return { ...oldData, ...updates };
    });
  };

  return { updateProductOptimistically };
};

/**
 * Hook to prefetch products for better performance
 */
export const usePrefetchProducts = () => {
  const queryClient = useQueryClient();

  const prefetchProducts = (params: ProductQueryParams = {}) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.products(params),
      queryFn: () => api.getProducts(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchProduct = (productId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.product(productId),
      queryFn: () => api.getProduct(productId),
      staleTime: 5 * 60 * 1000,
    });
  };

  return { prefetchProducts, prefetchProduct };
};

// ==================== Export Helper Functions ====================

/**
 * Function to keep previous data during refetching
 */
function keepPreviousData(previousData: ProductListResponse | undefined) {
  return previousData;
}

// Export all hooks and utilities
export {
  useOptimisticProductUpdate,
  usePrefetchProducts,
  keepPreviousData,
};