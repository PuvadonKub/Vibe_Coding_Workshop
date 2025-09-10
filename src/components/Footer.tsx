import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border relative overflow-hidden">
      <div className="absolute inset-0" style={{background: 'var(--gradient-footer)'}}></div>
      <div className="relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary">StudentMarket</h3>
            <p className="text-muted-foreground">
              The trusted marketplace for students to buy, sell, and trade with confidence.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <div className="space-y-2">
              <Button variant="link" className="h-auto p-0 text-muted-foreground">Browse Items</Button>
              <Button variant="link" className="h-auto p-0 text-muted-foreground">Sell an Item</Button>
              <Button variant="link" className="h-auto p-0 text-muted-foreground">How It Works</Button>
              <Button variant="link" className="h-auto p-0 text-muted-foreground">Safety Tips</Button>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Categories</h4>
            <div className="space-y-2">
              <Button variant="link" className="h-auto p-0 text-muted-foreground">Textbooks</Button>
              <Button variant="link" className="h-auto p-0 text-muted-foreground">Electronics</Button>
              <Button variant="link" className="h-auto p-0 text-muted-foreground">Housing</Button>
              <Button variant="link" className="h-auto p-0 text-muted-foreground">Services</Button>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Support</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="text-sm">support@studentmarket.com</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span className="text-sm">1-800-STUDENT</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Campus locations nationwide</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © 2024 StudentMarket. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Button variant="link" className="h-auto p-0 text-muted-foreground text-sm">Privacy Policy</Button>
            <Button variant="link" className="h-auto p-0 text-muted-foreground text-sm">Terms of Service</Button>
            <Button variant="link" className="h-auto p-0 text-muted-foreground text-sm">Community Guidelines</Button>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
};

export default Footer;