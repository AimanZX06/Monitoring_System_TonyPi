/**
 * Tests for configuration module.
 * 
 * Run with: npm test -- config.test.ts
 */
import {
  API_BASE_URL,
  API_VERSION,
  API_PREFIX,
  API_TIMEOUT,
  MQTT_BROKER_URL,
  GRAFANA_BASE_URL,
  POLLING_INTERVALS,
  THRESHOLDS,
  getGrafanaPanelUrl,
  getGrafanaDashboardUrl,
} from '../../utils/config';

describe('Configuration', () => {
  describe('API Configuration', () => {
    it('has correct API base URL', () => {
      expect(API_BASE_URL).toBe('http://localhost:8000');
    });

    it('has correct API version', () => {
      expect(API_VERSION).toBe('v1');
    });

    it('has correct API prefix', () => {
      expect(API_PREFIX).toBe('/api/v1');
    });

    it('has reasonable timeout', () => {
      expect(API_TIMEOUT).toBeGreaterThan(0);
      expect(API_TIMEOUT).toBeLessThanOrEqual(30000);
    });
  });

  describe('MQTT Configuration', () => {
    it('has MQTT broker URL', () => {
      expect(MQTT_BROKER_URL).toBeDefined();
      expect(MQTT_BROKER_URL).toContain('ws://');
    });
  });

  describe('Grafana Configuration', () => {
    it('has Grafana base URL', () => {
      expect(GRAFANA_BASE_URL).toBeDefined();
      expect(GRAFANA_BASE_URL).toContain('localhost:3000');
    });

    it('generates correct panel URL', () => {
      const panelUrl = getGrafanaPanelUrl(1, 'light');
      expect(panelUrl).toContain('panelId=1');
      expect(panelUrl).toContain('theme=light');
    });

    it('generates correct dashboard URL', () => {
      const dashboardUrl = getGrafanaDashboardUrl();
      expect(dashboardUrl).toContain(GRAFANA_BASE_URL);
      expect(dashboardUrl).toContain('/d/');
    });
  });

  describe('Polling Intervals', () => {
    it('has all required intervals', () => {
      expect(POLLING_INTERVALS.robotStatus).toBeDefined();
      expect(POLLING_INTERVALS.sensorData).toBeDefined();
      expect(POLLING_INTERVALS.jobSummary).toBeDefined();
      expect(POLLING_INTERVALS.servoData).toBeDefined();
      expect(POLLING_INTERVALS.performance).toBeDefined();
    });

    it('intervals are reasonable values', () => {
      Object.values(POLLING_INTERVALS).forEach(interval => {
        expect(interval).toBeGreaterThanOrEqual(1000);
        expect(interval).toBeLessThanOrEqual(60000);
      });
    });
  });

  describe('Thresholds', () => {
    it('has CPU thresholds', () => {
      expect(THRESHOLDS.cpu.warning).toBeLessThan(THRESHOLDS.cpu.danger);
    });

    it('has memory thresholds', () => {
      expect(THRESHOLDS.memory.warning).toBeLessThan(THRESHOLDS.memory.danger);
    });

    it('has disk thresholds', () => {
      expect(THRESHOLDS.disk.warning).toBeLessThan(THRESHOLDS.disk.danger);
    });

    it('has temperature thresholds', () => {
      expect(THRESHOLDS.temperature.warning).toBeLessThan(THRESHOLDS.temperature.danger);
    });

    it('has battery thresholds', () => {
      // Battery warning should be higher than danger (low battery)
      expect(THRESHOLDS.battery.warning).toBeGreaterThan(THRESHOLDS.battery.danger);
    });
  });
});
