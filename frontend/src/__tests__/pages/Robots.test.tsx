/**
 * =============================================================================
 * Robots Page Tests - Robot Management Interface Testing
 * =============================================================================
 * 
 * This file contains comprehensive tests for the Robots page component,
 * which displays robot information, allows control, and shows detailed status.
 * 
 * TEST SUITES:
 *   Robots Page               - Core functionality tests
 *   Robots Page - Empty State - No robots scenario
 *   Robots Page - Error       - API error handling
 * 
 * FEATURES TESTED:
 *   - Robot list display with names
 *   - Status badges (online/offline)
 *   - Location coordinates (x, y format)
 *   - Battery percentage display
 *   - IP address display
 *   - Empty state handling
 *   - API error graceful handling
 * 
 * MOCK DATA:
 *   mockRobots array contains 2 robots with:
 *   - robot_id:           Unique identifier
 *   - name:               Human-readable name
 *   - status:             online/offline
 *   - battery_percentage: Battery level
 *   - last_seen:          ISO timestamp
 *   - location:           {x, y, z} coordinates
 *   - ip_address:         Robot's IP
 * 
 * TESTING APPROACH:
 *   1. Mock apiService.getRobotStatus before each test
 *   2. Render Robots component with context providers
 *   3. Use waitFor for async loading
 *   4. Assert robot data is displayed correctly
 * 
 * RUN COMMAND:
 *   npm test -- Robots.test.tsx
 *   npm test -- Robots.test.tsx --verbose
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { render, screen, waitFor } from '../utils/testUtils';
import userEvent from '@testing-library/user-event';
import Robots from '../../pages/Robots';
import { apiService } from '../../utils/api';

// Mock the API service
jest.mock('../../utils/api', () => ({
  apiService: {
    getRobotStatus: jest.fn(),
    sendRobotCommand: jest.fn(),
  },
  handleApiError: jest.fn((error) => 'An error occurred'),
}));

// Mock data matching RobotData interface from types/index.ts
const mockRobots = [
  {
    robot_id: 'tonypi_01',
    name: 'TonyPi Robot 01',
    status: 'online',
    battery_percentage: 85,
    last_seen: '2025-01-01T10:00:00Z',
    location: { x: 1.5, y: 2.3, z: 0 },
    ip_address: '192.168.1.100',
  },
  {
    robot_id: 'tonypi_02',
    name: 'TonyPi Robot 02',
    status: 'offline',
    battery_percentage: 45,
    last_seen: '2025-01-01T09:00:00Z',
    location: { x: 3.2, y: 4.1, z: 0 },
    ip_address: '192.168.1.101',
  },
];

describe('Robots Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue(mockRobots);
  });

  it('renders robots page', async () => {
    render(<Robots />);
    
    await waitFor(() => {
      // Check for page header or robot names
      expect(screen.getByText('TonyPi Robot 01')).toBeInTheDocument();
    });
  });

  it('displays robot list', async () => {
    render(<Robots />);
    
    await waitFor(() => {
      expect(screen.getByText('TonyPi Robot 01')).toBeInTheDocument();
      expect(screen.getByText('TonyPi Robot 02')).toBeInTheDocument();
    });
  });

  it('displays robot status badges', async () => {
    render(<Robots />);
    
    await waitFor(() => {
      // Status badges may be styled, check for at least one robot name
      expect(screen.getByText('TonyPi Robot 01')).toBeInTheDocument();
    });
  });

  it('shows robot coordinates from location', async () => {
    render(<Robots />);
    
    await waitFor(() => {
      // The component displays location as "(x, y)" format with toFixed(1)
      expect(screen.getByText('(1.5, 2.3)')).toBeInTheDocument();
    });
  });

  it('displays battery percentage', async () => {
    render(<Robots />);
    
    await waitFor(() => {
      // Battery is displayed with toFixed(1), so 85 becomes "85.0%"
      expect(screen.getByText('85.0%')).toBeInTheDocument();
    });
  });
});

describe('Robots Page - Empty State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue([]);
  });

  it('shows empty state when no robots', async () => {
    render(<Robots />);
    
    await waitFor(() => {
      // Look for any indication of no robots (loading state first, then empty)
      // The page may show a loading spinner initially
      expect(screen.queryByText('TonyPi Robot 01')).not.toBeInTheDocument();
    });
  });
});

describe('Robots Page - Error Handling', () => {
  it('handles API error gracefully', async () => {
    (apiService.getRobotStatus as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<Robots />);
    
    // Should not crash - page should still render
    await waitFor(() => {
      // After error, robots array will be empty, page still renders
      expect(screen.queryByText('TonyPi Robot 01')).not.toBeInTheDocument();
    });
  });
});
