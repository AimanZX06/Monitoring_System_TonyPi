/**
 * =============================================================================
 * API Service Tests - Unit Tests for Frontend API Client
 * =============================================================================
 * 
 * This test file validates the API service functionality including:
 * - Error handling (handleApiError function)
 * - API method availability
 * - Response parsing
 * 
 * TEST CATEGORIES:
 *   1. handleApiError Tests
 *      - Axios error responses with detail messages
 *      - HTTP status code handling (404, 500, etc.)
 *      - Network/timeout errors
 *      - Standard JavaScript errors
 *      - Unknown error types
 *   
 *   2. API Service Structure Tests
 *      - Verifies all required methods exist
 *      - Ensures API contract is maintained
 * 
 * MOCKING STRATEGY:
 *   - Axios is fully mocked to isolate tests from network
 *   - axios.create() returns mocked instance with all HTTP methods
 *   - axios.isAxiosError() is mocked to control error type detection
 * 
 * RUN COMMAND:
 *   npm test -- api.test.ts
 *   npm test -- --coverage api.test.ts
 * 
 * NOTE: The jest.unmock() call ensures we test the real implementation
 * of our api.ts file, not a mock version.
 */

// =============================================================================
// TEST CONFIGURATION
// =============================================================================

// Unmock the api module to test the real implementation
// This is needed because Jest may auto-mock modules in some configurations
jest.unmock('../../utils/api');

// =============================================================================
// IMPORTS
// =============================================================================

// Axios - HTTP client (mocked for testing)
import axios from 'axios';

// Our API service and error handler under test
import { apiService, handleApiError } from '../../utils/api';

// =============================================================================
// MOCK SETUP
// =============================================================================

/**
 * Mock axios to prevent real HTTP requests during tests.
 * 
 * The mock returns a fake axios instance with all the methods
 * our code uses (get, post, put, delete, interceptors).
 */
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
  isAxiosError: jest.fn(),  // Used to detect axios-specific errors
}));

// Type assertion for mocked axios to get TypeScript support
const mockedAxios = axios.create() as jest.Mocked<typeof axios>;

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleApiError', () => {
    it('returns detail message from response', () => {
      const error = {
        response: {
          data: { detail: 'Custom error message' },
          status: 400,
        },
      };
      (axios.isAxiosError as jest.Mock).mockReturnValue(true);
      
      const result = handleApiError(error);
      expect(result).toBe('Custom error message');
    });

    it('returns "Resource not found" for 404 errors', () => {
      const error = {
        response: {
          status: 404,
          data: {},
        },
      };
      (axios.isAxiosError as jest.Mock).mockReturnValue(true);
      
      const result = handleApiError(error);
      expect(result).toBe('Resource not found');
    });

    it('returns "Server error" for 500 errors', () => {
      const error = {
        response: {
          status: 500,
          data: {},
        },
      };
      (axios.isAxiosError as jest.Mock).mockReturnValue(true);
      
      const result = handleApiError(error);
      expect(result).toBe('Server error. Please try again later.');
    });

    it('returns timeout message for ECONNABORTED', () => {
      const error = {
        code: 'ECONNABORTED',
        response: null,
      };
      (axios.isAxiosError as jest.Mock).mockReturnValue(true);
      
      const result = handleApiError(error);
      expect(result).toBe('Request timeout. Please check your connection.');
    });

    it('returns network error for no response', () => {
      const error = {
        response: undefined,
        message: 'Network Error',
      };
      (axios.isAxiosError as jest.Mock).mockReturnValue(true);
      
      const result = handleApiError(error);
      expect(result).toBe('Network error. Please check your connection.');
    });

    it('returns error message for standard Error', () => {
      const error = new Error('Standard error');
      (axios.isAxiosError as jest.Mock).mockReturnValue(false);
      
      const result = handleApiError(error);
      expect(result).toBe('Standard error');
    });

    it('returns generic message for unknown error', () => {
      const error = 'Some string error';
      (axios.isAxiosError as jest.Mock).mockReturnValue(false);
      
      const result = handleApiError(error);
      expect(result).toBe('An unexpected error occurred');
    });
  });
});

describe('API Service Methods', () => {
  // These tests would need the actual axios mock to be more complex
  // For now, just verify the service object structure
  
  it('has all required methods', () => {
    expect(apiService.healthCheck).toBeDefined();
    expect(apiService.getSensorData).toBeDefined();
    expect(apiService.getRobotStatus).toBeDefined();
    expect(apiService.getReports).toBeDefined();
    expect(apiService.createReport).toBeDefined();
    expect(apiService.deleteReport).toBeDefined();
    expect(apiService.generateReport).toBeDefined();
    expect(apiService.getAIStatus).toBeDefined();
    expect(apiService.downloadPDF).toBeDefined();
    expect(apiService.sendRobotCommand).toBeDefined();
    expect(apiService.getJobSummary).toBeDefined();
    expect(apiService.getServoData).toBeDefined();
  });
});
