import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../Register';
import { AuthProvider } from '@/contexts/AuthContext';
import { createMockUser } from '../../../tests/utils';

// Mock register mutation
const mockRegisterMutation = {
  mutate: vi.fn(),
  isPending: false,
  error: null
};

vi.mock('@/hooks/useAuthMutations', () => ({
  useRegister: () => mockRegisterMutation
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

const renderRegister = (initialAuthState = null) => {
  return render(
    <BrowserRouter>
      <AuthProvider initialUser={initialAuthState}>
        <Register />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Register Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration page with all form fields', () => {
    renderRegister();
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows login link', () => {
    renderRegister();
    
    const loginLink = screen.getByText(/sign in/i);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('redirects to home if already authenticated', () => {
    const mockUser = createMockUser();
    renderRegister(mockUser);
    
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('handles successful registration flow', async () => {
    const mockUser = createMockUser();
    mockRegisterMutation.mutate.mockImplementation((_, { onSuccess }) => {
      onSuccess(mockUser);
    });

    renderRegister();
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('checkbox'));
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(mockRegisterMutation.mutate).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      }, expect.any(Object));
    });
  });

  it('displays validation errors for invalid input', async () => {
    renderRegister();
    
    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    renderRegister();
    
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'different' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();
    });
  });

  it('requires terms acceptance', async () => {
    renderRegister();
    
    // Fill all fields but don't check terms
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/you must accept the terms/i)).toBeInTheDocument();
    });
  });

  it('displays server error messages', async () => {
    mockRegisterMutation.error = new Error('Email already exists');
    
    renderRegister();
    
    expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
  });

  it('disables form during loading state', () => {
    mockRegisterMutation.isPending = true;
    
    renderRegister();
    
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    expect(screen.getByLabelText(/username/i)).toBeDisabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
  });

  it('toggles password visibility', () => {
    renderRegister();
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const toggleButton = screen.getAllByRole('button')[0]; // First toggle button
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});