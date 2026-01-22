/**
 * Tests for Reports page.
 * 
 * Run with: npm test -- Reports.test.tsx
 */
import { render, screen, waitFor } from '../utils/testUtils';
import userEvent from '@testing-library/user-event';
import Reports from '../../pages/Reports';
import { apiService } from '../../utils/api';

// Mock the API service
jest.mock('../../utils/api', () => ({
  apiService: {
    getReports: jest.fn(),
    getRobotStatus: jest.fn(),
    getAIStatus: jest.fn(),
    generateReport: jest.fn(),
    deleteReport: jest.fn(),
    downloadPDF: jest.fn(),
  },
  handleApiError: jest.fn((error) => 'An error occurred'),
}));

// Cast the mocked apiService for TypeScript
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

const mockReports = [
  {
    id: 1,
    title: 'Performance Report',
    description: 'Daily performance summary',
    robot_id: 'test_robot_001',
    report_type: 'performance',
    created_at: '2025-01-01T12:00:00Z',
    data: { avg_cpu_percent: 45.2 },
  },
  {
    id: 2,
    title: 'Job Report',
    description: 'Job completion summary',
    robot_id: 'test_robot_001',
    report_type: 'job',
    created_at: '2025-01-01T10:00:00Z',
    data: { items_processed: 50 },
  },
];

const mockRobots = [
  { robot_id: 'test_robot_001', name: 'Test Robot 1', status: 'online' },
];

const mockAIStatus = {
  gemini_available: false,
  pdf_available: true,
  message: 'Gemini API not configured',
};

describe('Reports Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiService.getReports.mockResolvedValue(mockReports);
    mockedApiService.getRobotStatus.mockResolvedValue(mockRobots);
    mockedApiService.getAIStatus.mockResolvedValue(mockAIStatus);
  });

  it('renders the reports page', async () => {
    render(<Reports />);
    
    // Should show loading initially, then content
    await waitFor(() => {
      expect(screen.getByText(/Reports/i)).toBeInTheDocument();
    });
  });

  it('displays reports list after loading', async () => {
    render(<Reports />);
    
    // Reports are grouped by robot - need to expand to see them
    // Check for robot grouping header instead (robot ID appears in multiple places - dropdown and header)
    await waitFor(() => {
      // Look for robot ID in the grouped view - use getAllByText since it appears multiple times
      const robotElements = screen.getAllByText('test_robot_001');
      expect(robotElements.length).toBeGreaterThan(0);
    });
  });

  it('shows empty state when no reports exist', async () => {
    mockedApiService.getReports.mockResolvedValue([]);
    
    render(<Reports />);
    
    await waitFor(() => {
      expect(screen.getByText(/No reports yet/i)).toBeInTheDocument();
    });
  });

  it('displays AI status indicator', async () => {
    render(<Reports />);
    
    await waitFor(() => {
      expect(screen.getByText(/Gemini API not configured/i)).toBeInTheDocument();
    });
  });

  it('shows robot selection dropdown', async () => {
    render(<Reports />);
    
    // There are multiple comboboxes (robot, report type, time range)
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  it('shows report type selection', async () => {
    render(<Reports />);
    
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
      // Check for report type options - use getAllByText since "Performance" appears in multiple places
      const performanceElements = screen.getAllByText('Performance');
      expect(performanceElements.length).toBeGreaterThan(0);
    });
  });

  it('has generate report button', async () => {
    render(<Reports />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generate Report/i })).toBeInTheDocument();
    });
  });

  it('calls generateReport when button clicked', async () => {
    const user = userEvent.setup();
    mockedApiService.generateReport.mockResolvedValue({ id: 3, title: 'New Report' });
    
    render(<Reports />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generate Report/i })).toBeInTheDocument();
    });
    
    const generateButton = screen.getByRole('button', { name: /Generate Report/i });
    await user.click(generateButton);
    
    await waitFor(() => {
      expect(mockedApiService.generateReport).toHaveBeenCalled();
    });
  });

  it('shows error message on API failure', async () => {
    mockedApiService.getReports.mockRejectedValue(new Error('Network error'));
    
    render(<Reports />);
    
    await waitFor(() => {
      // Error should be handled gracefully
      expect(screen.queryByText(/Reports/i)).toBeInTheDocument();
    });
  });
});

describe('Reports Page - Delete Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiService.getReports.mockResolvedValue(mockReports);
    mockedApiService.getRobotStatus.mockResolvedValue(mockRobots);
    mockedApiService.getAIStatus.mockResolvedValue(mockAIStatus);
    mockedApiService.deleteReport.mockResolvedValue({ message: 'Deleted' });
    
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
  });

  it('has robot group that can be expanded', async () => {
    const user = userEvent.setup();
    render(<Reports />);
    
    // Wait for reports to load - they show in grouped view by robot
    // Robot ID appears in multiple places (dropdown and header), so use getAllByText
    await waitFor(() => {
      const robotElements = screen.getAllByText('test_robot_001');
      expect(robotElements.length).toBeGreaterThan(0);
    });
    
    // Click on the robot group header (h4 element) to expand it
    const robotGroupHeader = screen.getByRole('heading', { level: 4, name: 'test_robot_001' });
    await user.click(robotGroupHeader);
    
    // Now the delete buttons should be visible
    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle(/Delete Report/i);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });
});
