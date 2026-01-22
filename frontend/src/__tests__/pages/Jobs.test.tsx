/**
 * Tests for Jobs page.
 * 
 * Run with: npm test -- Jobs.test.tsx
 */
import { render, screen, waitFor } from '../utils/testUtils';
import Jobs from '../../pages/Jobs';
import { apiService } from '../../utils/api';

// Mock the API service
jest.mock('../../utils/api', () => ({
  apiService: {
    getJobHistory: jest.fn(),
    getRobotStatus: jest.fn(),
    getJobSummary: jest.fn(),
  },
  handleApiError: jest.fn((error) => 'An error occurred'),
}));

const mockJobs = [
  {
    id: 1,
    robot_id: 'tonypi_01',
    status: 'completed',
    items_total: 100,
    items_done: 100,
    start_time: '2025-01-01T10:00:00Z',
    end_time: '2025-01-01T11:00:00Z',
    percent_complete: 100,
  },
  {
    id: 2,
    robot_id: 'tonypi_01',
    status: 'active',
    items_total: 50,
    items_done: 25,
    start_time: '2025-01-01T12:00:00Z',
    percent_complete: 50,
  },
];

const mockRobots = [
  { robot_id: 'tonypi_01', name: 'TonyPi Robot 01', status: 'online' },
];

describe('Jobs Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getJobHistory as jest.Mock).mockResolvedValue(mockJobs);
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue(mockRobots);
    (apiService.getJobSummary as jest.Mock).mockResolvedValue(mockJobs[1]);
  });

  it('renders jobs page', async () => {
    render(<Jobs />);
    
    await waitFor(() => {
      // Look for the page title which is unique
      expect(screen.getByText(/Job Tracking/i)).toBeInTheDocument();
    });
  });

  it('displays job list', async () => {
    render(<Jobs />);
    
    await waitFor(() => {
      // The Jobs page shows status badges with "Completed" and "In Progress"
      expect(screen.getByText(/Completed/i)).toBeInTheDocument();
    });
  });

  it('displays job progress', async () => {
    render(<Jobs />);
    
    await waitFor(() => {
      // Progress is shown with one decimal place like "100.0%" and "50.0%"
      const progressElements = screen.getAllByText(/\d+\.\d+%/);
      expect(progressElements.length).toBeGreaterThan(0);
    });
  });

  it('displays robot IDs for jobs', async () => {
    render(<Jobs />);
    
    await waitFor(() => {
      expect(screen.getAllByText('tonypi_01').length).toBeGreaterThan(0);
    });
  });
});

describe('Jobs Page - Empty State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getJobHistory as jest.Mock).mockResolvedValue([]);
    (apiService.getRobotStatus as jest.Mock).mockResolvedValue([]);
  });

  it('shows empty state when no jobs', async () => {
    render(<Jobs />);
    
    await waitFor(() => {
      expect(screen.getByText(/No robots connected/i)).toBeInTheDocument();
    });
  });
});
