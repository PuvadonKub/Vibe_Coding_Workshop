/**
 * Product Form Component
 * Create/Edit product with form validation, image upload, and category selection
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  Upload, 
  X, 
  DollarSign, 
  FileText, 
  Tag, 
  Image as ImageIcon,
  Save,
  AlertCircle 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { api, queryKeys } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  Product, 
  ProductCreate, 
  ProductUpdate, 
  ProductFormData, 
  ProductStatus,
  Category 
} from '@/types';

// ==================== Validation Schema ====================

const productSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .min(0.01, 'Price must be greater than $0.01')
    .max(999999.99, 'Price must be less than $1,000,000'),
  category_id: z
    .string()
    .min(1, 'Category is required'),
  image_url: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
});

// ==================== Types ====================

interface ProductFormProps {
  product?: Product;
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
  className?: string;
}

const PRODUCT_STATUSES: { value: ProductStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'pending', label: 'Pending' },
  { value: 'sold', label: 'Sold' },
];

// ==================== Main Component ====================

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSuccess,
  onCancel,
  className = '',
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(product?.image_url || null);

  const isEditing = Boolean(product);

  // Form setup
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product?.title || '',
      description: product?.description || '',
      price: product?.price || 0,
      category_id: product?.category_id || '',
      image_url: product?.image_url || '',
    },
  });

  // Queries
  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => api.getCategories(),
  });

  const categories = categoriesResponse?.categories || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ProductCreate) => api.createProduct(data),
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products() });
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.userProducts(user.id) });
      }
      onSuccess?.(newProduct);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdate }) => 
      api.updateProduct(id, data),
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products() });
      queryClient.invalidateQueries({ queryKey: queryKeys.product(updatedProduct.id) });
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.userProducts(user.id) });
      }
      onSuccess?.(updatedProduct);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadImage(file),
    onSuccess: (response) => {
      form.setValue('image_url', response.image_url);
      setPreviewImage(response.image_url);
    },
    onError: () => {
      // Handle upload error
    },
  });

  // Handlers
  const onSubmit = async (data: ProductFormData) => {
    try {
      // Convert form data to API format
      const productData = {
        title: data.title,
        description: data.description || undefined,
        price: Number(data.price),
        category_id: data.category_id,
        image_url: data.image_url || undefined,
      };

      if (isEditing && product) {
        await updateMutation.mutateAsync({ id: product.id, data: productData });
      } else {
        await createMutation.mutateAsync(productData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      form.setError('image_url', { message: 'Please select a valid image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      form.setError('image_url', { message: 'Image size must be less than 5MB' });
      return;
    }

    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync(file);
    } catch (error) {
      form.setError('image_url', { message: 'Failed to upload image. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    form.setValue('image_url', '');
    setPreviewImage(null);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error || uploadMutation.error;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          {isEditing ? 'Edit Product' : 'Create New Product'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error instanceof Error ? error.message : 'An error occurred. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter product title"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Give your product a clear, descriptive title
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your product..."
                      rows={4}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details about condition, features, and any other relevant information
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          className="pl-10"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoading || categoriesLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category: Category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Image Upload */}
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {/* Preview */}
                      {previewImage && (
                        <div className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={previewImage}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1"
                            onClick={removeImage}
                            disabled={isLoading}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* Upload Options */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* File Upload */}
                        <div className="flex-1">
                          <Label htmlFor="image-upload" className="cursor-pointer">
                            <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                              {isUploading ? (
                                <div className="flex flex-col items-center">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                  <span className="text-sm text-muted-foreground">Uploading...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                  <span className="text-sm text-muted-foreground">
                                    Click to upload image
                                  </span>
                                </div>
                              )}
                            </div>
                          </Label>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={isLoading || isUploading}
                          />
                        </div>

                        {/* URL Input */}
                        <div className="flex-1">
                          <Input
                            placeholder="Or paste image URL"
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              if (e.target.value) {
                                setPreviewImage(e.target.value);
                              }
                            }}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload an image or provide a URL (max 5MB)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? 'Update Product' : 'Create Product'}
                  </>
                )}
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProductForm;