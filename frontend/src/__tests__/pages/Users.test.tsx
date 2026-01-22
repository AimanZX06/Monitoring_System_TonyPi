/**
 * Tests for Users page.
 * 
 * Run with: npm test -- Users.test.tsx
 */
import { render, screen, waitFor } from '../utils/testUtils';
import userEvent from '@testing-library/user-event';
import Users from '../../pages/Users';
import { apiService } from '../../utils/api';

// Use the global mock from setupTests.ts - don't re-mock here
// AuthContext is mocked globally in setupTests.ts with admin role

const mockUsers = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    is_active: true,
    created_at: '2025-01-01T10:00:00Z',
  },
  {
    id: '2',
    username: 'operator1',
    email: 'operator@example.com',
    role: 'operator',
    is_active: true,
    created_at: '2025-01-01T09:00:00Z',
  },
  {
    id: '3',
    username: 'viewer1',
    email: 'viewer@example.com',
    role: 'viewer',
    is_active: false,
    created_at: '2025-01-01T08:00:00Z',
  },
];

describe('Users Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getUsers as jest.Mock).mockResolvedValue(mockUsers);
  });

  it('renders users page', async () => {
    render(<Users />);
    
    await waitFor(() => {
      expect(screen.getByText(/User Management/i)).toBeInTheDocument();
    });
  });

  it('displays user list', async () => {
    render(<Users />);
    
    await waitFor(() => {
      // 'admin' appears twice (username and role badge), use getAllByText
      const adminElements = screen.getAllByText('admin');
      expect(adminElements.length).toBeGreaterThan(0);
      expect(screen.getByText('operator1')).toBeInTheDocument();
      expect(screen.getByText('viewer1')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays user roles', async () => {
    render(<Users />);
    
    await waitFor(() => {
      // 'admin' appears as both username and role, use getAllByText
      const adminElements = screen.getAllByText('admin');
      expect(adminElements.length).toBeGreaterThan(0);
      expect(screen.getByText('operator')).toBeInTheDocument();
      expect(screen.getByText('viewer')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays user emails', async () => {
    render(<Users />);
    
    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('operator@example.com')).toBeInTheDocument();
    });
  });

  it('has add user button', async () => {
    render(<Users />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add User/i })).toBeInTheDocument();
    });
  });

  it('shows active/inactive status', async () => {
    render(<Users />);
    
    await waitFor(() => {
      // Active status might appear multiple times
      const activeElements = screen.getAllByText('Active');
      expect(activeElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('Users Page - Empty State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getUsers as jest.Mock).mockResolvedValue([]);
  });

  it('shows empty state when no users', async () => {
    render(<Users />);
    
    await waitFor(() => {
      // The page shows "No users found" with additional text after
      expect(screen.getByText(/No users found/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('Users Page - Error Handling', () => {
  it('handles API error gracefully', async () => {
    (apiService.getUsers as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<Users />);
    
    await waitFor(() => {
      expect(screen.getByText(/User Management/i)).toBeInTheDocument();
    });
  });
});
