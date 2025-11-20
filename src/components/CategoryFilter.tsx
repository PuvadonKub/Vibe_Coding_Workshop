/**
 * Enhanced Category Filter Component
 * Integrates with API to display categories with product counts
 */

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Laptop, Home, Car, Shirt, Coffee, Layers, Grid3x3 } from "lucide-react";
import { useCategoriesWithCount } from '@/hooks/useCategories';
import type { CategoryWithProductCount } from '@/types';

// ==================== Category Icons ====================

const categoryIcons: Record<string, React.ComponentType<any>> = {
  'textbooks': BookOpen,
  'electronics': Laptop,
  'housing': Home,
  'transportation': Car,
  'clothing': Shirt,
  'services': Coffee,
  'furniture': Home,
  'books': BookOpen,
  'technology': Laptop,
  'default': Layers,
};

const getCategoryIcon = (categoryName: string): React.ComponentType<any> => {
  const key = categoryName.toLowerCase().replace(/\s+/g, '');
  return categoryIcons[key] || categoryIcons.default;
};

// ==================== Types ====================

interface CategoryFilterProps {
  selectedCategory?: string;
  onCategoryChange: (categoryId?: string) => void;
  showProductCount?: boolean;
  className?: string;
}

// ==================== Component ====================

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  showProductCount = true,
  className = "",
}) => {
  const { data: categoriesResponse, isLoading, error } = useCategoriesWithCount();
  const categories = categoriesResponse?.categories || [];

  // ==================== Handlers ====================

  const handleCategoryClick = (categoryId?: string) => {
    onCategoryChange(categoryId);
  };

  // ==================== Loading State ====================

  if (isLoading) {
    return (
      <div className={`bg-card border border-border rounded-lg p-6 shadow-md ${className}`}>
        <h3 className="text-lg font-semibold mb-4">Categories</h3>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // ==================== Error State ====================

  if (error) {
    return (
      <div className={`bg-card border border-border rounded-lg p-6 shadow-md ${className}`}>
        <h3 className="text-lg font-semibold mb-4">Categories</h3>
        <p className="text-sm text-muted-foreground">Failed to load categories</p>
      </div>
    );
  }

  // ==================== Render ====================

  return (
    <div className={`bg-card border border-border rounded-lg p-6 shadow-md ${className}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Grid3x3 className="h-5 w-5" />
        Categories
      </h3>
      
      <div className="space-y-2">
        {/* All Categories Option */}
        <Button
          variant={!selectedCategory ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => handleCategoryClick(undefined)}
        >
          <Layers className="h-4 w-4 mr-2" />
          All Categories
          {showProductCount && (
            <Badge variant="secondary" className="ml-auto">
              {categories.reduce((total, cat) => total + (cat.productCount || 0), 0)}
            </Badge>
          )}
        </Button>

        {/* Individual Categories */}
        {categories.map((category: CategoryWithProductCount) => {
          const Icon = getCategoryIcon(category.name);
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleCategoryClick(category.id)}
            >
              <Icon className="h-4 w-4 mr-2" />
              <span className="flex-1 text-left">{category.name}</span>
              {showProductCount && category.productCount !== undefined && (
                <Badge 
                  variant={isSelected ? "outline" : "secondary"} 
                  className="ml-2"
                >
                  {category.productCount}
                </Badge>
              )}
            </Button>
          );
        })}

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No categories available</p>
          </div>
        )}
      </div>

      {/* Category Stats */}
      {categories.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {categories.length} categories available
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;