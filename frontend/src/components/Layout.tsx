/**
 * Layout Component
 * ================
 * 
 * This component provides the main application layout structure.
 * It includes:
 * - Fixed sidebar with navigation menu
 * - Top header bar with page title
 * - Main content area where pages are rendered
 * 
 * Layout Structure:
 * +------------------+--------------------------------+
 * |                  |  Top Header Bar                |
 * |     Sidebar      +--------------------------------+
 * |  (Navigation)    |                                |
 * |                  |     Main Content Area          |
 * |                  |     (children rendered here)   |
 * |                  |                                |
 * |  System Status   |                                |
 * +------------------+--------------------------------+
 * 
 * The sidebar is fixed and always visible, while the main content
 * scrolls independently.
 */

// ============================================================================
// IMPORTS
// ============================================================================

// React: Core React library for component building
import React, { useState, useEffect } from 'react';

// React Router: Link for navigation, useLocation to get current URL
// - Link: Creates navigation links without page reload
// - useLocation: Hook to access current URL/pathname
// - useNavigate: Hook for programmatic navigation
import { Link, useLocation, useNavigate } from 'react-router-dom';

// Lucide React: Icon library with clean, customizable icons
// These icons are used in the sidebar navigation
import { 
  Home,      // Dashboard page icon
  Activity,  // Monitoring page icon (and logo)
  FileText,  // Reporting page icon
  Settings,  // Management page icon
  Battery,   // Battery status indicator
  Wifi,      // Connection status indicator
  Bell,      // Alert notification icon
  AlertCircle // Alert icon for alerts page
} from 'lucide-react';

// API Service: For fetching alert statistics
import { apiService } from '../utils/api';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Utility function to conditionally join CSS class names.
 * 
 * This is a simplified version of the popular 'clsx' or 'classnames' libraries.
 * It filters out falsy values and joins the remaining classes with spaces.
 * 
 * @param classes - Class names, can include undefined, false, or empty strings
 * @returns Combined class name string
 * 
 * @example
 * cn('btn', isActive && 'btn-active', undefined, 'btn-primary')
 * // Returns: 'btn btn-active btn-primary' (if isActive is true)
 * // Returns: 'btn btn-primary' (if isActive is false)
 */
const cn = (...classes: (string | undefined | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props interface for the Layout component.
 * 
 * @property children - The page content to render in the main area
 *                     This is a React pattern called "composition"
 */
interface LayoutProps {
  children: React.ReactNode;  // ReactNode can be any renderable content
}

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

/**
 * Main layout component that wraps all pages.
 * 
 * Features:
 * - Responsive sidebar navigation
 * - Active state highlighting for current page
 * - System status indicators
 * - Consistent page header
 * 
 * @param props - Component props containing children to render
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Get current location/URL from React Router
  // Used to highlight the active navigation item
  const location = useLocation();
  const navigate = useNavigate();

  // State for unacknowledged alert count
  const [alertCount, setAlertCount] = useState<number>(0);

  // Navigation items configuration
  // Each item has a name, URL path, and icon component
  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Monitoring', href: '/monitoring', icon: Activity },
    { name: 'Reporting', href: '/reporting', icon: FileText },
    { name: 'Management', href: '/management', icon: Settings },
  ];

  // Fetch unacknowledged alert count
  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const stats = await apiService.getAlertStats('24h');
        setAlertCount(stats.unacknowledged || 0);
      } catch (error) {
        console.error('Error fetching alert count:', error);
      }
    };

    // Fetch immediately
    fetchAlertCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAlertCount, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle bell icon click - navigate to alerts page
  const handleBellClick = () => {
    navigate('/alerts');
  };

  return (
    // Main container - full screen height with light gray background
    <div className="min-h-screen bg-gray-50">
      
      {/* ================================================================
          SIDEBAR NAVIGATION
          ================================================================
          Fixed position sidebar that stays in place while content scrolls.
          Contains: Logo, Navigation links, System status
      */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        
        {/* Logo and Title Section */}
        <div className="flex h-16 items-center px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {/* Logo icon - blue rounded square with activity icon */}
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            {/* Title text */}
            <div>
              <h1 className="text-xl font-bold text-gray-900">TonyPi</h1>
              <p className="text-sm text-gray-500">Monitor</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {/* Map through navigation items to create links */}
            {navigation.map((item) => {
              // Check if this item is the current page
              const isActive = location.pathname === item.href;
              return (
                // Link component - uses React Router for client-side navigation
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    // Base styles for all navigation items
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    // Conditional styles based on active state
                    isActive
                      // Active: Blue background, blue text, right border
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                      // Inactive: Gray text, hover effects
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  {/* Navigation icon - dynamically rendered based on item.icon */}
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5',
                      isActive 
                        ? 'text-primary-600' 
                        : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {/* Navigation label */}
                  {item.name}
                </Link>
              );
            })}
            
            {/* Alerts Link with Badge */}
            <Link
              to="/alerts"
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors relative',
                location.pathname === '/alerts'
                  ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <AlertCircle
                className={cn(
                  'mr-3 h-5 w-5',
                  location.pathname === '/alerts'
                    ? 'text-primary-600' 
                    : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              Alerts
              {/* Alert Badge */}
              {alertCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
            </Link>
          </div>
        </nav>

        {/* System Status Indicator - Fixed at bottom of sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">System Status</span>
            {/* Status icons - green indicates healthy */}
            <div className="flex items-center space-x-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <Battery className="h-4 w-4 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          MAIN CONTENT AREA
          ================================================================
          Contains the top bar and page content.
          Has left margin to account for fixed sidebar width.
      */}
      <div className="ml-64">
        
        {/* Top Header Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Page title - dynamically shows current page name */}
              <h2 className="text-2xl font-bold text-gray-900">
                {/* Find the navigation item matching current path, or show default */}
                {navigation.find(item => item.href === location.pathname)?.name || 
                 (location.pathname === '/alerts' ? 'Alerts' : 'TonyPi Monitor')}
              </h2>
              {/* System status and notification bell */}
              <div className="flex items-center space-x-4">
                {/* Alert Notification Bell */}
                <button
                  onClick={handleBellClick}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  title="View Alerts"
                >
                  <Bell className="h-5 w-5" />
                  {/* Badge showing alert count */}
                  {alertCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full transform translate-x-1 -translate-y-1">
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  )}
                </button>
                
                {/* System online indicator */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  {/* Green dot indicating system is online */}
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>System Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content Area - where children (page components) are rendered */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Export the Layout component as the default export
export default Layout;
