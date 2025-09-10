import { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  status: string;
}

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onSelect={(id) => {
            console.log('Selected product:', id);
            // Add navigation or modal logic here
          }}
        />
      ))}
    </div>
  );
}
