import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageCircle, Heart } from "lucide-react";
import { useState } from "react";

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    condition: string;
    category: string;
    image: string;
    seller: {
      name: string;
      rating: number;
      verified: boolean;
    };
    location: string;
    postedDate: string;
  };
}

const ListingCard = ({ listing }: ListingCardProps) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 group">
      {/* Image */}
      <div className="relative aspect-square bg-muted">
        <img
          src={listing.image}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-card/80 backdrop-blur-sm hover:bg-card"
          onClick={() => setIsLiked(!isLiked)}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
        </Button>
        <Badge variant="secondary" className="absolute top-2 left-2">
          {listing.condition}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          <span className="text-lg font-bold text-primary ml-2">
            ${listing.price}
          </span>
        </div>

        <Badge variant="outline" className="mb-3">
          {listing.category}
        </Badge>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center space-x-1">
            <span>{listing.seller.name}</span>
            {listing.seller.verified && (
              <div className="w-2 h-2 bg-success rounded-full" title="Verified Student" />
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span>{listing.seller.rating}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{listing.location}</span>
          <Button variant="outline" size="sm">
            <MessageCircle className="h-3 w-3 mr-1" />
            Message
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;