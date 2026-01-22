/**
 * =============================================================================
 * Dashboard Page Tests - Main Overview Page Testing
 * =============================================================================
 * 
 * This file contains comprehensive tests for the Dashboard page component,
 * which is the main landing page showing robot status, system health, and stats.
 * 
 * TEST SUITES:
 *   Dashboard Page            - Core functionality tests
 *   Dashboard Page - Error    - Error handling scenarios
 *   Dashboard Page - Empty    - Empty state handling
 * 
 * FEATURES TESTED:
 *   - Robot card display with status and battery
 *   - Active robots count
 *   - System services status (MQTT, InfluxDB, PostgreSQL, Grafana)
 *   - Resource usage display (CPU, memory, disk)
 *   - Stats cards (active jobs, completed, items processed)
 *   - View Details and Send Command buttons
 *   - Loading state with spinner
 *   - Error handling for API failures
 *   - Empty state when no robots
 * 
 * MOCK DATA:
 *   - mockRobots:       Array of 2 robots (online/offline)
 *   - mockSystemStatus: System services and resource usage
 *   - mockJobSummary:   Active job progress data
 * 
 * TESTING APPROACH:
 *   1. Mock apiService before each test
 *   2. Render Dashboard component with test utilities
 *   3. Use waitFor to handle async data loading
 *   4. Assert UI elements are displayed correctly
 * 
 * RUN COMMAND:
 *   npm test -- Dashboard.test.tsx
 *   npm test -- Dashboard.test.tsx --verbose
 *   npm test -- Dashboard.test.tsx --coverage
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { render, screen, waitFor } from '../utils/testUtils';
import Dashboard from '../../pages/Dashboard';
import { apiService } from '../../utils/api';

// Mock the API service
jest.mock('../../utils/api', () => ({
  apiService: {
    getRobotStatus: jest.fn(),
    getSystemStatus: jest.fn(),
    getJobSummary: jest.fn(),
  },
  handleApiError: jest.fn((error) => 'An error occurred'),
}));

const mockRobots = [
  {
    robot_id: 'tonypi_01',
    name: 'TonyPi Robot 01',
    status: 'online',
    battery_percentage: 85.5,
    last_seen: '2025-01-01T12:00:00Z',
    location: { x: 1.0, y: 2.0 },
  },
  {
    robot_id: 'tonypi_02',
    name: 'TonyPi Robot 02',
    status: 'offline',
    battery_percentage: 20.0,
    last_seen: '2025-01-01T11:00:00Z',
  },
];

const mockSystemStatus = {
  active_robots: 1,
  services: {
    mqtt_broker: 'running',
    influxdb: 'running',
    postgres: 'running',
    grafana: 'running',
  },
  resource_usage: {
    cpu_percent: 25,
    memory_percent: 60,
    disk_usage_percent: 35,
  },
};

const mockJobSummary = {
  robot_id: 'tonypi_01',
  status: 'active',
  items_total: 100,
  items_done: 50,
  start_time: '2025-01-01T10:00:00Z',
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue(mockRobots);
    (apiService.getSystemStatus as jest.Mock).mockResolvedValue(mockSystemStatus);
    (apiService.getJobSummary as jest.Mock).mockResolvedValue(mockJobSummary);
  });

  it('renders loading state initially', () => {
    render(<Dashboard />);
    
    // Should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('displays robot cards after loading', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('TonyPi Robot 01')).toBeInTheDocument();
      expect(screen.getByText('TonyPi Robot 02')).toBeInTheDocument();
    });
  });

  it('displays active robots count', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Active Robots')).toBeInTheDocument();
    });
  });

  it('displays robot status correctly', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('ONLINE')).toBeInTheDocument();
      expect(screen.getByText('OFFLINE')).toBeInTheDocument();
    });
  });

  it('displays battery percentage', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('85.5%')).toBeInTheDocument();
      expect(screen.getByText('20.0%')).toBeInTheDocument();
    });
  });

  it('displays system services status', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('System Services')).toBeInTheDocument();
      expect(screen.getByText('mqtt broker')).toBeInTheDocument();
      // 'running' appears multiple times for each service
      const runningStatuses = screen.getAllByText('running');
      expect(runningStatuses.length).toBeGreaterThan(0);
    });
  });

  it('displays resource usage', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Resource Usage')).toBeInTheDocument();
      // CPU, memory, and disk percentages are displayed
      expect(screen.getByText('cpu percent')).toBeInTheDocument();
      expect(screen.getByText('memory percent')).toBeInTheDocument();
    });
  });

  it('displays stats cards', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Active Jobs')).toBeInTheDocument();
      expect(screen.getByText('Completed Today')).toBeInTheDocument();
      expect(screen.getByText('Items Processed')).toBeInTheDocument();
    });
  });

  it('has View Details button for each robot', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      const viewButtons = screen.getAllByText('View Details');
      expect(viewButtons.length).toBe(mockRobots.length);
    });
  });

  it('has Send Command button for each robot', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      const commandButtons = screen.getAllByText('Send Command');
      expect(commandButtons.length).toBe(mockRobots.length);
    });
  });
});

describe('Dashboard Page - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles API error gracefully', async () => {
    (apiService.getRobotStatus as jest.Mock).mockRejectedValue(new Error('Network error'));
    (apiService.getSystemStatus as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<Dashboard />);
    
    // Should eventually stop loading even with errors
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles job summary error gracefully', async () => {
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue(mockRobots);
    (apiService.getSystemStatus as jest.Mock).mockResolvedValue(mockSystemStatus);
    (apiService.getJobSummary as jest.Mock).mockRejectedValue(new Error('Job not found'));
    
    render(<Dashboard />);
    
    await waitFor(() => {
      // Should still show robots even if job summary fails
      expect(screen.getByText('TonyPi Robot 01')).toBeInTheDocument();
    });
  });
});

describe('Dashboard Page - Empty State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue([]);
    (apiService.getSystemStatus as jest.Mock).mockResolvedValue({});
  });

  it('renders correctly with no robots', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      // Should show stats cards even with no robots
      expect(screen.getByText('Active Robots')).toBeInTheDocument();
    });
  });
});
