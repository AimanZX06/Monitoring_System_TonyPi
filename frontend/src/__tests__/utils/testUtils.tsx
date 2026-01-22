/**
 * =============================================================================
 * Test Utilities - Custom Render and Mock Data Factories
 * =============================================================================
 * 
 * This file provides testing utilities used across all frontend tests.
 * It includes a custom render function that wraps components with necessary
 * providers, and factory functions to create mock data.
 * 
 * KEY EXPORTS:
 *   - render: Custom render function with all providers
 *   - createMockRobot: Factory for mock robot data
 *   - createMockReport: Factory for mock report data
 *   - createMockSensorData: Factory for mock sensor readings
 *   - createMockJobSummary: Factory for mock job data
 *   - mockApiSuccess: Helper for mocking successful API responses
 *   - mockApiError: Helper for mocking API errors
 *   - waitForLoadingToFinish: Utility to wait for async operations
 * 
 * USAGE:
 *   // In test files:
 *   import { render, screen, createMockRobot } from '../utils/testUtils';
 *   
 *   const mockRobot = createMockRobot({ status: 'offline' });
 *   render(<RobotCard robot={mockRobot} />);
 *   expect(screen.getByText('offline')).toBeInTheDocument();
 * 
 * PROVIDER SETUP:
 *   The custom render wraps components with:
 *   - BrowserRouter (for React Router)
 *   - NotificationProvider (for toast messages)
 *   Note: AuthContext and ThemeContext are mocked globally in setupTests.ts
 */

// =============================================================================
// IMPORTS
// =============================================================================

import React, { ReactElement } from 'react';

// React Testing Library utilities
import { render, RenderOptions } from '@testing-library/react';

// React Router for navigation context
import { BrowserRouter } from 'react-router-dom';

// Application providers needed for component rendering
import { NotificationProvider } from '../../contexts/NotificationContext';

// =============================================================================
// CUSTOM RENDER SETUP
// =============================================================================

/**
 * Wrapper component that provides all necessary context providers.
 * This ensures components have access to all contexts they need during tests.
 * 
 * Note: AuthContext and ThemeContext are mocked globally in setupTests.ts
 * so they don't need to be wrapped here.
 */
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </BrowserRouter>
  );
};

/**
 * Custom render function that wraps components with all providers.
 * Use this instead of the default render from @testing-library/react.
 * 
 * @param ui - The React element to render
 * @param options - Additional render options (excluding wrapper)
 * @returns Render result with all testing utilities
 * 
 * @example
 * const { getByText, getByRole } = render(<MyComponent />);
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
// This allows tests to import everything from this file
export * from '@testing-library/react';

// Override render with our custom render
export { customRender as render };

// =============================================================================
// Mock Data Factories
// =============================================================================

export const createMockRobot = (overrides = {}) => ({
  robot_id: 'test_robot_001',
  name: 'Test Robot',
  status: 'online',
  battery_percentage: 85.5,
  location: { x: 1.0, y: 2.0, z: 0.0 },
  last_seen: new Date().toISOString(),
  ...overrides,
});

export const createMockReport = (overrides = {}) => ({
  id: 1,
  title: 'Test Report',
  description: 'Test description',
  robot_id: 'test_robot_001',
  report_type: 'performance',
  created_at: new Date().toISOString(),
  data: {},
  ...overrides,
});

export const createMockSensorData = (overrides = {}) => ({
  timestamp: new Date().toISOString(),
  robot_id: 'test_robot_001',
  sensor_type: 'temperature',
  value: 52.3,
  unit: '°C',
  ...overrides,
});

export const createMockJobSummary = (overrides = {}) => ({
  robot_id: 'test_robot_001',
  status: 'active',
  items_total: 100,
  items_done: 45,
  percent_complete: 45.0,
  start_time: new Date().toISOString(),
  end_time: null,
  ...overrides,
});

// =============================================================================
// API Mock Helpers
// =============================================================================

export const mockApiSuccess = <T,>(data: T) => {
  return Promise.resolve({ data });
};

export const mockApiError = (status: number, message: string) => {
  const error = new Error(message) as any;
  error.response = { status, data: { detail: message } };
  return Promise.reject(error);
};

// =============================================================================
// Wait Utilities
// =============================================================================

export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));
