import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Laptop, Home } from "lucide-react";

const Hero = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[length:20px_20px] opacity-5" style={{backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)'}}></div>
      <div className="absolute inset-0" style={{background: 'var(--gradient-hero)'}}></div>
      <div className="relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            The Student
            <span className="text-primary"> Marketplace</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Buy, sell, and trade with fellow students. From textbooks to electronics, 
            find everything you need for student life at student-friendly prices.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button variant="marketplace" size="lg" className="text-lg">
              Start Shopping
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg">
              List an Item
            </Button>
          </div>

          {/* Category Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="relative rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-200 border border-border/50 backdrop-blur-sm" style={{background: 'var(--gradient-card)'}}>
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Textbooks</h3>
              <p className="text-muted-foreground">Find affordable textbooks from students who've already taken your courses</p>
            </div>
            
            <div className="relative rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-200 border border-border/50 backdrop-blur-sm" style={{background: 'var(--gradient-card)'}}>
              <Laptop className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Electronics</h3>
              <p className="text-muted-foreground">Laptops, tablets, and gadgets perfect for student budgets</p>
            </div>
            
            <div className="relative rounded-xl p-8 shadow-md hover:shadow-lg transition-all duration-200 border border-border/50 backdrop-blur-sm" style={{background: 'var(--gradient-card)'}}>
              <Home className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">Housing</h3>
              <p className="text-muted-foreground">Sublets, roommate searches, and furniture for your dorm or apartment</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};

export default Hero;