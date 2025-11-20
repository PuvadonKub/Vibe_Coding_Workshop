/**
 * Authentication Context for managing user authentication state
 * Provides user state, login/logout functionality, and protected route handling
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, setAuthToken, clearAuthToken, getAuthToken, queryKeys } from '@/lib/api';
import type { 
  User, 
  UserLogin, 
  UserCreate, 
  AuthState, 
  AuthResponse,
  ApiError 
} from '@/types';

// ==================== Types ====================

interface AuthContextType extends AuthState {
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User };

// ==================== Initial State ====================

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// ==================== Reducer ====================

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...initialState,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };

    default:
      return state;
  }
};

// ==================== Context ====================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================== Provider Component ====================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const queryClient = useQueryClient();

  // ==================== Authentication Functions ====================

  const login = async (credentials: UserLogin): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response: AuthResponse = await api.login(credentials);
      
      // Store token
      setAuthToken(response.access_token);
      
      // Update state
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.access_token,
        },
      });

      // Clear any cached queries and refetch user data
      queryClient.clear();
      queryClient.setQueryData(queryKeys.currentUser, response.user);

    } catch (error) {
      const apiError = error as ApiError;
      dispatch({
        type: 'AUTH_ERROR',
        payload: apiError.message || 'Login failed',
      });
      throw error;
    }
  };

  const register = async (userData: UserCreate): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response: AuthResponse = await api.register(userData);
      
      // Store token
      setAuthToken(response.access_token);
      
      // Update state
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.access_token,
        },
      });

      // Clear any cached queries and set user data
      queryClient.clear();
      queryClient.setQueryData(queryKeys.currentUser, response.user);

    } catch (error) {
      const apiError = error as ApiError;
      dispatch({
        type: 'AUTH_ERROR',
        payload: apiError.message || 'Registration failed',
      });
      throw error;
    }
  };

  const logout = (): void => {
    // Clear token from storage
    clearAuthToken();
    
    // Clear state
    dispatch({ type: 'AUTH_LOGOUT' });
    
    // Clear all cached queries
    queryClient.clear();
    
    // Redirect to home page
    window.location.href = '/';
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (!state.isAuthenticated || !getAuthToken()) {
        return;
      }

      const user = await api.getCurrentUser();
      dispatch({ type: 'UPDATE_USER', payload: user });
      queryClient.setQueryData(queryKeys.currentUser, user);
    } catch (error) {
      // If refresh fails, logout the user
      logout();
    }
  };

  // ==================== Initialize Authentication ====================

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthToken();
      
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          
          // Try to get current user with stored token
          const user = await api.getCurrentUser();
          
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token },
          });
          
          queryClient.setQueryData(queryKeys.currentUser, user);
        } catch (error) {
          // Token is invalid, clear it
          clearAuthToken();
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    };

    initializeAuth();
  }, [queryClient]);

  // ==================== Auto Token Refresh ====================

  useEffect(() => {
    if (!state.isAuthenticated) return;

    // Set up periodic token refresh (every 15 minutes)
    const refreshInterval = setInterval(() => {
      refreshUser();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated]);

  // ==================== Context Value ====================

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ==================== Hook ====================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// ==================== HOC for Protected Routes ====================

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  fallback = <div>Please log in to continue</div> 
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ==================== Utility Hooks ====================

// Hook to check if user owns a resource
export const useIsOwner = (ownerId?: string): boolean => {
  const { user } = useAuth();
  return Boolean(user && ownerId && user.id === ownerId);
};

// Hook to get user role (if roles are implemented)
export const useUserRole = (): string | null => {
  const { user } = useAuth();
  // This would return user role if implemented in the future
  return user ? 'user' : null;
};

// Hook to check authentication status
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

// Hook to get current user
export const useCurrentUser = (): User | null => {
  const { user } = useAuth();
  return user;
};

// ==================== Export ====================

export default AuthProvider;