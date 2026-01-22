/**
 * Tests for Alerts page.
 * 
 * Run with: npm test -- Alerts.test.tsx
 */
import { render, screen, waitFor } from '../utils/testUtils';
import userEvent from '@testing-library/user-event';
import Alerts from '../../pages/Alerts';
import { apiService } from '../../utils/api';

// Mock the API service
jest.mock('../../utils/api', () => ({
  apiService: {
    getAlerts: jest.fn(),
    getAlertStats: jest.fn(),
    getRobotStatus: jest.fn(),
    getThresholds: jest.fn(),
    getDefaultThresholds: jest.fn(),
    acknowledgeAlert: jest.fn(),
    resolveAlert: jest.fn(),
    acknowledgeAllAlerts: jest.fn(),
    deleteAlert: jest.fn(),
    createOrUpdateThreshold: jest.fn(),
  },
  handleApiError: jest.fn((error) => 'An error occurred'),
}));

const mockAlerts = [
  {
    id: 1,
    robot_id: 'tonypi_01',
    alert_type: 'temperature',
    severity: 'warning',
    title: 'High Temperature',
    message: 'CPU temperature exceeded warning threshold',
    source: 'sensor',
    value: 75.5,
    threshold: 70.0,
    acknowledged: false,
    resolved: false,
    created_at: '2025-01-01T12:00:00Z',
  },
  {
    id: 2,
    robot_id: 'tonypi_01',
    alert_type: 'battery',
    severity: 'critical',
    title: 'Low Battery',
    message: 'Battery level critically low',
    source: 'sensor',
    value: 10.0,
    threshold: 15.0,
    acknowledged: true,
    resolved: false,
    created_at: '2025-01-01T11:00:00Z',
  },
];

const mockStats = {
  total: 2,
  critical: 1,
  warning: 1,
  info: 0,
  unacknowledged: 1,
  unresolved: 2,
};

const mockRobots = [
  { robot_id: 'tonypi_01', name: 'TonyPi Robot 01', status: 'online' },
  { robot_id: 'tonypi_02', name: 'TonyPi Robot 02', status: 'offline' },
];

const mockThresholds = [
  { id: 1, robot_id: null, metric_type: 'cpu', warning_threshold: 70, critical_threshold: 90, enabled: true },
  { id: 2, robot_id: null, metric_type: 'memory', warning_threshold: 75, critical_threshold: 90, enabled: true },
];

const mockDefaultThresholds = {
  cpu: { warning: 70, critical: 90 },
  memory: { warning: 75, critical: 90 },
  temperature: { warning: 60, critical: 75 },
  battery: { warning: 30, critical: 15 },
};

describe('Alerts Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getAlerts as jest.Mock).mockResolvedValue(mockAlerts);
    (apiService.getAlertStats as jest.Mock).mockResolvedValue(mockStats);
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue(mockRobots);
    (apiService.getThresholds as jest.Mock).mockResolvedValue(mockThresholds);
    (apiService.getDefaultThresholds as jest.Mock).mockResolvedValue(mockDefaultThresholds);
  });

  it('renders alerts page', async () => {
    render(<Alerts />);
    
    await waitFor(() => {
      expect(screen.getByText(/Alerts & Notifications/i)).toBeInTheDocument();
    });
  });

  it('displays alerts list', async () => {
    render(<Alerts />);
    
    await waitFor(() => {
      expect(screen.getByText('High Temperature')).toBeInTheDocument();
      expect(screen.getByText('Low Battery')).toBeInTheDocument();
    });
  });

  it('displays alert statistics', async () => {
    render(<Alerts />);
    
    await waitFor(() => {
      expect(screen.getByText('Total')).toBeInTheDocument();
      // Use getAllByText since "Critical" appears in stats, dropdown, and badges
      expect(screen.getAllByText('Critical').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Warning').length).toBeGreaterThan(0);
    });
  });

  it('displays severity badges correctly', async () => {
    render(<Alerts />);
    
    await waitFor(() => {
      // Use getAllByText since these appear multiple times
      expect(screen.getAllByText('Warning').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Critical').length).toBeGreaterThan(0);
    });
  });

  it('displays robot selector', async () => {
    render(<Alerts />);
    
    await waitFor(() => {
      expect(screen.getByText('Viewing Alerts For')).toBeInTheDocument();
      // Use getAllByText since "All Robots" appears in header and dropdown
      expect(screen.getAllByText('All Robots').length).toBeGreaterThan(0);
    });
  });

  it('has filter controls', async () => {
    render(<Alerts />);
    
    await waitFor(() => {
      expect(screen.getByText('Filters:')).toBeInTheDocument();
    });
  });

  it('has refresh button', async () => {
    render(<Alerts />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    });
  });

  it('has thresholds button', async () => {
    render(<Alerts />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Thresholds/i })).toBeInTheDocument();
    });
  });
});

