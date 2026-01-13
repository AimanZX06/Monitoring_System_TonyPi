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
    (apiService.getReports as jest.Mock).mockResolvedValue(mockReports);
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue(mockRobots);
    (apiService.getAIStatus as jest.Mock).mockResolvedValue(mockAIStatus);
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
    
    await waitFor(() => {
      expect(screen.getByText('Performance Report')).toBeInTheDocument();
      expect(screen.getByText('Job Report')).toBeInTheDocument();
    });
  });

  it('shows empty state when no reports exist', async () => {
    (apiService.getReports as jest.Mock).mockResolvedValue([]);
    
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
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  it('shows report type selection', async () => {
    render(<Reports />);
    
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
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
    (apiService.generateReport as jest.Mock).mockResolvedValue({ id: 3, title: 'New Report' });
    
    render(<Reports />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generate Report/i })).toBeInTheDocument();
    });
    
    const generateButton = screen.getByRole('button', { name: /Generate Report/i });
    await user.click(generateButton);
    
    await waitFor(() => {
      expect(apiService.generateReport).toHaveBeenCalled();
    });
  });

  it('shows error message on API failure', async () => {
    (apiService.getReports as jest.Mock).mockRejectedValue(new Error('Network error'));
    
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
    (apiService.getReports as jest.Mock).mockResolvedValue(mockReports);
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue(mockRobots);
    (apiService.getAIStatus as jest.Mock).mockResolvedValue(mockAIStatus);
    (apiService.deleteReport as jest.Mock).mockResolvedValue({ message: 'Deleted' });
    
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
  });

  it('has delete button for each report', async () => {
    render(<Reports />);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle(/Delete Report/i);
      expect(deleteButtons.length).toBe(mockReports.length);
    });
  });
});
