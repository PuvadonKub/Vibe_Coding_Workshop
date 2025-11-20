/**
 * Register Page
 * Complete registration page with form integration and campus verification
 */

import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Store, GraduationCap, BookOpen, Users2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { RequireGuest } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  // Get redirect parameter from URL
  const redirectTo = searchParams.get('redirect') || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleRegisterSuccess = () => {
    navigate(redirectTo);
  };

  return (
    <RequireGuest>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50">
        {/* Header */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-primary">StudentMarket</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Registration Form */}
            <div className="order-2 lg:order-1">
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center lg:text-left space-y-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                    Join StudentMarket
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Create your account and start connecting with your student community today.
                  </p>
                </div>

                {/* Registration Form */}
                <RegisterForm 
                  onSuccess={handleRegisterSuccess}
                  redirectTo={redirectTo}
                  className="shadow-lg"
                />

                {/* Additional Links */}
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link 
                      to={`/login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
                      className="font-medium text-primary hover:underline"
                    >
                      Sign in instead
                    </Link>
                  </p>
                  
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <Link to="/campus-verification" className="text-muted-foreground hover:text-primary">
                      Campus Verification
                    </Link>
                    <span className="text-muted-foreground">•</span>
                    <Link to="/help" className="text-muted-foreground hover:text-primary">
                      Need Help?
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Benefits & Features */}
            <div className="order-1 lg:order-2 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Why Join StudentMarket?</h2>
                </div>
                <p className="text-muted-foreground">
                  Join thousands of students who are already saving money and building connections through our platform.
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid gap-6">
                <Card className="p-6 hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Student-Exclusive Community</h3>
                        <p className="text-sm text-muted-foreground">
                          Connect only with verified students from your university and other campuses nationwide. Build trust through our student verification system.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6 hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Textbooks & Study Materials</h3>
                        <p className="text-sm text-muted-foreground">
                          Find affordable textbooks, study guides, and course materials from students who've already taken your classes.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6 hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Store className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Electronics & Gadgets</h3>
                        <p className="text-sm text-muted-foreground">
                          Buy and sell laptops, tablets, gaming equipment, and other tech essentials at student-friendly prices.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6 hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users2 className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Services & Tutoring</h3>
                        <p className="text-sm text-muted-foreground">
                          Offer your skills or find help with tutoring, design services, writing assistance, and more from fellow students.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trust Indicators */}
              <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-0">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Trusted by Students Everywhere</h3>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">98%</div>
                          <div className="text-xs text-muted-foreground">Satisfaction Rate</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">24/7</div>
                          <div className="text-xs text-muted-foreground">Support Available</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">100%</div>
                          <div className="text-xs text-muted-foreground">Free to Use</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Campus Verification Info */}
              <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground text-sm">Campus Verification</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Verify your student status after registration to unlock exclusive campus features and increase trust with other students.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </RequireGuest>
  );
};

export default Register;