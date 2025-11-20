/**
 * Product List Component
 * Displays a grid of products with loading states, empty states, and pagination
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Grid, List, SortAsc, SortDesc, Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';

import { ProductCard } from './ProductCard';
import { api, queryKeys } from '@/lib/api';
import type { 
  Product, 
  ProductQueryParams, 
  ProductStatus, 
  Category, 
  SortOrder,
  SortOption 
} from '@/types';

// ==================== Types ====================

interface ProductListProps {
  categoryId?: string;
  sellerId?: string;
  initialFilters?: ProductQueryParams;
  showFilters?: boolean;
  variant?: 'grid' | 'list';
  className?: string;
}

interface FilterState extends ProductQueryParams {
  sortBy?: keyof Product;
  sortOrder?: SortOrder;
}

// ==================== Constants ====================

const SORT_OPTIONS: SortOption[] = [
  { key: 'created_at', label: 'Date Added', order: 'desc' },
  { key: 'price', label: 'Price: Low to High', order: 'asc' },
  { key: 'price', label: 'Price: High to Low', order: 'desc' },
  { key: 'title', label: 'Title A-Z', order: 'asc' },
  { key: 'title', label: 'Title Z-A', order: 'desc' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
  { value: 'pending', label: 'Pending' },
];

// ==================== Helper Components ====================

const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <div className="aspect-square bg-gray-200 animate-pulse" />
        <CardContent className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
          <div className="h-3 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const EmptyState: React.FC<{ message?: string; showCreateButton?: boolean }> = ({ 
  message = "No products found", 
  showCreateButton = false 
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <Search className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
    <p className="text-gray-500 mb-6 max-w-md">
      {message}
    </p>
    {showCreateButton && (
      <Button asChild>
        <a href="/products/new">
          Create Your First Product
        </a>
      </Button>
    )}
  </div>
);

// ==================== Main Component ====================

export const ProductList: React.FC<ProductListProps> = ({
  categoryId,
  sellerId,
  initialFilters = {},
  showFilters = true,
  variant: initialVariant = 'grid',
  className = '',
}) => {
  // State
  const [filters, setFilters] = useState<FilterState>({
    page: 1,
    per_page: 12,
    category_id: categoryId,
    seller_id: sellerId,
    status: 'available',
    ...initialFilters,
  });
  
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [variant, setVariant] = useState(initialVariant);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Queries
  const { data: categories } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => api.getCategories(),
  });

  const { 
    data: productsResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.products(filters),
    queryFn: () => api.getProducts(filters),
    keepPreviousData: true,
  });

  const products = productsResponse?.products || [];
  const totalPages = productsResponse?.total_pages || 0;
  const total = productsResponse?.total || 0;

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchQuery, page: 1 }));
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSortChange = (sortString: string) => {
    const [key, order] = sortString.split(':') as [keyof Product, SortOrder];
    setFilters(prev => ({ ...prev, sortBy: key, sortOrder: order, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      per_page: 12,
      category_id: categoryId,
      seller_id: sellerId,
      status: 'available',
    });
    setSearchQuery('');
  };

  // Filter panel content
  const FilterPanel = () => (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="font-medium mb-3">Filters</h3>
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Clear All
        </Button>
      </div>

      {/* Category Filter */}
      {!categoryId && categories && (
        <div>
          <Label className="text-sm font-medium">Category</Label>
          <Select
            value={filters.category_id || 'all'}
            onValueChange={(value) => handleFilterChange('category_id', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.categories.map((category: Category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Status Filter */}
      <div>
        <Label className="text-sm font-medium">Status</Label>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Price Range</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="minPrice" className="text-xs text-muted-foreground">Min</Label>
            <Input
              id="minPrice"
              type="number"
              placeholder="$0"
              min="0"
              step="0.01"
              value={filters.min_price || ''}
              onChange={(e) => handleFilterChange('min_price', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div>
            <Label htmlFor="maxPrice" className="text-xs text-muted-foreground">Max</Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="Any"
              min="0"
              step="0.01"
              value={filters.max_price || ''}
              onChange={(e) => handleFilterChange('max_price', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Sort */}
          <Select
            value={filters.sortBy && filters.sortOrder ? `${filters.sortBy}:${filters.sortOrder}` : 'created_at:desc'}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={`${option.key}:${option.order}`} value={`${option.key}:${option.order}`}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={variant === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVariant('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={variant === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVariant('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Products</SheetTitle>
                  <SheetDescription>
                    Narrow down your search with filters
                  </SheetDescription>
                </SheetHeader>
                <FilterPanel />
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {isLoading ? 'Loading...' : `${total} product${total !== 1 ? 's' : ''} found`}
        </span>
        
        {/* Active Filters */}
        <div className="flex items-center gap-2">
          {filters.category_id && categories && (
            <Badge variant="secondary" className="gap-1">
              Category: {categories.categories.find((cat: Category) => cat.id === filters.category_id)?.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => handleFilterChange('category_id', undefined)}
              >
                ×
              </Button>
            </Badge>
          )}
          {filters.status && filters.status !== 'available' && (
            <Badge variant="secondary" className="gap-1">
              Status: {STATUS_OPTIONS.find(opt => opt.value === filters.status)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => handleFilterChange('status', 'available')}
              >
                ×
              </Button>
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load products. Please try again.
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <LoadingSkeleton />
      ) : products.length === 0 ? (
        <EmptyState 
          message={filters.search ? `No products found for "${filters.search}"` : 'No products available'}
          showCreateButton={!sellerId && !categoryId}
        />
      ) : (
        <>
          {/* Products Grid/List */}
          <div className={
            variant === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant={variant === 'list' ? 'compact' : 'default'}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <Button
                variant="outline"
                disabled={filters.page === 1}
                onClick={() => handlePageChange(filters.page! - 1)}
              >
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground px-4">
                Page {filters.page} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                disabled={filters.page === totalPages}
                onClick={() => handlePageChange(filters.page! + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList;