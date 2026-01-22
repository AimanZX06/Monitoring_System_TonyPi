/**
 * =============================================================================
 * MSW Server Setup - Mock API Server for Tests
 * =============================================================================
 * 
 * This file creates and exports the MSW (Mock Service Worker) server instance
 * that intercepts HTTP requests during tests.
 * 
 * USAGE IN TESTS:
 *   The server is typically started/stopped in setupTests.ts:
 *   
 *   beforeAll(() => server.listen());
 *   afterEach(() => server.resetHandlers());
 *   afterAll(() => server.close());
 * 
 * OVERRIDING HANDLERS IN TESTS:
 *   You can override specific handlers for testing error cases:
 *   
 *   import { server } from '../mocks/server';
 *   import { http, HttpResponse } from 'msw';
 *   
 *   it('handles API errors', async () => {
 *     server.use(
 *       http.get('/api/v1/robots', () => {
 *         return new HttpResponse(null, { status: 500 });
 *       })
 *     );
 *     // Test error handling...
 *   });
 * 
 * NOTE: This uses msw/node for Node.js/Jest environment.
 * For browser testing (Cypress, etc.), use msw/browser instead.
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// =============================================================================
// SERVER SETUP
// =============================================================================

// Create the mock server with default handlers from handlers.ts
// All requests matching handler patterns will be intercepted
export const server = setupServer(...handlers);

// Re-export handlers for tests that need to reference or override them
export { handlers };
