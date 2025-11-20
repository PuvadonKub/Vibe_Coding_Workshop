/**
 * Enhanced Product List Component with Pagination and Loading States
 * Displays products in a responsive grid with advanced filtering and pagination
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, List, RefreshCw, Package, ArrowUp } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useProducts } from '@/hooks/useProducts';
import type { Product, ProductQueryParams } from '@/types';

// ==================== Types ====================

interface ProductListProps {
  filters?: ProductQueryParams;
  onFiltersChange?: (filters: ProductQueryParams) => void;
  showPagination?: boolean;
  itemsPerPage?: number;
  layout?: 'grid' | 'list';
  className?: string;
}

// ==================== Constants ====================

const DEFAULT_ITEMS_PER_PAGE = 12;

// ==================== Component ====================

export const ProductList: React.FC<ProductListProps> = ({
  filters = {},
  onFiltersChange,
  showPagination = true,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
  layout = 'grid',
  className = '',
}) => {
  const navigate = useNavigate();
  
  // Current page state
  const currentPage = filters.page || 1;

  // Fetch products with filters
  const { 
    data: productsResponse, 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useProducts({
    ...filters,
    per_page: itemsPerPage,
    page: currentPage,
  });

  const products = productsResponse?.products || [];
  const totalProducts = productsResponse?.total || 0;
  const totalPages = productsResponse?.total_pages || 0;

  // ==================== Handlers ====================

  const handleProductSelect = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const handlePageChange = (page: number) => {
    if (onFiltersChange) {
      onFiltersChange({ ...filters, page });
    }
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = () => {
    refetch();
  };

  // ==================== Loading State ====================

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Loading skeleton for grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==================== Error State ====================

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Alert variant="destructive">
          <Package className="h-4 w-4" />
          <AlertDescription>
            Failed to load products. {error.message}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // ==================== Empty State ====================

  if (!isLoading && products.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">
            {Object.keys(filters).length > 0 
              ? "Try adjusting your filters or search terms."
              : "No products are currently available."}
          </p>
          {Object.keys(filters).length > 0 && onFiltersChange && (
            <Button 
              onClick={() => onFiltersChange({})} 
              variant="outline"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ==================== Render Products ====================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts} products
            </p>
          </div>
          {isFetching && (
            <Badge variant="outline" className="animate-pulse">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Updating...
            </Badge>
          )}
        </div>

        {/* Refresh Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Products Grid */}
      <div className={`
        ${layout === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
          : 'space-y-4'
        }
      `}>
        {products.map((product: Product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelect={handleProductSelect}
          />
        ))}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              {/* Previous Page */}
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      handlePageChange(currentPage - 1);
                    }
                  }}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {/* Page Numbers */}
              {renderPaginationItems(currentPage, totalPages, handlePageChange)}

              {/* Next Page */}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      handlePageChange(currentPage + 1);
                    }
                  }}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Back to Top Button */}
      {currentPage > 1 && (
        <div className="fixed bottom-6 right-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="shadow-lg"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

// ==================== Helper Functions ====================

/**
 * Renders pagination items with ellipsis for large page counts
 */
function renderPaginationItems(
  currentPage: number, 
  totalPages: number, 
  onPageChange: (page: number) => void
) {
  const items = [];
  const maxVisiblePages = 5;
  
  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onPageChange(i);
            }}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
  } else {
    // Show pages with ellipsis
    if (currentPage <= 3) {
      // Show first pages
      for (let i = 1; i <= 4; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(i);
              }}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      items.push(<PaginationItem key="ellipsis1"><PaginationEllipsis /></PaginationItem>);
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onPageChange(totalPages);
            }}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    } else if (currentPage >= totalPages - 2) {
      // Show last pages
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onPageChange(1);
            }}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      items.push(<PaginationItem key="ellipsis2"><PaginationEllipsis /></PaginationItem>);
      for (let i = totalPages - 3; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(i);
              }}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Show middle pages
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onPageChange(1);
            }}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      items.push(<PaginationItem key="ellipsis3"><PaginationEllipsis /></PaginationItem>);
      
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(i);
              }}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      items.push(<PaginationItem key="ellipsis4"><PaginationEllipsis /></PaginationItem>);
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onPageChange(totalPages);
            }}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
  }
  
  return items;
}

export default ProductList;
