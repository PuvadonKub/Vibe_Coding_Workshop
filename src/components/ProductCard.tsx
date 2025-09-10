import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description?: string;
    price: number;
    image?: string;
  };
  onSelect?: (id: string) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <Card className="w-full max-w-sm hover:shadow-lg transition-shadow duration-200">
      {product.image && (
        <div className="aspect-w-16 aspect-h-9 w-full">
          <img
            src={product.image}
            alt={product.title}
            className="object-cover w-full h-48 rounded-t-lg"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle>{product.title}</CardTitle>
        <CardDescription>${product.price.toFixed(2)}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{product.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => onSelect?.(product.id)}
        >
          View Details
        </Button>
        <Button>Add to Cart</Button>
      </CardFooter>
    </Card>
  );
}
