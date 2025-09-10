import ListingCard from "./ListingCard";

const mockListings = [
  {
    id: "1",
    title: "Calculus Textbook - 12th Edition",
    price: 85,
    condition: "Like New",
    category: "Textbooks",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop",
    seller: {
      name: "Sarah Chen",
      rating: 4.9,
      verified: true,
    },
    location: "Campus North",
    postedDate: "2 hours ago",
  },
  {
    id: "2",
    title: "MacBook Air M2 - Excellent Condition",
    price: 950,
    condition: "Excellent",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop",
    seller: {
      name: "Mike Johnson",
      rating: 4.7,
      verified: true,
    },
    location: "West Campus",
    postedDate: "1 day ago",
  },
  {
    id: "3",
    title: "Desk Chair - Perfect for Studying",
    price: 45,
    condition: "Good",
    category: "Furniture",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
    seller: {
      name: "Emma Davis",
      rating: 4.8,
      verified: true,
    },
    location: "Downtown",
    postedDate: "3 days ago",
  },
  {
    id: "4",
    title: "Statistics Tutoring - Honor Roll Student",
    price: 25,
    condition: "Service",
    category: "Services",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=400&fit=crop",
    seller: {
      name: "Alex Rivera",
      rating: 5.0,
      verified: true,
    },
    location: "Library Area",
    postedDate: "5 hours ago",
  },
];

const FeaturedListings = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0" style={{background: 'var(--gradient-featured)'}}></div>
      <div className="relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Featured Listings</h2>
          <p className="text-lg text-muted-foreground">
            Popular items from verified student sellers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
      </div>
    </section>
  );
};

export default FeaturedListings;