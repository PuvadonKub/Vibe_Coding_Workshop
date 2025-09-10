import { useState } from "react";
import { Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CategoryFilter from "./CategoryFilter";
import ListingCard from "./ListingCard";

const mockListings = [
  {
    id: "1",
    title: "Organic Chemistry Textbook",
    price: 120,
    condition: "Like New",
    category: "Textbooks",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop",
    seller: { name: "Jessica Wong", rating: 4.9, verified: true },
    location: "Science Building",
    postedDate: "1 hour ago",
  },
  {
    id: "2",
    title: "iPad Pro with Apple Pencil",
    price: 600,
    condition: "Excellent",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop",
    seller: { name: "David Kim", rating: 4.8, verified: true },
    location: "Tech Center",
    postedDate: "3 hours ago",
  },
  {
    id: "3",
    title: "Mini Fridge - Dorm Size",
    price: 80,
    condition: "Good",
    category: "Housing",
    image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=400&fit=crop",
    seller: { name: "Lisa Park", rating: 4.7, verified: true },
    location: "Residence Hall",
    postedDate: "6 hours ago",
  },
  {
    id: "4",
    title: "Python Programming Bootcamp",
    price: 50,
    condition: "Service",
    category: "Services",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=400&fit=crop",
    seller: { name: "Tom Zhang", rating: 5.0, verified: true },
    location: "Computer Lab",
    postedDate: "1 day ago",
  },
  {
    id: "5",
    title: "Economics Study Guide Bundle",
    price: 30,
    condition: "New",
    category: "Textbooks",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    seller: { name: "Maria Garcia", rating: 4.6, verified: true },
    location: "Business School",
    postedDate: "2 days ago",
  },
  {
    id: "6",
    title: "Gaming Chair - RGB Lighting",
    price: 150,
    condition: "Like New",
    category: "Furniture",
    image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&h=400&fit=crop",
    seller: { name: "Chris Lee", rating: 4.9, verified: true },
    location: "Gaming Lounge",
    postedDate: "4 hours ago",
  },
];

const Marketplace = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const filteredListings = mockListings.filter(listing => 
    selectedCategory === "All" || listing.category === selectedCategory
  );

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0" style={{background: 'var(--gradient-marketplace)'}}></div>
      <div className="relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Browse Marketplace</h2>
            <p className="text-muted-foreground">
              {filteredListings.length} items available
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Category Filter Sidebar */}
          <div className="lg:col-span-1">
            <CategoryFilter 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          {/* Listings Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};

export default Marketplace;