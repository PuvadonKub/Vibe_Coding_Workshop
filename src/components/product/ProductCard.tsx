/**
 * Product Card Component
 * Displays product information in a card layout with action buttons
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Eye, 
  Edit, 
  Trash2, 
  User, 
  Calendar, 
  DollarSign,
  MapPin,
  Star,
  ShoppingCart
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth, useIsOwner } from '@/contexts/AuthContext';
import type { Product, ProductWithDetails, User as UserType } from '@/types';

// ==================== Types ====================

interface ProductCardProps {
  product: Product | ProductWithDetails;
  variant?: 'default' | 'compact' | 'featured';
  showActions?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onFavorite?: (product: Product) => void;
  className?: string;
}

// ==================== Utility Functions ====================

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'sold':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'available':
      return 'Available';
    case 'sold':
      return 'Sold';
    case 'pending':
      return 'Pending';
    default:
      return status;
  }
};

// ==================== Main Component ====================

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'default',
  showActions = true,
  onEdit,
  onDelete,
  onFavorite,
  className = '',
}) => {
  const { isAuthenticated } = useAuth();
  const isOwner = useIsOwner(product.seller_id);

  // Check if product has detailed seller information
  const productWithDetails = product as ProductWithDetails;
  const seller = productWithDetails.seller;
  const category = productWithDetails.category;

  // Render different variants
  if (variant === 'compact') {
    return (
      <Card className={`group hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            {/* Product Image */}
            <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <ShoppingCart className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/products/${product.id}`}
                    className="block font-medium text-sm truncate hover:text-primary"
                  >
                    {product.title}
                  </Link>
                  <p className="text-lg font-bold text-primary">
                    {formatPrice(product.price)}
                  </p>
                </div>
                <Badge variant="outline" className={`ml-2 ${getStatusColor(product.status)}`}>
                  {getStatusText(product.status)}
                </Badge>
              </div>

              {product.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'featured') {
    return (
      <Card className={`group hover:shadow-lg transition-all duration-300 ${className}`}>
        <div className="relative">
          {/* Product Image */}
          <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <ShoppingCart className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Status Badge */}
          <Badge 
            className={`absolute top-3 right-3 ${getStatusColor(product.status)}`}
          >
            {getStatusText(product.status)}
          </Badge>

          {/* Favorite Button */}
          {isAuthenticated && onFavorite && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-3 left-3 bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.preventDefault();
                onFavorite(product);
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
          )}
        </div>

        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Title and Price */}
            <div>
              <Link
                to={`/products/${product.id}`}
                className="block font-semibold text-lg hover:text-primary line-clamp-2"
              >
                {product.title}
              </Link>
              <p className="text-2xl font-bold text-primary mt-1">
                {formatPrice(product.price)}
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-muted-foreground text-sm line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Category */}
            {category && (
              <Badge variant="secondary" className="w-fit">
                {category.name}
              </Badge>
            )}

            {/* Seller Info */}
            {seller && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {seller.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground truncate">
                  {seller.username}
                </span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button asChild className="flex-1">
            <Link to={`/products/${product.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </Button>

          {isOwner && showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(product)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete?.(product)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardFooter>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={`group hover:shadow-md transition-shadow ${className}`}>
      <div className="relative">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden rounded-t-lg">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <ShoppingCart className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Status Badge */}
        <Badge 
          className={`absolute top-2 right-2 ${getStatusColor(product.status)}`}
        >
          {getStatusText(product.status)}
        </Badge>

        {/* Action Buttons */}
        {isAuthenticated && (
          <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onFavorite && (
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/80 hover:bg-white"
                onClick={(e) => {
                  e.preventDefault();
                  onFavorite(product);
                }}
              >
                <Heart className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Title */}
          <Link
            to={`/products/${product.id}`}
            className="block font-medium hover:text-primary line-clamp-2"
          >
            {product.title}
          </Link>

          {/* Price */}
          <p className="text-xl font-bold text-primary">
            {formatPrice(product.price)}
          </p>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Category */}
          {category && (
            <Badge variant="secondary" className="w-fit">
              {category.name}
            </Badge>
          )}

          {/* Meta Information */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            {seller && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate">{seller.username}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(product.created_at)}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button asChild variant="outline" className="flex-1">
          <Link to={`/products/${product.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>

        {isOwner && showActions && (
          <>
            {onEdit && (
              <Button variant="outline" size="icon" onClick={() => onEdit(product)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => onDelete(product)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;