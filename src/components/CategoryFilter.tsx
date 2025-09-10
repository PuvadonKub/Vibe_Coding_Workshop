import { Button } from "@/components/ui/button";
import { BookOpen, Laptop, Home, Car, Shirt, Coffee } from "lucide-react";

const categories = [
  { name: "All", icon: null },
  { name: "Textbooks", icon: BookOpen },
  { name: "Electronics", icon: Laptop },
  { name: "Housing", icon: Home },
  { name: "Transportation", icon: Car },
  { name: "Clothing", icon: Shirt },
  { name: "Services", icon: Coffee },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold mb-4">Categories</h3>
      <div className="space-y-2">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.name}
              variant={selectedCategory === category.name ? "marketplace" : "ghost"}
              className="w-full justify-start"
              onClick={() => onCategoryChange(category.name)}
            >
              {Icon && <Icon className="h-4 w-4 mr-2" />}
              {category.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;