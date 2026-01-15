import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { apiService, tokenService } from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active?: boolean;
}

interface StoredSession {
  user: User;
  expiresAt: number; // Unix timestamp in milliseconds
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session configuration
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if session is valid
  const isSessionValid = useCallback((session: StoredSession): boolean => {
    return Date.now() < session.expiresAt;
  }, []);

  // Clear session and logout
  const clearSession = useCallback(() => {
    setUser(null);
    localStorage.removeItem('tonypi_user');
    apiService.logout();
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      // Check current user state at timeout, not closure value
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

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = tokenService.getToken();
      const storedSession = localStorage.getItem('tonypi_user');
      
      if (token && storedSession) {
        try {
          const parsedSession: StoredSession = JSON.parse(storedSession);
          
          // Check if session has expired
          if (isSessionValid(parsedSession)) {
            // Verify token is still valid by fetching current user
            try {
              const currentUser = await apiService.getCurrentUser();
              setUser(currentUser);
              lastActivityRef.current = Date.now();
              resetInactivityTimer();
            } catch (error) {
              // Token invalid, clear session
              console.log('Token invalid, clearing session');
              clearSession();
            }
          } else {
            // Session expired, clear it
            console.log('Session expired');
            clearSession();
          }
        } catch (e) {
          console.error('Error parsing stored session:', e);
          clearSession();
        }
      } else {
        clearSession();
      }
      setIsLoading(false);
    };
    
    checkSession();
  }, [isSessionValid, resetInactivityTimer, clearSession]);

  // Periodically check session expiration
  useEffect(() => {
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

    return () => clearInterval(checkSession);
  }, [user, isSessionValid, clearSession]);

  // Track user activity to reset inactivity timer
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => {
      resetInactivityTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, resetInactivityTimer]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login(username, password);
      const { user: userData } = response;
      
      const expiresAt = Date.now() + SESSION_DURATION;
      const session: StoredSession = {
        user: userData,
        expiresAt,
      };
      
      setUser(userData);
      localStorage.setItem('tonypi_user', JSON.stringify(session));
      lastActivityRef.current = Date.now();
      resetInactivityTimer();
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      // Log more details for debugging
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received. Is the backend running?');
      }
      return false;
    }
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
