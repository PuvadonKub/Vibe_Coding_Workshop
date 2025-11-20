/**
 * Advanced Search Component with debounced input and filters
 * Provides comprehensive product search functionality
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCategories } from '@/hooks/useCategories';
import type { ProductQueryParams } from '@/types';

// ==================== Types ====================

interface SearchFilters {
  search: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface SearchBarProps {
  onFiltersChange: (filters: ProductQueryParams) => void;
  initialFilters?: Partial<SearchFilters>;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  className?: string;
}

// ==================== Constants ====================

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First', field: 'created_at', order: 'desc' },
  { value: 'oldest', label: 'Oldest First', field: 'created_at', order: 'asc' },
  { value: 'price-low', label: 'Price: Low to High', field: 'price', order: 'asc' },
  { value: 'price-high', label: 'Price: High to Low', field: 'price', order: 'desc' },
  { value: 'title-az', label: 'Title: A-Z', field: 'title', order: 'asc' },
  { value: 'title-za', label: 'Title: Z-A', field: 'title', order: 'desc' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
  { value: 'pending', label: 'Pending' },
];

const DEFAULT_PRICE_RANGE = [0, 1000];

// ==================== Component ====================

export const SearchBar: React.FC<SearchBarProps> = ({
  onFiltersChange,
  initialFilters = {},
  placeholder = 'Search products...',
  showAdvancedFilters = true,
  className = '',
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    categoryId: undefined,
    minPrice: DEFAULT_PRICE_RANGE[0],
    maxPrice: DEFAULT_PRICE_RANGE[1],
    status: 'available',
    sortBy: 'newest',
    ...initialFilters,
  });

  const [priceRange, setPriceRange] = useState<number[]>([
    filters.minPrice || DEFAULT_PRICE_RANGE[0],
    filters.maxPrice || DEFAULT_PRICE_RANGE[1],
  ]);

  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input for better performance\n  const debouncedSearch = useDebounce(filters.search, 300);

  // Fetch categories for filter dropdown
  const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories();
  const categories = categoriesResponse?.categories || [];

  // ==================== Effects ====================

  useEffect(() => {
    // Convert internal filters to API query params
    const queryParams: ProductQueryParams = {
      search: debouncedSearch || undefined,
      category_id: filters.categoryId || undefined,
      min_price: filters.minPrice || undefined,
      max_price: filters.maxPrice || undefined,
      status: filters.status === 'all' ? undefined : filters.status,
    };

    // Add sorting
    const sortOption = SORT_OPTIONS.find(opt => opt.value === filters.sortBy);
    if (sortOption) {
      queryParams.sort_by = sortOption.field;
      queryParams.sort_order = sortOption.order as 'asc' | 'desc';
    }

    onFiltersChange(queryParams);
  }, [debouncedSearch, filters, onFiltersChange]);

  // Update price range when slider changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
    }));
  }, [priceRange]);

  // ==================== Handlers ====================

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearSearch = () => {
    setFilters(prev => ({ ...prev, search: '' }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: filters.search, // Keep search term
      categoryId: undefined,
      minPrice: DEFAULT_PRICE_RANGE[0],
      maxPrice: DEFAULT_PRICE_RANGE[1],
      status: 'available',
      sortBy: 'newest',
    });
    setPriceRange(DEFAULT_PRICE_RANGE);
  };

  // ==================== Computed Values ====================

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.categoryId) count++;
    if (filters.minPrice !== DEFAULT_PRICE_RANGE[0]) count++;
    if (filters.maxPrice !== DEFAULT_PRICE_RANGE[1]) count++;
    if (filters.status !== 'available') count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  }, [filters]);

  const selectedCategory = categories.find(cat => cat.id === filters.categoryId);
  const selectedStatus = STATUS_OPTIONS.find(opt => opt.value === filters.status);
  const selectedSort = SORT_OPTIONS.find(opt => opt.value === filters.sortBy);

  // ==================== Render ====================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Sort Dropdown */}
        <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        {showAdvancedFilters && (
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    disabled={activeFiltersCount === 0}
                  >
                    Clear all
                  </Button>
                </div>

                <Separator />

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={filters.categoryId || 'all'} 
                    onValueChange={(value) => 
                      handleFilterChange('categoryId', value === 'all' ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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
                <div className="space-y-4">
                  <Label>Price Range</Label>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={1000}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1">
              {selectedCategory.name}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('categoryId', undefined)}
              />
            </Badge>
          )}
          
          {filters.status !== 'available' && selectedStatus && (
            <Badge variant="secondary" className="gap-1">
              {selectedStatus.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('status', 'available')}
              />
            </Badge>
          )}
          
          {(filters.minPrice !== DEFAULT_PRICE_RANGE[0] || filters.maxPrice !== DEFAULT_PRICE_RANGE[1]) && (
            <Badge variant="secondary" className="gap-1">
              ${filters.minPrice} - ${filters.maxPrice}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setPriceRange(DEFAULT_PRICE_RANGE)}
              />
            </Badge>
          )}
          
          {filters.sortBy !== 'newest' && selectedSort && (
            <Badge variant="secondary" className="gap-1">
              {selectedSort.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('sortBy', 'newest')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;