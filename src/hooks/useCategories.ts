/**
 * React Query hooks for category management
 * Provides data fetching, caching, and state management for categories
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '@/lib/api';
import type { 
  Category, 
  CategoryCreate, 
  CategoryUpdate, 
  CategoryListResponse,
  CategoryProductsQueryParams,
  CategoryWithProductCount
} from '@/types';
import { useToast } from '@/components/ui/use-toast';

// ==================== Query Hooks ====================

/**
 * Hook to fetch all categories
 */
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => api.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
  });
};

/**
 * Hook to fetch categories with product count
 */
export const useCategoriesWithCount = () => {
  return useQuery({
    queryKey: queryKeys.categoriesWithCount,
    queryFn: () => api.getCategoriesWithCount(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a specific category by ID
 */
export const useCategory = (categoryId: string) => {
  return useQuery({
    queryKey: queryKeys.category(categoryId),
    queryFn: () => api.getCategory(categoryId),
    enabled: !!categoryId,
  });
};

/**
 * Hook to fetch products in a specific category
 */
export const useCategoryProducts = (
  categoryId: string, 
  params: CategoryProductsQueryParams = {}
) => {
  return useQuery({
    queryKey: queryKeys.categoryProducts(categoryId, params),
    queryFn: () => api.getCategoryProducts(categoryId, params),
    enabled: !!categoryId,
  });
};

/**
 * Hook to fetch category statistics
 */
export const useCategoryStats = (categoryId: string) => {
  return useQuery({
    queryKey: queryKeys.categoryStats(categoryId),
    queryFn: () => api.getCategoryStats(categoryId),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
};

// ==================== Mutation Hooks ====================

/**
 * Hook to create a new category (admin only)
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (categoryData: CategoryCreate) => api.createCategory(categoryData),
    onSuccess: (newCategory) => {
      // Invalidate categories queries
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      toast({
        title: 'Success',
        description: 'Category created successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create category',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to update a category (admin only)
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: CategoryUpdate }) =>
      api.updateCategory(categoryId, data),
    onSuccess: (updatedCategory, { categoryId }) => {
      // Update the specific category in cache
      queryClient.setQueryData(queryKeys.category(categoryId), updatedCategory);
      
      // Invalidate categories list
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      toast({
        title: 'Success',
        description: 'Category updated successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to delete a category (admin only)
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (categoryId: string) => api.deleteCategory(categoryId),
    onSuccess: (_, categoryId) => {
      // Remove the category from cache
      queryClient.removeQueries({ queryKey: queryKeys.category(categoryId) });
      
      // Invalidate categories list
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      toast({
        title: 'Success',
        description: 'Category deleted successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      });
    },
  });
};