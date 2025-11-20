/**
 * Footer Component - Enhanced with social links and improved layout
 * Links and information, social media integration, newsletter signup
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Store,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  Heart,
  Shield,
  Zap,
  Users
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    
    // Simulate newsletter subscription
    setTimeout(() => {
      toast({
        title: "Successfully subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
      setEmail('');
      setIsSubscribing(false);
    }, 1000);
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border relative overflow-hidden bg-muted/50">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/50"></div>
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand & Description */}
            <div className="space-y-4 lg:col-span-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-primary">StudentMarket</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The trusted marketplace connecting students nationwide. Buy, sell, and trade textbooks, electronics, and more with fellow students safely and securely.
              </p>
              
              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Secure transactions</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>Student verified community</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span>Fast & easy listing</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-3 pt-4">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground text-sm uppercase tracking-wide">Marketplace</h4>
              <div className="space-y-3">
                <Link to="/marketplace" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Browse All Items
                </Link>
                <Link to="/products/new" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Sell an Item
                </Link>
                <Link to="/categories" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Categories
                </Link>
                <Link to="/how-it-works" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  How It Works
                </Link>
                <Link to="/safety" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Safety Tips
                </Link>
                <Link to="/campus-guide" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Campus Guide
                </Link>
              </div>
            </div>

            {/* Support & Legal */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground text-sm uppercase tracking-wide">Support</h4>
              <div className="space-y-3">
                <Link to="/help" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </Link>
                <Link to="/contact" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
                <Link to="/dispute-resolution" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dispute Resolution
                </Link>
                <Link to="/report" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Report an Issue
                </Link>
                <Link to="/terms" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
                <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>

            {/* Newsletter & Contact */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground text-sm uppercase tracking-wide">Stay Updated</h4>
              
              {/* Newsletter */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Get the latest deals and campus news delivered to your inbox.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-9"
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="w-full"
                    disabled={isSubscribing}
                  >
                    {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </form>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <a href="mailto:support@studentmarket.com" className="text-sm hover:text-primary transition-colors">
                    support@studentmarket.com
                  </a>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <a href="tel:1-800-784-3368" className="text-sm hover:text-primary transition-colors">
                    1-800-STUDENT
                  </a>
                </div>
                <div className="flex items-start space-x-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Campus locations nationwide</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border mt-12 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <p className="text-muted-foreground text-sm">
                  © {currentYear} StudentMarket. All rights reserved.
                </p>
                <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                  <span>Made with</span>
                  <Heart className="h-3 w-3 text-red-500 fill-current" />
                  <span>for students</span>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center sm:justify-end gap-4 text-sm">
                <Link to="/accessibility" className="text-muted-foreground hover:text-primary transition-colors">
                  Accessibility
                </Link>
                <Link to="/community-guidelines" className="text-muted-foreground hover:text-primary transition-colors">
                  Community Guidelines
                </Link>
                <Link to="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
                <a 
                  href="https://github.com/studentmarket" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Github className="h-3 w-3" />
                  <span>Open Source</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;