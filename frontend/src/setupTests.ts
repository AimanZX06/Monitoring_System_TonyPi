/**
 * =============================================================================
 * Jest Test Setup - Global Configuration for Frontend Tests
 * =============================================================================
 * 
 * This file is automatically loaded by Jest before each test file runs.
 * It configures the test environment with necessary polyfills, mocks, and
 * global setup required for testing React components.
 * 
 * WHAT THIS FILE DOES:
 *   1. Imports jest-dom for DOM assertion matchers
 *   2. Polyfills browser APIs missing in Node.js (TextEncoder, etc.)
 *   3. Mocks browser APIs (localStorage, matchMedia, ResizeObserver)
 *   4. Mocks application contexts (Theme, Auth)
 *   5. Mocks API service to prevent real HTTP calls
 *   6. Suppresses noisy console warnings during tests
 * 
 * JEST-DOM MATCHERS ADDED:
 *   - toBeInTheDocument()
 *   - toHaveClass()
 *   - toHaveValue()
 *   - toBeDisabled()
 *   - toBeVisible()
 *   - And more...
 * 
 * MOCKING STRATEGY:
 *   - Contexts are mocked globally to provide consistent test state
 *   - API service is fully mocked to isolate tests from backend
 *   - Browser APIs are mocked for Node.js compatibility
 * 
 * CONFIGURATION:
 *   This file is referenced in package.json under jest.setupFilesAfterEnv
 *   or in jest.config.js as setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts']
 */

// =============================================================================
// IMPORTS
// =============================================================================

// Jest DOM - adds custom matchers for DOM node assertions
import '@testing-library/jest-dom';

import React from 'react';

// Node.js utilities for polyfills
import { TextEncoder, TextDecoder } from 'util';

// =============================================================================
// POLYFILLS
// =============================================================================

// Polyfill TextEncoder/TextDecoder for MSW compatibility in Node.js/Jest environment
// These are available in browsers but not in Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// =============================================================================
// Global Mocks
// =============================================================================

// Mock localStorage - must be done before other code runs
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    length: 0,
    key: jest.fn(),
  };
})();

Object.defineProperty(window, 'localStorage', { 
  value: localStorageMock,
  writable: true 
});

// Mock window.matchMedia (used by ThemeContext and other UI components)
const matchMediaMock = jest.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: matchMediaMock,
});

// Mock ResizeObserver (used by Recharts)
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock;

// Mock scrollTo
window.scrollTo = jest.fn();

// =============================================================================
// Mock Theme Context - Avoids matchMedia issues in tests
// =============================================================================
jest.mock('./contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
    isDark: false,
  }),
}));

// =============================================================================
// Mock Auth Context - Used by most components
// =============================================================================
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: {
      id: 'test-user-001',
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
      is_active: true,
    },
    isAuthenticated: true,
    login: jest.fn().mockResolvedValue(true),
    logout: jest.fn(),
    isLoading: false,
  }),
}));

// =============================================================================
// Mock API Service - Prevent real HTTP calls
// =============================================================================
jest.mock('./utils/api', () => ({
  apiService: {
    // Robot endpoints
    getRobots: jest.fn().mockResolvedValue([]),
    getRobot: jest.fn().mockResolvedValue(null),
    getRobotStatus: jest.fn().mockResolvedValue([]),
    getRobotsFromDB: jest.fn().mockResolvedValue([]),
    sendCommand: jest.fn().mockResolvedValue({ success: true }),
    sendRobotCommand: jest.fn().mockResolvedValue({ success: true }),
    
    // Job endpoints
    getJobs: jest.fn().mockResolvedValue([]),
    getJobHistory: jest.fn().mockResolvedValue([]),
    getJobSummary: jest.fn().mockResolvedValue({}),
    
    // System endpoints
    getSystemStatus: jest.fn().mockResolvedValue({}),
    
    // Alert endpoints
    getAlerts: jest.fn().mockResolvedValue([]),
    getAlertStats: jest.fn().mockResolvedValue({ total: 0, critical: 0, warning: 0, info: 0, unacknowledged: 0, unresolved: 0 }),
    getThresholds: jest.fn().mockResolvedValue([]),
    getDefaultThresholds: jest.fn().mockResolvedValue({}),
    updateThreshold: jest.fn().mockResolvedValue({}),
    createOrUpdateThreshold: jest.fn().mockResolvedValue({}),
    acknowledgeAlert: jest.fn().mockResolvedValue({}),
    acknowledgeAllAlerts: jest.fn().mockResolvedValue({}),
    resolveAlert: jest.fn().mockResolvedValue({}),
    deleteAlert: jest.fn().mockResolvedValue(undefined),
    
    // Report endpoints
    getReports: jest.fn().mockResolvedValue([]),
    createReport: jest.fn().mockResolvedValue({}),
    deleteReport: jest.fn().mockResolvedValue(undefined),
    generateReport: jest.fn().mockResolvedValue({}),
    downloadPDF: jest.fn().mockResolvedValue(new Blob()),
    
    // Log endpoints
    getLogs: jest.fn().mockResolvedValue([]),
    getLogStats: jest.fn().mockResolvedValue({ total: 0, info: 0, warning: 0, error: 0, critical: 0, by_category: {} }),
    getLogCategories: jest.fn().mockResolvedValue([]),
    getLogLevels: jest.fn().mockResolvedValue({}),
    getErrorLogs: jest.fn().mockResolvedValue([]),
    getCommandHistory: jest.fn().mockResolvedValue([]),
    clearOldLogs: jest.fn().mockResolvedValue({}),
    exportLogs: jest.fn().mockResolvedValue(new Blob()),
    exportLogsJson: jest.fn().mockResolvedValue(new Blob()),
    exportLogsCsv: jest.fn().mockResolvedValue(new Blob()),
    
    // User endpoints
    getUsers: jest.fn().mockResolvedValue([]),
    createUser: jest.fn().mockResolvedValue({}),
    updateUser: jest.fn().mockResolvedValue({}),
    deleteUser: jest.fn().mockResolvedValue(undefined),
    
    // Sensor endpoints
    getSensors: jest.fn().mockResolvedValue([]),
    getSensorData: jest.fn().mockResolvedValue([]),
    getServoData: jest.fn().mockResolvedValue([]),
    
    // Health & Status endpoints
    healthCheck: jest.fn().mockResolvedValue({ status: 'ok' }),
    getAIStatus: jest.fn().mockResolvedValue({ status: 'ok' }),
    
    // Auth endpoints
    login: jest.fn().mockResolvedValue({ access_token: 'test-token' }),
    logout: jest.fn().mockResolvedValue(undefined),
  },
  tokenService: {
    getToken: jest.fn().mockReturnValue('test-token'),
    setToken: jest.fn(),
    removeToken: jest.fn(),
  },
  handleApiError: jest.fn((error) => 'An error occurred'),
}));

// Global test timeout
jest.setTimeout(10000);

// =============================================================================
// Suppress noisy console warnings during tests
// =============================================================================

// Store original console.error
const originalConsoleError = console.error;

// Suppress act() warnings - these are often false positives in React Testing Library
console.error = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  
  // Suppress common false-positive warnings
  if (
    message.includes('Warning: An update to') &&
    message.includes('inside a test was not wrapped in act')
  ) {
    return; // Suppress act() warnings
  }
  
  if (message.includes('Warning: ReactDOM.render is no longer supported')) {
    return; // Suppress React 18 render warnings
  }
  
  // Pass through all other errors
  originalConsoleError.apply(console, args);
};
