import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import Login from '../Login';
import { AuthProvider } from '@/contexts/AuthContext';
import { createMockUser } from '../../../tests/utils';

// Mock login mutation
const mockLoginMutation = {
  mutate: vi.fn(),
  isPending: false,
  error: null
};

vi.mock('@/hooks/useAuthMutations', () => ({
  useLogin: () => mockLoginMutation
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const renderLogin = (initialAuthState = null) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <BrowserRouter>
      <AuthProvider initialUser={initialAuthState}>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login page with title and form', () => {
    renderLogin();
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows registration link', () => {
    renderLogin();
    
    const registerLink = screen.getByText(/sign up/i);
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('redirects to home if already authenticated', () => {
    const mockUser = createMockUser();
    renderLogin(mockUser);
    
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('handles successful login flow', async () => {
    const mockUser = createMockUser();
    mockLoginMutation.mutate.mockImplementation((_, { onSuccess }) => {
      onSuccess(mockUser);
    });

    renderLogin();
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(mockLoginMutation.mutate).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      }, expect.any(Object));
    });
  });

  it('displays validation errors for invalid input', async () => {
    renderLogin();
    
    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least/i)).toBeInTheDocument();
    });
  });

  it('displays server error messages', async () => {
    mockLoginMutation.error = new Error('Invalid credentials');
    
    renderLogin();
    
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('disables form during loading state', () => {
    mockLoginMutation.isPending = true;
    
    renderLogin();
    
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
  });
});