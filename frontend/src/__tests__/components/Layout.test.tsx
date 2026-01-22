/**
 * Tests for Layout component.
 * 
 * Run with: npm test -- Layout.test.tsx
 */
import { render, screen } from '../utils/testUtils';
import userEvent from '@testing-library/user-event';
import Layout from '../../components/Layout';

// Use the global mocks from setupTests.ts for AuthContext and ThemeContext
const renderLayout = (children: React.ReactNode = <div>Test Content</div>) => {
  return render(<Layout>{children}</Layout>);
};

describe('Layout Component', () => {
  it('renders layout with navigation', () => {
    renderLayout();
    
    // Layout shows "TonyPi" and "Monitor" separately
    expect(screen.getByText('TonyPi')).toBeInTheDocument();
    expect(screen.getByText('Monitor')).toBeInTheDocument();
  });

  it('displays navigation links', () => {
    renderLayout();
    
    // The Layout component has these navigation items
    // 'Dashboard' appears multiple times (nav link + page header), so use getAllByText
    const dashboardElements = screen.getAllByText('Dashboard');
    expect(dashboardElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Reporting')).toBeInTheDocument();
    expect(screen.getByText('Management')).toBeInTheDocument();
  });

  it('displays system status', () => {
    renderLayout();
    
    // The layout shows system status instead of user info
    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('System Online')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderLayout(<div>Custom Content</div>);
    
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });
});

describe('Layout Component - Navigation', () => {
  it('has correct navigation links', () => {
    renderLayout();
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute('href', '/');
    
    const monitoringLink = screen.getByRole('link', { name: /monitoring/i });
    expect(monitoringLink).toHaveAttribute('href', '/monitoring');
  });
});

describe('Layout Component - Responsive', () => {
  it('renders navigation element for responsive layout', () => {
    renderLayout();
    
    // The Layout has a navigation element
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    
    // Navigation contains links
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});
