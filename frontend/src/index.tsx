/**
 * Application Entry Point
 * =======================
 * 
 * This is the main entry point for the React application.
 * It's the first file that runs when the application starts.
 * 
 * What this file does:
 * 1. Imports React and ReactDOM for rendering
 * 2. Imports the main TonyPiApp component
 * 3. Imports global CSS styles
 * 4. Finds the 'root' DOM element in index.html
 * 5. Renders the React application into that element
 * 
 * React 18 Rendering:
 * - Uses createRoot (new in React 18) instead of ReactDOM.render
 * - createRoot enables concurrent features and better performance
 */

// ============================================================================
// IMPORTS
// ============================================================================

// React: The core React library for building user interfaces
import React from 'react';

// createRoot: React 18's new way to create a root DOM node for React
// This replaces the older ReactDOM.render() method
import { createRoot } from 'react-dom/client';

// TonyPiApp: The main application component that contains:
// - Router setup for navigation
// - Context providers (Auth, Theme, Notification)
// - Main layout and pages
import TonyPiApp from './TonyPiApp';

// index.css: Global CSS styles including:
// - Tailwind CSS base styles
// - Custom utility classes
// - Root CSS variables
import './index.css';

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

// Find the root DOM element where React will render the app
// This element is defined in public/index.html as <div id="root"></div>
const container = document.getElementById('root');

// Safety check: Throw an error if the root element doesn't exist
// This helps catch configuration issues early
if (!container) {
  throw new Error('Root container not found');
}

// Create a React root using the container element
// This is the new React 18 way to initialize a React application
// It enables concurrent rendering features like:
// - Automatic batching of state updates
// - Transitions for non-urgent updates
// - Suspense for data fetching
const root = createRoot(container);

// Render the application
// React.createElement is used here instead of JSX for simplicity
// This is equivalent to: root.render(<TonyPiApp />);
root.render(React.createElement(TonyPiApp));
