/**
 * Tests for Grafana utility functions
 * Tests availability checking and URL building
 */
import {
  checkGrafanaAvailability,
  buildGrafanaPanelUrl,
  getGrafanaDashboardUrl,
  GRAFANA_URL,
  GRAFANA_ENABLED
} from '../../utils/grafana';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Grafana Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.REACT_APP_GRAFANA_URL;
    delete process.env.REACT_APP_GRAFANA_ENABLED;
  });

  describe('checkGrafanaAvailability', () => {
    it('returns true when Grafana is available', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await checkGrafanaAvailability();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/health'),
        expect.objectContaining({
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache',
        })
      );
    });

    it('returns false when fetch fails (network error)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkGrafanaAvailability();

      expect(result).toBe(false);
    });

    it('returns false when fetch times out', async () => {
      // Mock AbortController
      const originalAbortController = global.AbortController;
      const mockAbort = jest.fn();
      global.AbortController = jest.fn().mockImplementation(() => ({
        abort: mockAbort,
        signal: { aborted: false },
      })) as any;

      // Mock fetch to reject with abort error
      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

      const result = await checkGrafanaAvailability();

      expect(result).toBe(false);

      // Restore
      global.AbortController = originalAbortController;
    });

    it('handles timeout cleanup', async () => {
      jest.useFakeTimers();
      
      mockFetch.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ ok: true }), 100);
      }));

      const promise = checkGrafanaAvailability();
      
      jest.advanceTimersByTime(100);
      
      const result = await promise;
      expect(result).toBe(true);
      
      jest.useRealTimers();
    });
  });

  describe('buildGrafanaPanelUrl', () => {
    it('builds basic panel URL with required parameters', () => {
      const url = buildGrafanaPanelUrl('dashboard-uid', 1);

      expect(url).toContain('dashboard-uid');
      expect(url).toContain('panelId=1');
      expect(url).toContain('orgId=1');
      expect(url).toContain('from=now-1h');
      expect(url).toContain('to=now');
      expect(url).toContain('refresh=5s');
      expect(url).toContain('theme=light');
    });

    it('includes robotId when provided', () => {
      const url = buildGrafanaPanelUrl('dashboard-uid', 1, {
        robotId: 'robot-001',
      });

      expect(url).toContain('var-robot_id=robot-001');
    });

    it('uses custom time range', () => {
      const url = buildGrafanaPanelUrl('dashboard-uid', 1, {
        from: 'now-6h',
        to: 'now-1h',
      });

      expect(url).toContain('from=now-6h');
      expect(url).toContain('to=now-1h');
    });

    it('uses custom refresh rate', () => {
      const url = buildGrafanaPanelUrl('dashboard-uid', 1, {
        refresh: '30s',
      });

      expect(url).toContain('refresh=30s');
    });

    it('uses dark theme when specified', () => {
      const url = buildGrafanaPanelUrl('dashboard-uid', 1, {
        theme: 'dark',
      });

      expect(url).toContain('theme=dark');
    });

    it('builds URL with all options', () => {
      const url = buildGrafanaPanelUrl('my-dashboard', 5, {
        robotId: 'tonypi-01',
        from: 'now-24h',
        to: 'now',
        refresh: '10s',
        theme: 'dark',
      });

      expect(url).toContain('my-dashboard');
      expect(url).toContain('panelId=5');
      expect(url).toContain('var-robot_id=tonypi-01');
      expect(url).toContain('from=now-24h');
      expect(url).toContain('to=now');
      expect(url).toContain('refresh=10s');
      expect(url).toContain('theme=dark');
    });

    it('uses default Grafana URL', () => {
      const url = buildGrafanaPanelUrl('dashboard-uid', 1);

      // Should start with the default URL
      expect(url).toMatch(/^http:\/\/localhost:3000/);
    });
  });

  describe('getGrafanaDashboardUrl', () => {
    it('returns correct dashboard URL', () => {
      const url = getGrafanaDashboardUrl('my-dashboard-uid');

      expect(url).toBe('http://localhost:3000/d/my-dashboard-uid');
    });

    it('handles different dashboard UIDs', () => {
      const url1 = getGrafanaDashboardUrl('robot-metrics');
      const url2 = getGrafanaDashboardUrl('system-overview');

      expect(url1).toContain('robot-metrics');
      expect(url2).toContain('system-overview');
    });
  });

  describe('Configuration Constants', () => {
    it('exports GRAFANA_URL', () => {
      expect(GRAFANA_URL).toBeDefined();
      expect(typeof GRAFANA_URL).toBe('string');
    });

    it('exports GRAFANA_ENABLED', () => {
      expect(GRAFANA_ENABLED).toBeDefined();
      expect(typeof GRAFANA_ENABLED).toBe('boolean');
    });

    it('uses default URL when env not set', () => {
      expect(GRAFANA_URL).toBe('http://localhost:3000');
    });

    it('GRAFANA_ENABLED defaults to true', () => {
      expect(GRAFANA_ENABLED).toBe(true);
    });
  });

  describe('URL Format Validation', () => {
    it('generates valid URL format for panel', () => {
      const url = buildGrafanaPanelUrl('test-dashboard', 1);

      // Should be a valid URL
      expect(() => new URL(url)).not.toThrow();
    });

    it('generates valid URL format for dashboard', () => {
      const url = getGrafanaDashboardUrl('test-dashboard');

      // Should be a valid URL
      expect(() => new URL(url)).not.toThrow();
    });

    it('properly encodes special characters in robotId', () => {
      const url = buildGrafanaPanelUrl('dashboard', 1, {
        robotId: 'robot&id=123',
      });

      // Should properly encode the special characters
      expect(url).toContain('robot%26id%3D123');
    });
  });
});
