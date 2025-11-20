/**
 * Tests for ProtectedRoute component
 * Tests authentication-based route protection
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithAuth, renderWithoutAuth, createMockUser } from '@/test/utils';
import { RequireAuth } from '../ProtectedRoute';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/protected-page',
      search: '',
      hash: '',
      state: null,
      key: 'test-key',
    }),
  };
});

const TestComponent = () => <div>Protected Content</div>;

describe('RequireAuth (ProtectedRoute) Component', () => {
  it('renders children when user is authenticated', () => {
    renderWithAuth(
      <RequireAuth>
        <TestComponent />
      </RequireAuth>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    renderWithoutAuth(
      <RequireAuth>
        <TestComponent />
      </RequireAuth>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/login?redirect=%2Fprotected-page');
  });

  it('shows loading state when authentication is loading', () => {
    const { rerender } = renderWithoutAuth(<div />);
    
    // Mock loading state
    vi.mocked(vi.importMock('@/contexts/AuthContext')).mockImplementation(() => ({
      useAuth: () => ({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      }),
    }));

    rerender(
      <RequireAuth>
        <TestComponent />
      </RequireAuth>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('works with custom fallback component', () => {
    const CustomFallback = () => <div>Custom Loading...</div>;

    const { rerender } = renderWithoutAuth(<div />);
    
    // Mock loading state
    vi.mocked(vi.importMock('@/contexts/AuthContext')).mockImplementation(() => ({
      useAuth: () => ({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      }),
    }));

    rerender(
      <RequireAuth fallback={<CustomFallback />}>
        <TestComponent />
      </RequireAuth>
    );

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
  });

  it('preserves current location for redirect after login', () => {
    // Mock specific location
    vi.mocked(vi.importMock('react-router-dom')).mockImplementation(async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({
          pathname: '/my-products',
          search: '?filter=available',
          hash: '#section1',
          state: null,
          key: 'test-key',
        }),
      };
    });

    renderWithoutAuth(
      <RequireAuth>
        <TestComponent />
      </RequireAuth>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login?redirect=%2Fmy-products%3Ffilter%3Davailable%23section1');
  });
});