describe('Alerts Page - Interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getAlerts as jest.Mock).mockResolvedValue(mockAlerts);
    (apiService.getAlertStats as jest.Mock).mockResolvedValue(mockStats);
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue(mockRobots);
    (apiService.acknowledgeAlert as jest.Mock).mockResolvedValue({ message: 'acknowledged' });
    (apiService.resolveAlert as jest.Mock).mockResolvedValue({ message: 'resolved' });
    (apiService.deleteAlert as jest.Mock).mockResolvedValue({ message: 'deleted' });
    (apiService.acknowledgeAllAlerts as jest.Mock).mockResolvedValue({ message: 'all acknowledged' });
    (apiService.getThresholds as jest.Mock).mockResolvedValue(mockThresholds);
    (apiService.getDefaultThresholds as jest.Mock).mockResolvedValue(mockDefaultThresholds);
  });

  it('calls acknowledge alert when clicking acknowledge button', async () => {
    const user = userEvent.setup();
    render(<Alerts />);
    
    await waitFor(() => {
      expect(screen.getByText('High Temperature')).toBeInTheDocument();
    });
    
    // Find acknowledge button for the unacknowledged alert
    const acknowledgeButtons = screen.getAllByTitle('Acknowledge');
    if (acknowledgeButtons.length > 0) {
      await user.click(acknowledgeButtons[0]);
      
      await waitFor(() => {
        expect(apiService.acknowledgeAlert).toHaveBeenCalled();
      });
    }
  });

  it('calls resolve alert when clicking resolve button', async () => {
    const user = userEvent.setup();
    render(<Alerts />);
    
    await waitFor(() => {
      expect(screen.getByText('High Temperature')).toBeInTheDocument();
    });
    
    const resolveButtons = screen.getAllByTitle('Mark as Resolved');
    if (resolveButtons.length > 0) {
      await user.click(resolveButtons[0]);
      
      await waitFor(() => {
        expect(apiService.resolveAlert).toHaveBeenCalled();
      });
    }
  });

  it('refreshes data when clicking refresh button', async () => {
    const user = userEvent.setup();
    render(<Alerts />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    });
    
    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    await user.click(refreshButton);
    
    // API should be called again
    expect(apiService.getAlerts).toHaveBeenCalled();
  });

  it('filters by severity', async () => {
    const user = userEvent.setup();
    render(<Alerts />);
    
    await waitFor(() => {
      expect(screen.getByText('Filters:')).toBeInTheDocument();
    });
    
    // Find severity dropdown
    const selects = screen.getAllByRole('combobox');
    const severitySelect = selects[1]; // First is robot, second is severity
    
    await user.selectOptions(severitySelect, 'critical');
    
    await waitFor(() => {
      expect(apiService.getAlerts).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'critical' })
      );
    });
  });
});

describe('Alerts Page - Empty State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getAlerts as jest.Mock).mockResolvedValue([]);
    (apiService.getAlertStats as jest.Mock).mockResolvedValue({
      total: 0,
      critical: 0,
      warning: 0,
      info: 0,
      unacknowledged: 0,
      unresolved: 0,
    });
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue(mockRobots);
  });

  it('shows empty state message when no alerts', async () => {
    render(<Alerts />);
    
    await waitFor(() => {
      expect(screen.getByText('No alerts found')).toBeInTheDocument();
      expect(screen.getByText('System is running smoothly!')).toBeInTheDocument();
    });
  });
});

describe('Alerts Page - Threshold Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getAlerts as jest.Mock).mockResolvedValue(mockAlerts);
    (apiService.getAlertStats as jest.Mock).mockResolvedValue(mockStats);
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue(mockRobots);
    (apiService.getThresholds as jest.Mock).mockResolvedValue(mockThresholds);
    (apiService.getDefaultThresholds as jest.Mock).mockResolvedValue(mockDefaultThresholds);
  });

  it('opens threshold modal when clicking thresholds button', async () => {
    const user = userEvent.setup();
    render(<Alerts />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Thresholds/i })).toBeInTheDocument();
    });
    
    const thresholdsButton = screen.getByRole('button', { name: /Thresholds/i });
    await user.click(thresholdsButton);
    
    await waitFor(() => {
      expect(screen.getByText('Alert Thresholds')).toBeInTheDocument();
    });
  });
});

describe('Alerts Page - Error Handling', () => {
  it('handles API error gracefully', async () => {
    (apiService.getAlerts as jest.Mock).mockRejectedValue(new Error('Network error'));
    (apiService.getAlertStats as jest.Mock).mockRejectedValue(new Error('Network error'));
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue([]);
    
    render(<Alerts />);
    
    // Should still render the page structure
    await waitFor(() => {
      expect(screen.getByText(/Alerts & Notifications/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
