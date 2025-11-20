/**
 * Tests for RegisterForm component
 * Tests form validation, submission handling, and error states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithoutAuth, mockToast } from '@/test/utils';
import { RegisterForm } from '../RegisterForm';

// Mock the useToast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock the AuthContext
const mockRegister = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    isLoading: false,
  }),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RegisterForm Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
  });

  it('renders registration form with all required fields', () => {
    renderWithoutAuth(<RegisterForm />);
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/terms and conditions/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    renderWithoutAuth(<RegisterForm />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short username', async () => {
    renderWithoutAuth(<RegisterForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    await user.type(usernameInput, 'ab');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    renderWithoutAuth(<RegisterForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when passwords do not match', async () => {
    renderWithoutAuth(<RegisterForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password456');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('shows error when terms are not accepted', async () => {
    renderWithoutAuth(<RegisterForm />);
    
    // Fill form with valid data but don't check terms
    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await user.type(usernameInput, 'testuser');
    await user.type(emailInput, 'test@university.edu');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/you must accept the terms and conditions/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    mockRegister.mockResolvedValueOnce({ success: true });
    renderWithoutAuth(<RegisterForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const fullNameInput = screen.getByLabelText(/full name/i);
    const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(usernameInput, 'testuser');
    await user.type(emailInput, 'test@university.edu');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.type(fullNameInput, 'Test User');
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@university.edu',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'Test User',
        acceptTerms: true,
      });
    });
  });

  it('shows error message when registration fails', async () => {
    const errorMessage = 'Username already exists';
    mockRegister.mockRejectedValueOnce(new Error(errorMessage));
    renderWithoutAuth(<RegisterForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(usernameInput, 'existinguser');
    await user.type(emailInput, 'test@university.edu');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    });
  });

  it('toggles password visibility', async () => {
    renderWithoutAuth(<RegisterForm />);
    
    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    const toggleButtons = screen.getAllByRole('button', { name: /toggle password visibility/i });

    // Initially password should be hidden
    expect(passwordInput.type).toBe('password');

    // Click to show password
    await user.click(toggleButtons[0]);
    expect(passwordInput.type).toBe('text');

    // Click again to hide password
    await user.click(toggleButtons[0]);
    expect(passwordInput.type).toBe('password');
  });

  it('has link to login page', () => {
    renderWithoutAuth(<RegisterForm />);
    
    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('disables submit button while loading', async () => {
    // Mock loading state
    vi.mocked(vi.importMock('@/contexts/AuthContext')).mockImplementation(() => ({
      useAuth: () => ({
        register: mockRegister,
        isLoading: true,
      }),
    }));

    renderWithoutAuth(<RegisterForm />);
    
    const submitButton = screen.getByRole('button', { name: /creating account.../i });
    expect(submitButton).toBeDisabled();
  });

  it('redirects after successful registration', async () => {
    mockRegister.mockResolvedValueOnce({ success: true });
    renderWithoutAuth(<RegisterForm />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(usernameInput, 'testuser');
    await user.type(emailInput, 'test@university.edu');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(termsCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/marketplace');
    });
  });

  it('validates email domain for student accounts', async () => {
    renderWithoutAuth(<RegisterForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@gmail.com');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please use your university email address/i)).toBeInTheDocument();
    });
  });
});