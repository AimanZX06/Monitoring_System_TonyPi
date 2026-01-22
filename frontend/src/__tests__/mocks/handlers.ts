/**
 * =============================================================================
 * MSW (Mock Service Worker) API Handlers
 * =============================================================================
 * 
 * This file defines mock API handlers for testing the frontend without a real
 * backend. MSW intercepts HTTP requests and returns predefined mock responses.
 * 
 * HOW IT WORKS:
 *   1. Tests import and start the MSW server (see server.ts)
 *   2. When frontend code makes API calls, MSW intercepts them
 *   3. Handlers match requests by method and URL pattern
 *   4. Mock responses are returned instead of hitting real endpoints
 * 
 * BENEFITS:
 *   - Tests don't depend on backend being running
 *   - Faster tests (no network latency)
 *   - Deterministic responses (always same data)
 *   - Can test error scenarios easily
 * 
 * ADDING NEW HANDLERS:
 *   1. Define mock data at the top of the file
 *   2. Add a new http.get/post/put/delete handler
 *   3. Use the same URL pattern as the real API
 * 
 * TESTING ERROR CASES:
 *   In individual tests, you can override handlers:
 *   
 *   server.use(
 *     http.get('/api/v1/robots', () => {
 *       return new HttpResponse(null, { status: 500 });
 *     })
 *   );
 * 
 * ENDPOINTS MOCKED:
 *   - GET  /health              - Health check
 *   - GET  /robot-data/status   - Robot status list
 *   - GET  /robot-data/sensors  - Sensor data
 *   - GET  /reports             - Report list
 *   - POST /reports             - Create report
 *   - GET  /reports/:id         - Get report by ID
 *   - DELETE /reports/:id       - Delete report
 *   - POST /reports/generate    - Generate report
 *   - GET  /reports/ai-status   - AI availability
 *   - GET  /robot-data/job-summary/:id - Job progress
 *   - GET  /management/system/status   - System health
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:8000/api/v1';

// =============================================================================
// Mock Data
// =============================================================================

const mockRobots = [
  {
    robot_id: 'test_robot_001',
    name: 'Test Robot 1',
    status: 'online',
    battery_percentage: 85.5,
    location: { x: 1.0, y: 2.0, z: 0.0 },
    last_seen: new Date().toISOString(),
  },
];

const mockReports = [
  {
    id: 1,
    title: 'Performance Report',
    description: 'Daily performance summary',
    robot_id: 'test_robot_001',
    report_type: 'performance',
    created_at: new Date().toISOString(),
    data: { avg_cpu_percent: 45.2, avg_memory_percent: 62.1 },
  },
];

const mockSensorData = [
  {
    timestamp: new Date().toISOString(),
    robot_id: 'test_robot_001',
    sensor_type: 'temperature',
    value: 52.3,
    unit: '°C',
  },
];

// =============================================================================
// API Handlers
// =============================================================================

export const handlers = [
  // Health check
  http.get(`${API_BASE}/health`, () => {
    return HttpResponse.json({ status: 'healthy', timestamp: new Date().toISOString() });
  }),

  // Robot status
  http.get(`${API_BASE}/robot-data/status`, () => {
    return HttpResponse.json(mockRobots);
  }),

  // Sensor data
  http.get(`${API_BASE}/robot-data/sensors`, () => {
    return HttpResponse.json(mockSensorData);
  }),

  // Reports - List
  http.get(`${API_BASE}/reports`, () => {
    return HttpResponse.json(mockReports);
  }),

  // Reports - Create
  http.post(`${API_BASE}/reports`, async ({ request }) => {
    const body = await request.json() as any;
    const newReport = {
      id: Date.now(),
      ...body,
      created_at: new Date().toISOString(),
    };
    return HttpResponse.json(newReport);
  }),

  // Reports - Get by ID
  http.get(`${API_BASE}/reports/:id`, ({ params }) => {
    const report = mockReports.find(r => r.id === Number(params.id));
    if (report) {
      return HttpResponse.json(report);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // Reports - Delete
  http.delete(`${API_BASE}/reports/:id`, ({ params }) => {
    return HttpResponse.json({ message: `Report ${params.id} deleted` });
  }),

  // Reports - Generate
  http.post(`${API_BASE}/reports/generate`, () => {
    return HttpResponse.json({
      id: Date.now(),
      title: 'Generated Report',
      report_type: 'performance',
      created_at: new Date().toISOString(),
      data: {},
    });
  }),

  // AI Status
  http.get(`${API_BASE}/reports/ai-status`, () => {
    return HttpResponse.json({
      gemini_available: false,
      pdf_available: true,
      message: 'Gemini API not configured',
    });
  }),

  // Job Summary
  http.get(`${API_BASE}/robot-data/job-summary/:robotId`, () => {
    return HttpResponse.json({
      robot_id: 'test_robot_001',
      status: 'active',
      items_total: 100,
      items_done: 45,
      percent_complete: 45.0,
      start_time: new Date().toISOString(),
    });
  }),

  // Management - System Status
  http.get(`${API_BASE}/management/system/status`, () => {
    return HttpResponse.json({
      status: 'healthy',
      services: {
        database: 'connected',
        mqtt: 'connected',
        influxdb: 'connected',
      },
    });
  }),
];

export default handlers;
