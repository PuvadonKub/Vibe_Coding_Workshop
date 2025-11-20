/**
 * Product Details Page
 * Full product information, seller information, and related products
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Flag, 
  User, 
  Calendar, 
  MapPin, 
  Shield, 
  MessageCircle, 
  Phone, 
  Mail,
  Edit,
  Trash2,
  Star,
  Clock,
  DollarSign,
  Package,
  Verified
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductForm } from '@/components/product/ProductForm';
import { RequireAuth } from '@/components/auth/ProtectedRoute';
import { api, queryKeys } from '@/lib/api';
import { useAuth, useIsOwner } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import type { ProductWithDetails } from '@/types';

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Fetch product details
  const { 
    data: product, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: queryKeys.product(id!),
    queryFn: () => api.getProduct(id!),
    enabled: !!id,
  });

  // Fetch related products
  const { data: relatedProducts } = useQuery({
    queryKey: queryKeys.products({ 
      category_id: product?.category_id,
      per_page: 4,
      status: 'available' 
    }),
    queryFn: () => api.getProducts({ 
      category_id: product?.category_id,
      per_page: 4,
      status: 'available' 
    }),
    enabled: !!product?.category_id,
  });

  const isOwner = useIsOwner(product?.seller_id);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.deleteProduct(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products() });
      toast({
        title: "Product deleted",
        description: "Your product has been successfully deleted.",
      });
      navigate('/my-products');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = (updatedProduct: ProductWithDetails) => {
    setIsEditDialogOpen(false);
    queryClient.setQueryData(queryKeys.product(id!), updatedProduct);
    toast({
      title: "Product updated",
      description: "Your product has been successfully updated.",
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add products to favorites.",
        variant: "destructive",
      });
      return;
    }
    
    setIsFavorited(!isFavorited);
    toast({
      title: isFavorited ? "Removed from favorites" : "Added to favorites",
      description: isFavorited 
        ? "Product removed from your favorites." 
        : "Product added to your favorites.",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: product?.description,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Product link copied to clipboard.",
      });
    }
  };

  const handleReport = () => {
    toast({
      title: "Report submitted",
      description: "Thank you for reporting. We'll review this product.",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-20 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Product Not Found</h1>
            <p className="text-muted-foreground">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/marketplace">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Marketplace
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/marketplace" className="hover:text-primary">Marketplace</Link>
          <span>•</span>
          {product.category && (
            <>
              <Link to={`/categories/${product.category.id}`} className="hover:text-primary">
                {product.category.name}
              </Link>
              <span>•</span>
            </>
          )}
          <span className="text-foreground truncate">{product.title}</span>
        </div>

        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Product Image and Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <Card className="overflow-hidden">
              <div className="aspect-square relative bg-muted">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
                
                {/* Status Badge */}
                <Badge className={`absolute top-4 right-4 ${getStatusColor(product.status)}`}>
                  {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                </Badge>
              </div>
            </Card>

            {/* Product Information */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl lg:text-3xl">{product.title}</CardTitle>
                    <div className="text-3xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleFavorite}
                      className={isFavorited ? 'text-red-500' : ''}
                    >
                      <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
                    </Button>
                    
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="outline" size="icon" onClick={handleReport}>
                      <Flag className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Category and Date */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {product.category && (
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      <Link 
                        to={`/categories/${product.category.id}`}
                        className="hover:text-primary"
                      >
                        {product.category.name}
                      </Link>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Listed {formatDate(product.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Updated {formatDate(product.updated_at)}</span>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Safety Notice */}
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Safety Reminder:</strong> Meet in public places on campus, inspect items before purchasing, and trust your instincts. 
                    <Link to="/safety-tips" className="text-primary hover:underline ml-1">
                      Learn more about safe trading.
                    </Link>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Seller Information
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {product.seller && (
                  <>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {product.seller.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{product.seller.username}</h4>
                          <Verified className="h-4 w-4 text-blue-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Member since {formatDate(product.seller.created_at)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Contact Actions */}
                    {isAuthenticated && !isOwner && product.status === 'available' && (
                      <div className="space-y-2">
                        <Button className="w-full">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </Button>
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Owner Actions */}
                    {isOwner && (
                      <div className="space-y-2">
                        <Button onClick={handleEdit} className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Product
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Product
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this product? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}

                    {/* Sign in prompt */}
                    {!isAuthenticated && (
                      <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Sign in to contact the seller
                        </p>
                        <Button asChild className="w-full">
                          <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`}>
                            Sign In
                          </Link>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Seller Stats (placeholder) */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="font-semibold text-primary">12</div>
                    <div className="text-muted-foreground">Items Sold</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary">4.8</div>
                    <div className="text-muted-foreground flex items-center justify-center gap-1">
                      <Star className="h-3 w-3 fill-current text-yellow-500" />
                      Rating
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary">95%</div>
                    <div className="text-muted-foreground">Response Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.products.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Related Products</h2>
              {product.category && (
                <Button variant="outline" asChild>
                  <Link to={`/categories/${product.category.id}`}>
                    View All in {product.category.name}
                  </Link>
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.products
                .filter(p => p.id !== product.id)
                .slice(0, 4)
                .map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                    variant="default"
                  />
                ))
              }
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update your product information and pricing.
            </DialogDescription>
          </DialogHeader>
          
          <ProductForm
            product={product}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ProductDetails;