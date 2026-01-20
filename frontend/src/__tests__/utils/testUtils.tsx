/**
 * Test utilities and custom render function.
 * 
 * Use these utilities across all tests for consistent setup.
 * This is a utility file, not a test file.
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Dummy test to prevent "test suite must contain at least one test" error
// This file is a utility module, not a test file
describe('Test Utilities', () => {
  it('exports render function', () => {
    expect(typeof render).toBe('function');
  });
});

// All providers that wrap the app
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </ThemeProvider>
  );
};

/**
 * Custom render function that wraps components with all providers.
 * Use this instead of the default render from @testing-library/react.
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
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
