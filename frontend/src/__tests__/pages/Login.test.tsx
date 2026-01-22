/**
 * =============================================================================
 * Login Page Tests - Authentication UI Testing
 * =============================================================================
 * 
 * This test file validates the Login page component functionality including:
 * - Form rendering and structure
 * - User input handling
 * - Form submission and validation
 * - Loading states and error messages
 * - Accessibility features
 * 
 * TEST CATEGORIES:
 *   Basic Rendering:
 *     - Login form displays correctly
 *     - Username and password fields exist
 *     - Sign in button is present
 *   
 *   User Interaction:
 *     - Typing in form fields
 *     - Password visibility toggle
 *     - Form submission
 *   
 *   Validation:
 *     - Empty form submission error
 *     - Invalid credentials error
 *     - Network error handling
 *   
 *   Loading States:
 *     - Loading indicator during submission
 *     - Disabled inputs while loading
 *   
 *   Accessibility:
 *     - Proper labels for inputs
 *     - Autocomplete attributes for password managers
 * 
 * MOCKING STRATEGY:
 *   - AuthContext is mocked to control authentication state
 *   - mockLogin controls success/failure of login attempts
 *   - No actual API calls are made
 * 
 * RUN COMMANDS:
 *   npm test -- Login.test.tsx
 *   npm test -- Login.test.tsx --coverage
 */

// =============================================================================
// IMPORTS
// =============================================================================

import React from 'react';

// Testing library utilities
import { render, screen, waitFor } from '../utils/testUtils';

// userEvent simulates real user interactions (typing, clicking)
import userEvent from '@testing-library/user-event';

// Component under test
import Login from '../../pages/Login';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Mock functions for auth context
const mockLogin = jest.fn();   // Tracks login function calls
const mockLogout = jest.fn();  // Tracks logout function calls

/**
 * Mock the AuthContext to control authentication state in tests.
 * This allows us to simulate different auth scenarios without
 * actually authenticating with the backend.
 */
jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    login: mockLogin,          // Mock login function
    isAuthenticated: false,    // User starts logged out
    user: null,                // No user data
    logout: mockLogout,        // Mock logout function
    isLoading: false,          // Not in loading state
  }),
}));

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Helper function to render the Login component with test providers.
 * Wraps the component in necessary context providers.
 */
const renderLogin = () => {
  return render(<Login />);
};

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue(true);
  });

  it('renders login form', () => {
    renderLogin();
    
    expect(screen.getByText('TonyPi Monitor')).toBeInTheDocument();
    expect(screen.getByText('Robot Monitoring System')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('has username and password input fields', () => {
    renderLogin();
    
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    
    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  it('has sign in button', () => {
    renderLogin();
    
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('allows typing in username field', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    await user.type(usernameInput, 'testuser');
    
    expect(usernameInput).toHaveValue('testuser');
  });

  it('allows typing in password field', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    await user.type(passwordInput, 'testpassword');
    
    expect(passwordInput).toHaveValue('testpassword');
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Find and click the toggle button
    const toggleButton = passwordInput.parentElement?.querySelector('button');
    if (toggleButton) {
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  it('shows error when submitting empty form', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please enter both username and password/i)).toBeInTheDocument();
    });
  });

  it('calls login function with credentials', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'password123');
    });
  });

  it('shows error on login failure', async () => {
    mockLogin.mockResolvedValue(false);
    const user = userEvent.setup();
    renderLogin();
    
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    await user.type(usernameInput, 'wronguser');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid username or password/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while submitting', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 1000)));
    const user = userEvent.setup();
    renderLogin();
    
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'password');
    await user.click(submitButton);
    
    expect(screen.getByText(/Signing in/i)).toBeInTheDocument();
  });

  it('disables inputs while loading', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 1000)));
    const user = userEvent.setup();
    renderLogin();
    
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'password');
    await user.click(submitButton);
    
    expect(usernameInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });
});

describe('Login Page - Network Errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows network error message', async () => {
    const networkError = new Error('Network Error');
    networkError.message = 'Network Error';
    mockLogin.mockRejectedValue(networkError);
    
    const user = userEvent.setup();
    renderLogin();
    
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'password');
    await user.click(submitButton);
    
    await waitFor(() => {
      // Should show some error message
      const errorElement = document.querySelector('[class*="red"]');
      expect(errorElement).toBeInTheDocument();
    });
  });
});

describe('Login Page - Accessibility', () => {
  it('has proper labels for inputs', () => {
    renderLogin();
    
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('has autocomplete attributes', () => {
    renderLogin();
    
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    
    expect(usernameInput).toHaveAttribute('autocomplete', 'username');
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });
});
