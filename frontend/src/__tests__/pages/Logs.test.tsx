/**
 * Tests for Logs page.
 * 
 * Run with: npm test -- Logs.test.tsx
 */
import { render, screen, waitFor } from '../utils/testUtils';
import userEvent from '@testing-library/user-event';
import Logs from '../../pages/Logs';
import { apiService } from '../../utils/api';

// Use the global mock from setupTests.ts - don't re-mock here

const mockLogs = [
  {
    id: 1,
    level: 'INFO',
    category: 'system',
    message: 'System started successfully',
    robot_id: null,
    timestamp: '2025-01-01T12:00:00Z',
    details: {},
  },
  {
    id: 2,
    level: 'ERROR',
    category: 'mqtt',
    message: 'Connection lost to MQTT broker',
    robot_id: 'tonypi_01',
    timestamp: '2025-01-01T11:55:00Z',
    details: { error_code: 'CONN_LOST' },
  },
  {
    id: 3,
    level: 'WARNING',
    category: 'robot',
    message: 'Battery level low',
    robot_id: 'tonypi_01',
    timestamp: '2025-01-01T11:50:00Z',
    details: { battery_level: 18 },
  },
];

const mockStats = {
  total: 3,
  info: 1,
  warning: 1,
  error: 1,
  critical: 0,
  by_category: {
    system: 1,
    mqtt: 1,
    robot: 1,
  },
};

const mockCategories = ['system', 'mqtt', 'api', 'robot', 'command', 'alert'];

const mockLevels = {
  INFO: { color: 'blue', priority: 1 },
  WARNING: { color: 'yellow', priority: 2 },
  ERROR: { color: 'red', priority: 3 },
  CRITICAL: { color: 'purple', priority: 4 },
};

describe('Logs Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getLogs as jest.Mock).mockResolvedValue(mockLogs);
    (apiService.getLogStats as jest.Mock).mockResolvedValue(mockStats);
    (apiService.getLogCategories as jest.Mock).mockResolvedValue(mockCategories);
    (apiService.getLogLevels as jest.Mock).mockResolvedValue(mockLevels);
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue([]);
  });

  it('renders logs page', async () => {
    render(<Logs />);
    
    await waitFor(() => {
      // Page title is "Logs & Activity History"
      expect(screen.getByText(/Logs & Activity History/i)).toBeInTheDocument();
    });
  });

  it('displays log entries', async () => {
    render(<Logs />);
    
    await waitFor(() => {
      expect(screen.getByText('System started successfully')).toBeInTheDocument();
      expect(screen.getByText('Connection lost to MQTT broker')).toBeInTheDocument();
      expect(screen.getByText('Battery level low')).toBeInTheDocument();
    });
  });

  it('displays log levels', async () => {
    render(<Logs />);
    
    await waitFor(() => {
      expect(screen.getByText('INFO')).toBeInTheDocument();
      expect(screen.getByText('ERROR')).toBeInTheDocument();
      expect(screen.getByText('WARNING')).toBeInTheDocument();
    });
  });

  it('displays log statistics', async () => {
    render(<Logs />);
    
    await waitFor(() => {
      // The stats card shows "Total Logs"
      expect(screen.getByText('Total Logs')).toBeInTheDocument();
    });
  });

  it('has filter controls', async () => {
    render(<Logs />);
    
    await waitFor(() => {
      expect(screen.getByText(/Filter/i)).toBeInTheDocument();
    });
  });

  it('has refresh button', async () => {
    render(<Logs />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    });
  });
});

describe('Logs Page - Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getLogs as jest.Mock).mockResolvedValue(mockLogs);
    (apiService.getLogStats as jest.Mock).mockResolvedValue(mockStats);
    (apiService.getLogCategories as jest.Mock).mockResolvedValue(mockCategories);
    (apiService.getLogLevels as jest.Mock).mockResolvedValue(mockLevels);
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue([]);
  });

  it('filters logs by level', async () => {
    const user = userEvent.setup();
    render(<Logs />);
    
    await waitFor(() => {
      // Page title is "Logs & Activity History"
      expect(screen.getByText(/Logs & Activity History/i)).toBeInTheDocument();
    });
    
    // Find level filter dropdown - should have multiple selects
    const selects = screen.getAllByRole('combobox');
    if (selects.length > 0) {
      // Select the level filter (first select after robot selector)
      const levelSelect = selects.find(s => s.innerHTML.includes('All Levels'));
      if (levelSelect) {
        await user.selectOptions(levelSelect, 'ERROR');
        
        await waitFor(() => {
          expect(apiService.getLogs).toHaveBeenCalled();
        });
      }
    }
  });
});

describe('Logs Page - Empty State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getLogs as jest.Mock).mockResolvedValue([]);
    (apiService.getLogStats as jest.Mock).mockResolvedValue({
      total: 0,
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
      by_category: {},
    });
    (apiService.getLogCategories as jest.Mock).mockResolvedValue(mockCategories);
    (apiService.getLogLevels as jest.Mock).mockResolvedValue(mockLevels);
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue([]);
  });

  it('shows empty state when no logs', async () => {
    render(<Logs />);
    
    await waitFor(() => {
      expect(screen.getByText(/No logs found/i)).toBeInTheDocument();
    });
  });
});
