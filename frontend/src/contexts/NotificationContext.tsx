/**
 * =============================================================================
 * NotificationContext - Global Toast Notification System
 * =============================================================================
 * 
 * This context provides a global notification/toast system for the application.
 * It manages a queue of notifications and provides methods to add, remove,
 * and automatically dismiss notifications.
 * 
 * ARCHITECTURE:
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │                    NotificationProvider                     │
 *   │  ┌─────────────────────────────────────────────────────┐   │
 *   │  │ notifications: Notification[]   (state)             │   │
 *   │  │ addNotification()   - Add to queue                  │   │
 *   │  │ removeNotification() - Remove from queue            │   │
 *   │  │ success/error/warning/info() - Convenience methods  │   │
 *   │  └─────────────────────────────────────────────────────┘   │
 *   └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │           useNotification() Hook (Consumer)                 │
 *   │  Any component can call success(), error(), etc.           │
 *   └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │               ToastContainer Component                      │
 *   │  Renders notifications array as toast UI elements          │
 *   └─────────────────────────────────────────────────────────────┘
 * 
 * USAGE:
 *   // In any component
 *   const { success, error, warning, info } = useNotification();
 *   
 *   success('Saved!', 'Your changes have been saved.');
 *   error('Failed', 'Could not connect to server.');
 *   warning('Low Battery', 'Robot battery below 20%');
 *   info('Update', 'New data available');
 * 
 * AUTO-DISMISS:
 *   - Success, warning, info: 5 seconds (5000ms)
 *   - Error: 8 seconds (8000ms) - longer to ensure user sees it
 *   - Set duration: 0 to disable auto-dismiss
 */

// =============================================================================
// IMPORTS
// =============================================================================

// React core - context API and hooks
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Notification types - determines color and icon
 * - success: Green - operation completed successfully
 * - error:   Red   - something went wrong
 * - warning: Yellow - caution/attention needed
 * - info:    Blue  - general information
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Individual notification object stored in state
 */
export interface Notification {
  id: string;              // Unique identifier for removal
  type: NotificationType;  // Determines styling (success/error/warning/info)
  title: string;           // Bold header text
  message?: string;        // Optional body text
  duration?: number;       // Auto-dismiss time in ms (0 = manual only)
}

/**
 * Context type - all values and methods available to consumers
 */
interface NotificationContextType {
  // Current notifications array
  notifications: Notification[];
  
  // Core methods
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Convenience methods (most commonly used)
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

// =============================================================================
// CONTEXT CREATION
// =============================================================================

// Create context with undefined default (will be provided by NotificationProvider)
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// =============================================================================
// CUSTOM HOOK
// =============================================================================

/**
 * useNotification Hook
 * 
 * Access the notification system from any component.
 * Must be used within a NotificationProvider.
 * 
 * @returns NotificationContextType - all notification methods and state
 * @throws Error if used outside NotificationProvider
 * 
 * @example
 * const { success, error } = useNotification();
 * success('Saved!');
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const success = useCallback((title: string, message?: string) => {
    addNotification({ type: 'success', title, message });
  }, [addNotification]);

  const error = useCallback((title: string, message?: string) => {
    addNotification({ type: 'error', title, message, duration: 8000 });
  }, [addNotification]);

  const warning = useCallback((title: string, message?: string) => {
    addNotification({ type: 'warning', title, message });
  }, [addNotification]);

  const info = useCallback((title: string, message?: string) => {
    addNotification({ type: 'info', title, message });
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
