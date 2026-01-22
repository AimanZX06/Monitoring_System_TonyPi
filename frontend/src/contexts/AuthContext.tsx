/**
 * Authentication Context
 * ======================
 * 
 * This module provides authentication state management for the entire application.
 * It uses React Context to make auth state available to all components without
 * prop drilling (passing props through multiple levels).
 * 
 * Features:
 * - Login/logout functionality
 * - Session persistence (survives page refresh)
 * - Automatic session expiration
 * - Inactivity timeout (auto-logout after 30 minutes of inactivity)
 * - Token validation on app start
 * 
 * Session Management:
 * - Sessions last 8 hours from login
 * - Sessions expire after 30 minutes of inactivity
 * - Session state is checked every minute
 * - User activity (mouse, keyboard) resets the inactivity timer
 * 
 * Usage:
 * 1. Wrap your app with <AuthProvider>
 * 2. Use useAuth() hook in components to access auth state
 * 
 * @example
 * // In a component:
 * const { user, isAuthenticated, login, logout } = useAuth();
 * if (isAuthenticated) {
 *   return <Dashboard user={user} />;
 * }
 */

// ============================================================================
// IMPORTS
// ============================================================================

import React, { 
  createContext,   // Creates a Context object for sharing state
  useContext,      // Hook to consume a Context
  useState,        // Hook for component state
  useEffect,       // Hook for side effects (API calls, subscriptions)
  ReactNode,       // Type for React children
  useRef,          // Hook for mutable values that don't trigger re-renders
  useCallback      // Hook to memoize functions (prevent unnecessary re-creation)
} from 'react';

// Import API service and token management utilities
import { apiService, tokenService } from '../utils/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User object representing an authenticated user.
 * This data comes from the backend /auth/me endpoint.
 */
interface User {
  id: string;           // Unique user identifier (UUID)
  username: string;     // Login username
  email: string;        // User's email address
  role: string;         // User role: 'admin', 'operator', or 'viewer'
  is_active?: boolean;  // Whether the account is active
}

/**
 * Session data stored in localStorage.
 * Includes the user object and expiration timestamp.
 */
interface StoredSession {
  user: User;           // The authenticated user
  expiresAt: number;    // Unix timestamp (milliseconds) when session expires
}

/**
 * The shape of the authentication context.
 * These values and functions are available to all components
 * that use the useAuth() hook.
 */
interface AuthContextType {
  user: User | null;                                    // Current user or null if not logged in
  isAuthenticated: boolean;                             // Convenience boolean for auth state
  login: (username: string, password: string) => Promise<boolean>;  // Login function
  logout: () => void;                                   // Logout function
  isLoading: boolean;                                   // True while checking session on startup
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

// Create the AuthContext with undefined as initial value
// The actual value is provided by AuthProvider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// SESSION CONFIGURATION
// ============================================================================

// How long a session lasts from login (8 hours)
const SESSION_DURATION = 8 * 60 * 60 * 1000;  // milliseconds

// How long before inactivity logs the user out (30 minutes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;    // milliseconds

// How often to check if the session has expired (1 minute)
const SESSION_CHECK_INTERVAL = 60 * 1000;     // milliseconds

// ============================================================================
// AUTH PROVIDER COMPONENT
// ============================================================================

/**
 * Props for AuthProvider component.
 */
interface AuthProviderProps {
  children: ReactNode;  // Child components that will have access to auth context
}

/**
 * AuthProvider component that wraps the application.
 * 
 * This component:
 * 1. Manages authentication state (user, loading)
 * 2. Provides login/logout functions
 * 3. Handles session persistence and expiration
 * 4. Tracks user activity for inactivity timeout
 * 
 * @param props - Contains children to render
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // ========== STATE ==========
  
  // Current authenticated user (null if not logged in)
  const [user, setUser] = useState<User | null>(null);
  
  // Loading state - true while checking existing session on app start
  const [isLoading, setIsLoading] = useState(true);
  
  // ========== REFS ==========
  // Refs are used for values that shouldn't trigger re-renders
  
  // Timestamp of last user activity
  const lastActivityRef = useRef<number>(Date.now());
  
  // Reference to the inactivity timeout timer
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Check if a stored session is still valid.
   * A session is valid if the current time is before the expiration time.
   * 
   * @param session - The stored session to check
   * @returns true if session is valid, false if expired
   */
  const isSessionValid = useCallback((session: StoredSession): boolean => {
    return Date.now() < session.expiresAt;
  }, []);

