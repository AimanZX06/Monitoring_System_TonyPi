/**
 * =============================================================================
 * Toast Component - Notification Display System
 * =============================================================================
 * 
 * This component renders toast notifications in the top-right corner of the
 * screen. It works with NotificationContext to display success, error, warning,
 * and info messages to users.
 * 
 * FEATURES:
 *   - Multiple notification types with distinct colors and icons
 *   - Slide-in animation from right
 *   - Manual dismiss via X button
 *   - Auto-dismiss via NotificationContext timeout
 *   - Stacked display for multiple notifications
 * 
 * NOTIFICATION TYPES:
 *   - success: Green - Operation completed successfully
 *   - error:   Red   - Something went wrong
 *   - warning: Yellow - Caution/attention needed
 *   - info:    Blue  - General information
 * 
 * USAGE:
 *   This component should be placed once in the app, typically at the root.
 *   Use the useNotification hook to trigger notifications from any component:
 *   
 *   const { success, error } = useNotification();
 *   success('Saved!', 'Your changes have been saved.');
 *   error('Failed', 'Could not connect to server.');
 * 
 * STYLING:
 *   Uses Tailwind CSS classes with injected keyframe animation for slide-in.
 */

// =============================================================================
// IMPORTS
// =============================================================================

// React core
import React from 'react';

// Lucide React icons - one for each notification type
import { 
  X,              // Close button icon
  CheckCircle,    // Success notification icon
  AlertCircle,    // Error notification icon
  AlertTriangle,  // Warning notification icon
  Info            // Info notification icon
} from 'lucide-react';

// Notification context - provides notification data and remove function
import { useNotification, NotificationType } from '../contexts/NotificationContext';

// =============================================================================
// STYLE CONFIGURATION MAPS
// =============================================================================

/**
 * Maps notification type to the appropriate icon component
 * Each icon has a specific color matching its notification type
 */
const iconMap: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,  // Green check
  error: <AlertCircle className="h-5 w-5 text-red-500" />,       // Red alert
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />, // Yellow warning
  info: <Info className="h-5 w-5 text-blue-500" />,               // Blue info
};

/**
 * Maps notification type to background and border colors
 * Uses light backgrounds with matching borders for readability
 */
const bgColorMap: Record<NotificationType, string> = {
  success: 'bg-green-50 border-green-200',   // Light green background
  error: 'bg-red-50 border-red-200',         // Light red background
  warning: 'bg-yellow-50 border-yellow-200', // Light yellow background
  info: 'bg-blue-50 border-blue-200',        // Light blue background
};

/**
 * Maps notification type to title text color
 * Uses darker shades for contrast against light backgrounds
 */
const titleColorMap: Record<NotificationType, string> = {
  success: 'text-green-800',  // Dark green text
  error: 'text-red-800',      // Dark red text
  warning: 'text-yellow-800', // Dark yellow text
  info: 'text-blue-800',      // Dark blue text
};

/**
 * Maps notification type to message text color
 * Slightly lighter than title for visual hierarchy
 */
const messageColorMap: Record<NotificationType, string> = {
  success: 'text-green-700',  // Green message
  error: 'text-red-700',      // Red message
  warning: 'text-yellow-700', // Yellow message
  info: 'text-blue-700',      // Blue message
};

const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            ${bgColorMap[notification.type]}
            border rounded-lg shadow-lg p-4
            transform transition-all duration-300 ease-in-out
            animate-slide-in
          `}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">{iconMap[notification.type]}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${titleColorMap[notification.type]}`}>
                {notification.title}
              </p>
              {notification.message && (
                <p className={`mt-1 text-sm ${messageColorMap[notification.type]}`}>
                  {notification.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Add CSS animation for slide-in effect
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  .animate-slide-in {
    animation: slide-in 0.3s ease-out forwards;
  }
`;
document.head.appendChild(styleSheet);

export default ToastContainer;
