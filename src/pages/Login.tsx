/**
 * Login Page
 * Complete login page with form integration and redirect logic
 */

import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Store, Users, Shield, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';
import { RequireGuest } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
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

  const handleLoginSuccess = () => {
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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Marketing Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
                  Welcome Back to
                  <span className="text-primary block">StudentMarket</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Sign in to continue buying, selling, and connecting with students in your community.
                </p>
              </div>

              {/* Features */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Student Community</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect with verified students from your campus and beyond.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Safe Trading</h3>
                    <p className="text-sm text-muted-foreground">
                      Secure transactions with built-in safety features and guidelines.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Store className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Easy Selling</h3>
                    <p className="text-sm text-muted-foreground">
                      List your items quickly with our streamlined selling process.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Instant Connect</h3>
                    <p className="text-sm text-muted-foreground">
                      Find what you need or sell what you don't in minutes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 p-6 bg-card rounded-lg border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">50K+</div>
                  <div className="text-sm text-muted-foreground">Active Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">200+</div>
                  <div className="text-sm text-muted-foreground">Universities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">1M+</div>
                  <div className="text-sm text-muted-foreground">Items Traded</div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <LoginForm 
                  onSuccess={handleLoginSuccess}
                  redirectTo={redirectTo}
                  className="shadow-lg"
                />

                {/* Additional Links */}
                <div className="mt-6 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    New to StudentMarket?{' '}
                    <Link 
                      to={`/register${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
                      className="font-medium text-primary hover:underline"
                    >
                      Create your account
                    </Link>
                  </p>
                  
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <Link to="/forgot-password" className="text-muted-foreground hover:text-primary">
                      Forgot Password?
                    </Link>
                    <span className="text-muted-foreground">•</span>
                    <Link to="/help" className="text-muted-foreground hover:text-primary">
                      Need Help?
                    </Link>
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
              By signing in, you agree to our{' '}
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

export default Login;