  /**
   * Clear the current session and log out the user.
   * This function:
   * 1. Clears the user state
   * 2. Removes session from localStorage
   * 3. Removes the auth token
   * 4. Clears any pending inactivity timer
   */
  const clearSession = useCallback(() => {
    setUser(null);
    localStorage.removeItem('tonypi_user');
    apiService.logout();  // Removes token from localStorage
    
    // Clear inactivity timer if it exists
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  /**
   * Reset the inactivity timer.
   * Called whenever user activity is detected.
   * If no activity for INACTIVITY_TIMEOUT, user is logged out.
   */
  const resetInactivityTimer = useCallback(() => {
    // Update last activity timestamp
    lastActivityRef.current = Date.now();
    
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Set new timer - will log out user after INACTIVITY_TIMEOUT
    inactivityTimerRef.current = setTimeout(() => {
      // Check if user is still logged in when timer fires
      const currentSession = localStorage.getItem('tonypi_user');
      if (currentSession) {
        try {
          const parsedSession: StoredSession = JSON.parse(currentSession);
          if (isSessionValid(parsedSession)) {
            console.log('Session expired due to inactivity');
            clearSession();
          }
        } catch (e) {
          clearSession();
        }
      }
    }, INACTIVITY_TIMEOUT);
  }, [isSessionValid, clearSession]);

  // ========== EFFECTS ==========

  /**
   * Effect: Check for existing session on app mount.
   * 
   * This runs once when the app starts and:
   * 1. Checks localStorage for existing session
   * 2. Validates the session hasn't expired
   * 3. Verifies the token with the backend
   * 4. Sets up the user state if valid
   */
  useEffect(() => {
    const checkSession = async () => {
      // Get token and stored session from localStorage
      const token = tokenService.getToken();
      const storedSession = localStorage.getItem('tonypi_user');
      
      // Both token and session must exist
      if (token && storedSession) {
        try {
          const parsedSession: StoredSession = JSON.parse(storedSession);
          
          // Check if session time hasn't expired
          if (isSessionValid(parsedSession)) {
            // Verify token is still valid by calling the backend
            try {
              const currentUser = await apiService.getCurrentUser();
              setUser(currentUser);
              lastActivityRef.current = Date.now();
              resetInactivityTimer();
            } catch (error) {
              // Token invalid (maybe expired on server side)
              console.log('Token invalid, clearing session');
              clearSession();
            }
          } else {
            // Session time expired
            console.log('Session expired');
            clearSession();
          }
        } catch (e) {
          console.error('Error parsing stored session:', e);
          clearSession();
        }
      } else {
        // No existing session
        clearSession();
      }
      
      // Done checking - hide loading state
      setIsLoading(false);
    };
    
    checkSession();
  }, [isSessionValid, resetInactivityTimer, clearSession]);

  /**
   * Effect: Periodically check session expiration.
   * 
   * Runs every SESSION_CHECK_INTERVAL (1 minute) to ensure
   * the session is still valid. This catches cases where
   * the session expires while the user is idle but the
   * inactivity timer hasn't fired yet.
   */
  useEffect(() => {
    // Only run if user is logged in
    if (!user) return;

    const checkSession = setInterval(() => {
      const storedSession = localStorage.getItem('tonypi_user');
      if (storedSession) {
        try {
          const parsedSession: StoredSession = JSON.parse(storedSession);
          if (!isSessionValid(parsedSession)) {
            console.log('Session expired during periodic check');
            clearSession();
          }
        } catch (e) {
          clearSession();
        }
      } else {
        clearSession();
      }
    }, SESSION_CHECK_INTERVAL);

    // Cleanup: clear interval when component unmounts or user changes
    return () => clearInterval(checkSession);
  }, [user, isSessionValid, clearSession]);

  /**
   * Effect: Track user activity to reset inactivity timer.
   * 
   * Listens for various user interaction events and resets
   * the inactivity timer whenever activity is detected.
   */
  useEffect(() => {
    // Only track activity if user is logged in
    if (!user) return;

    // Events that indicate user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Handler that resets the timer
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners for all activity events
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup: remove event listeners when component unmounts
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, resetInactivityTimer]);

  // ========== AUTH FUNCTIONS ==========

  /**
   * Log in with username and password.
   * 
   * @param username - User's username
   * @param password - User's password
   * @returns true if login successful, false otherwise
   */
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Call backend login API
      const response = await apiService.login(username, password);
      const { user: userData } = response;
      
      // Calculate session expiration time
      const expiresAt = Date.now() + SESSION_DURATION;
      
      // Create session object
      const session: StoredSession = {
        user: userData,
        expiresAt,
      };
      
      // Update state and localStorage
      setUser(userData);
      localStorage.setItem('tonypi_user', JSON.stringify(session));
      
      // Reset activity tracking
      lastActivityRef.current = Date.now();
      resetInactivityTimer();
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Log additional details for debugging
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received. Is the backend running?');
      }
      
      return false;
    }
  };

  /**
   * Log out the current user.
   */
  const logout = () => {
    clearSession();
  };

  // ========== CONTEXT PROVIDER ==========

  return (
    <AuthContext.Provider
      value={{
        user,                           // Current user object
        isAuthenticated: !!user,        // Boolean: is user logged in?
        login,                          // Login function
        logout,                         // Logout function
        isLoading,                      // Loading state
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Custom hook to access the authentication context.
 * 
 * This hook provides easy access to auth state and functions
 * from any component in the application.
 * 
 * @returns The auth context value (user, isAuthenticated, login, logout, isLoading)
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  // Throw helpful error if hook is used outside provider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Export the context itself (rarely needed directly)
export default AuthContext;
