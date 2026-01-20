/**
 * Tests for API service.
 * 
 * Run with: npm test -- api.test.ts
 */

// Mock axios BEFORE importing api module
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
        eject: jest.fn(),
      },
      response: {
        use: jest.fn(),
        eject: jest.fn(),
      },
    },
  };
  
  return {
    create: jest.fn(() => mockAxiosInstance),
    isAxiosError: jest.fn(),
  };
});

import axios from 'axios';
import { apiService, handleApiError } from '../../utils/api';

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
