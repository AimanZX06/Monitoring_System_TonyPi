/**
 * =============================================================================
 * ThemeContext - Dark/Light Mode Theme Management
 * =============================================================================
 * 
 * This context manages the application's theme (dark or light mode) and
 * provides a way to toggle between them. It persists the user's preference
 * in localStorage and can also follow the system's color scheme.
 * 
 * FEATURES:
 *   - Toggle between dark and light modes
 *   - Persist preference in localStorage
 *   - Auto-detect system color scheme preference
 *   - Listen for system theme changes
 *   - Tailwind CSS dark mode integration
 * 
 * THEME PRIORITY:
 *   1. Stored preference in localStorage (if user manually selected)
 *   2. System preference (if no stored preference)
 *   3. Default to 'light' (fallback)
 * 
 * TAILWIND INTEGRATION:
 *   - Adds/removes 'dark' class on <html> element
 *   - Use "dark:" prefix in Tailwind classes
 *   - Example: "bg-white dark:bg-gray-800"
 * 
 * USAGE:
 *   // Get current theme and toggle function
 *   const { theme, toggleTheme, isDark } = useTheme();
 *   
 *   // Apply conditional styling
 *   className={isDark ? 'bg-gray-800' : 'bg-white'}
 *   
 *   // Toggle theme
 *   <button onClick={toggleTheme}>Switch Theme</button>
 */

// =============================================================================
// IMPORTS
// =============================================================================

// React core - context API, state, effects
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Available theme options
 * - 'light': Light background with dark text
 * - 'dark':  Dark background with light text
 */
type Theme = 'light' | 'dark';

/**
 * Context type - values available to consumers
 */
interface ThemeContextType {
  theme: Theme;            // Current theme value
  toggleTheme: () => void; // Function to switch between themes
  isDark: boolean;         // Convenience boolean for conditionals
}

// =============================================================================
// CONTEXT CREATION
// =============================================================================

// Create context with undefined default (provided by ThemeProvider)
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Props for the ThemeProvider component
 */
interface ThemeProviderProps {
  children: ReactNode;  // Child components that will have access to theme
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('tonypi_theme');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    // Update localStorage
    localStorage.setItem('tonypi_theme', theme);
    
    // Update document class for Tailwind dark mode
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem('tonypi_theme');
      // Only auto-switch if user hasn't manually set a preference
      if (!stored) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
