/**
 * Home/Marketplace Page
 * Main marketplace page with featured products, category filters, and search functionality
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Plus,
  Filter,
  Grid,
  List,
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ProductList } from '@/components/product/ProductList';
import { ProductCard } from '@/components/product/ProductCard';
import { api, queryKeys } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Category, Product } from '@/types';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch featured/recent products
  const { data: featuredProducts, isLoading: featuredLoading } = useQuery({
    queryKey: queryKeys.products({ per_page: 8, status: 'available' }),
    queryFn: () => api.getProducts({ per_page: 8, status: 'available' }),
  });

  // Fetch categories with product counts
  const { data: categoriesResponse } = useQuery({
    queryKey: queryKeys.categoriesWithCount,
    queryFn: () => api.getCategoriesWithCount(),
  });

  const categories = categoriesResponse?.categories || [];
  const products = featuredProducts?.products || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results - for now just scroll to products
      document.getElementById('marketplace-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 lg:py-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <Badge variant="secondary" className="px-4 py-2">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Trusted by 50,000+ Students
                </Badge>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                Your Campus
                <span className="text-primary block">Marketplace</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Buy, sell, and trade with fellow students. From textbooks to electronics, find everything you need at student-friendly prices.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search for textbooks, electronics, furniture..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-lg border-2 bg-background/50 backdrop-blur-sm"
                  />
                </div>
                <Button type="submit" size="lg" className="h-14 px-8">
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
              </form>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" size="lg" asChild>
                <Link to="/marketplace">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Browse All Items
                </Link>
              </Button>
              
              {isAuthenticated ? (
                <Button size="lg" asChild>
                  <Link to="/products/new">
                    <Plus className="h-5 w-5 mr-2" />
                    Sell Something
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild>
                  <Link to="/register">
                    <Plus className="h-5 w-5 mr-2" />
                    Join StudentMarket
                  </Link>
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">200+</div>
                <div className="text-sm text-muted-foreground">Universities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">1M+</div>
                <div className="text-sm text-muted-foreground">Items Traded</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">98%</div>
                <div className="text-sm text-muted-foreground">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Shop by Category
            </h2>
            <p className="text-lg text-muted-foreground">
              Find exactly what you're looking for in our organized categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.slice(0, 8).map((category) => (
              <Card key={category.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <Link to={`/categories/${category.id}`}>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <ShoppingBag className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.product_count || 0} items
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link to="/categories">
                View All Categories
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="marketplace-section" className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Latest Products
              </h2>
              <p className="text-lg text-muted-foreground">
                Fresh listings from students in your community
              </p>
            </div>
            
            <Button variant="outline" asChild>
              <Link to="/marketplace">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-square bg-gray-200 animate-pulse" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="featured"
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">No products yet</h3>
                <p className="text-muted-foreground">
                  Be the first to list something on StudentMarket!
                </p>
                {isAuthenticated && (
                  <Button asChild>
                    <Link to="/products/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Product
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How StudentMarket Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Simple, safe, and student-focused trading in three easy steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
                <Users className="h-10 w-10 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">1. Join the Community</h3>
              <p className="text-muted-foreground">
                Sign up with your student email and connect with verified students from your campus and beyond.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="h-10 w-10 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">2. Buy or Sell</h3>
              <p className="text-muted-foreground">
                List your items for free or browse thousands of products from textbooks to tech at student prices.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
                <Star className="h-10 w-10 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">3. Trade Safely</h3>
              <p className="text-muted-foreground">
                Meet on campus, use our safety guidelines, and build trust through our review and rating system.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link to="/how-it-works">
                Learn More About Safety
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-gradient-to-r from-primary to-primary/80">
          <div className="container mx-auto px-4 text-center text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Trading?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of students who are already saving money and building connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/register">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Free Account
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Home;