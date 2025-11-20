/**
 * Protected Route Component
 * Route guard for authenticated users with loading and fallback states
 */

import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, Lock, LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

// ==================== Types ====================

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

interface AuthRequiredFallbackProps {
  onLoginClick: () => void;
  message?: string;
}

// ==================== Fallback Components ====================

const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const AuthRequiredFallback: React.FC<AuthRequiredFallbackProps> = ({ 
  onLoginClick, 
  message = "You need to be signed in to access this page." 
}) => (
  <div className="flex items-center justify-center min-h-[400px] p-4">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Authentication Required</CardTitle>
        <CardDescription className="text-center">
          {message}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={onLoginClick} className="w-full">
          <LogIn className="mr-2 h-4 w-4" />
          Sign In
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          Don't have an account?{' '}
          <Button 
            variant="link" 
            className="p-0 h-auto text-primary hover:underline"
            onClick={() => window.location.href = '/register'}
          >
            Create one here
          </Button>
        </p>
      </CardContent>
    </Card>
  </div>
);

// ==================== Main Component ====================

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectTo = '/login',
  requireAuth = true,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingFallback />;
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    // Use Navigate for redirect if redirectTo is provided
    if (redirectTo) {
      return (
        <Navigate 
          to={redirectTo} 
          state={{ from: location.pathname }} 
          replace 
        />
      );
    }

    // Default fallback with login prompt
    return (
      <AuthRequiredFallback 
        onLoginClick={() => {
          window.location.href = `/login?redirect=${encodeURIComponent(location.pathname)}`;
        }}
      />
    );
  }

  // If authentication is not required but user is authenticated (for login/register pages)
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Render children if all checks pass
  return <>{children}</>;
};

// ==================== Specialized Route Guards ====================

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
  message?: string;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  fallback,
  message 
}) => {
  const location = useLocation();

  return (
    <ProtectedRoute
      requireAuth={true}
      fallback={fallback || (
        <AuthRequiredFallback 
          onLoginClick={() => {
            window.location.href = `/login?redirect=${encodeURIComponent(location.pathname)}`;
          }}
          message={message}
        />
      )}
    >
      {children}
    </ProtectedRoute>
  );
};

interface RequireGuestProps {
  children: ReactNode;
}

export const RequireGuest: React.FC<RequireGuestProps> = ({ children }) => {
  return (
    <ProtectedRoute requireAuth={false}>
      {children}
    </ProtectedRoute>
  );
};

// ==================== Higher-Order Component ====================

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireAuth?: boolean;
    fallback?: ReactNode;
    redirectTo?: string;
  } = {}
) => {
  const AuthenticatedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
};

// ==================== Utility Hooks ====================

export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (!isLoading && !isAuthenticated) {
    window.location.href = `/login?redirect=${encodeURIComponent(location.pathname)}`;
  }

  return { isAuthenticated, isLoading };
};

// ==================== Export ====================

export default ProtectedRoute;