import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotification, NotificationType } from '../contexts/NotificationContext';

const iconMap: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

const bgColorMap: Record<NotificationType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200',
};

const titleColorMap: Record<NotificationType, string> = {
  success: 'text-green-800',
  error: 'text-red-800',
  warning: 'text-yellow-800',
  info: 'text-blue-800',
};

const messageColorMap: Record<NotificationType, string> = {
  success: 'text-green-700',
  error: 'text-red-700',
  warning: 'text-yellow-700',
  info: 'text-blue-700',
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
