# Unit Testing Guide - TonyPi Monitoring System

This guide documents how to perform, run, and document unit tests for the TonyPi Monitoring System project.

## Table of Contents

1. [Overview](#overview)
2. [Testing Architecture](#testing-architecture)
3. [Backend Testing (Python/FastAPI)](#backend-testing-pythonfastapi)
4. [Frontend Testing (React/TypeScript)](#frontend-testing-reacttypescript)
5. [Running Tests](#running-tests)
6. [Writing New Tests](#writing-new-tests)
7. [Test Coverage](#test-coverage)
8. [CI/CD Integration](#cicd-integration)
9. [Best Practices](#best-practices)

---

## Overview

The TonyPi Monitoring System uses two testing frameworks:

| Component | Framework | Config File | Test Location |
|-----------|-----------|-------------|---------------|
| Backend (Python) | pytest | `backend/pytest.ini` | `backend/tests/` |
| Frontend (React) | Jest + React Testing Library | `frontend/package.json` | `frontend/src/__tests__/` |

### Testing Pyramid

```
        /\
       /  \        E2E Tests (few)
      /----\
     /      \      Integration Tests (some)
    /--------\
   /          \    Unit Tests (many) ← Focus here
  --------------
```

---

## Testing Architecture

### Backend Test Structure

```
backend/
├── pytest.ini              # Pytest configuration
├── tests/
│   ├── __init__.py
│   ├── conftest.py         # Shared fixtures
│   ├── test_health.py      # Health endpoint tests
│   ├── test_reports.py     # Reports API tests
│   └── test_robot_data.py  # Robot data tests
```

### Frontend Test Structure

```
frontend/src/
├── setupTests.ts           # Jest global setup
├── App.test.tsx            # Main app tests
├── __tests__/
│   ├── components/         # Component tests
│   │   └── Toast.test.tsx
│   ├── pages/              # Page tests
│   │   └── Reports.test.tsx
│   ├── utils/              # Utility tests
│   │   ├── api.test.ts
│   │   └── config.test.ts
│   └── mocks/              # MSW mock handlers
│       ├── handlers.ts
│       └── server.ts
```

---

## Backend Testing (Python/FastAPI)

### Prerequisites

```bash
cd backend
pip install -r requirements.txt
```

Key testing dependencies:
- `pytest==7.4.3` - Test framework
- `pytest-cov==4.1.0` - Coverage reporting
- `pytest-asyncio==0.21.1` - Async test support
- `pytest-mock==3.12.0` - Mocking utilities

### Test Markers

Tests are categorized using pytest markers (defined in `pytest.ini`):

```python
@pytest.mark.unit        # Fast, no external dependencies
@pytest.mark.integration # May require database/services
@pytest.mark.slow        # Long-running tests
@pytest.mark.api         # API endpoint tests
```

### Available Fixtures (from `conftest.py`)

| Fixture | Description |
|---------|-------------|
| `test_db` | Fresh SQLite in-memory database per test |
| `client` | FastAPI TestClient with database override |
| `client_no_db` | TestClient without database |
| `mock_mqtt_client` | Mocked MQTT client |
| `mock_influx_client` | Mocked InfluxDB client |
| `sample_robot_data` | Sample robot data dict |
| `sample_sensor_data` | Sample sensor data list |
| `sample_report_data` | Sample report data dict |
| `sample_job_data` | Sample job data dict |

### Example Backend Test

```python
"""
Tests for health check endpoints.

Run with: pytest tests/test_health.py -v
"""
import pytest
from fastapi.testclient import TestClient


class TestHealthEndpoints:
    """Tests for the health check API endpoints."""

    @pytest.mark.unit
    def test_health_check_returns_200(self, client: TestClient):
        """Test that health endpoint returns 200 OK."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200

    @pytest.mark.unit
    def test_health_check_response_format(self, client: TestClient):
        """Test that health endpoint returns expected format."""
        response = client.get("/api/v1/health")
        data = response.json()
        
        assert "status" in data
        assert data["status"] in ["healthy", "ok", "online"]
```

### Testing Database Operations

```python
from tests.conftest import create_test_report

class TestReportsAPI:
    @pytest.mark.api
    def test_get_reports_with_data(self, client: TestClient, test_db: Session):
        """Test getting reports when some exist."""
        # Create test data using helper function
        create_test_report(test_db, title="Report 1")
        create_test_report(test_db, title="Report 2")
        
        response = client.get("/api/v1/reports")
        assert response.status_code == 200
        assert len(response.json()) == 2
```

### Testing with Mocks

```python
from unittest.mock import MagicMock, patch

class TestRobotDataService:
    @pytest.mark.unit
    def test_get_robot_data_with_mock(self, mock_influx_client):
        """Test robot data retrieval with mocked InfluxDB."""
        mock_influx_client.query_data.return_value = [
            {"time": "2025-01-01T12:00:00Z", "cpu": 45.2}
        ]
        
        # Your test logic here
        result = mock_influx_client.query_data()
        assert len(result) == 1
```

---

## Frontend Testing (React/TypeScript)

### Prerequisites

```bash
cd frontend
npm install
```

Key testing dependencies:
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - Custom DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `msw` - API mocking (Mock Service Worker)

### Test Utilities

Custom render function with providers (`__tests__/utils/testUtils.tsx`):

```tsx
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

const AllProviders = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
);

const customRender = (ui, options) =>
  render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### Example Component Test

```tsx
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
  },
}));

const mockReports = [
  {
    id: 1,
    title: 'Performance Report',
    description: 'Daily performance summary',
    robot_id: 'test_robot_001',
  },
];

describe('Reports Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getReports as jest.Mock).mockResolvedValue(mockReports);
  });

  it('renders the reports page', async () => {
    render(<Reports />);
    
    await waitFor(() => {
      expect(screen.getByText(/Reports/i)).toBeInTheDocument();
    });
  });

  it('displays reports list after loading', async () => {
    render(<Reports />);
    
    await waitFor(() => {
      expect(screen.getByText('Performance Report')).toBeInTheDocument();
    });
  });

  it('calls generateReport when button clicked', async () => {
    const user = userEvent.setup();
    
    render(<Reports />);
    
    const generateButton = await screen.findByRole('button', { 
      name: /Generate Report/i 
    });
    await user.click(generateButton);
    
    expect(apiService.generateReport).toHaveBeenCalled();
  });
});
```

### Testing Utility Functions

```tsx
/**
 * Tests for API error handling.
 */
import { handleApiError } from '../../utils/api';
import axios from 'axios';

jest.mock('axios');

describe('handleApiError', () => {
  it('returns detail message from response', () => {
    const error = {
      response: {
        data: { detail: 'Custom error message' },
        status: 400,
      },
    };
    (axios.isAxiosError as jest.Mock).mockReturnValue(true);
    
    expect(handleApiError(error)).toBe('Custom error message');
  });

  it('returns "Resource not found" for 404 errors', () => {
    const error = {
      response: { status: 404, data: {} },
    };
    (axios.isAxiosError as jest.Mock).mockReturnValue(true);
    
    expect(handleApiError(error)).toBe('Resource not found');
  });
});
```

---

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_health.py

# Run specific test class
pytest tests/test_health.py::TestHealthEndpoints

# Run specific test method
pytest tests/test_health.py::TestHealthEndpoints::test_health_check_returns_200

# Run tests by marker
pytest -m unit          # Only unit tests
pytest -m "not slow"    # Skip slow tests
pytest -m api           # Only API tests

# Run with coverage report
pytest --cov=. --cov-report=html

# Run with coverage and generate terminal report
pytest --cov=. --cov-report=term-missing
```

### Frontend Tests

```bash
cd frontend

# Run tests in watch mode (default)
npm test

# Run all tests once (CI mode)
npm run test:ci

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- Reports.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="renders"

# Update snapshots (if using)
npm test -- --updateSnapshot
```

---

## Writing New Tests

### Backend Test Template

```python
"""
Tests for [module name].

Run with: pytest tests/test_[module].py -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class Test[Feature]API:
    """Tests for [feature] API endpoints."""

    @pytest.mark.unit
    def test_[action]_[expected_result](self, client: TestClient):
        """Test that [action] returns [expected result]."""
        # Arrange
        # Set up test data
        
        # Act
        response = client.get("/api/v1/endpoint")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "expected_field" in data

    @pytest.mark.api
    def test_[action]_with_database(self, client: TestClient, test_db: Session):
        """Test [action] with database interaction."""
        # Arrange - create test data in DB
        
        # Act
        response = client.post("/api/v1/endpoint", json={"key": "value"})
        
        # Assert
        assert response.status_code == 200
```

### Frontend Test Template

```tsx
/**
 * Tests for [Component] component.
 * 
 * Run with: npm test -- [Component].test.tsx
 */
import { render, screen, waitFor } from '../utils/testUtils';
import userEvent from '@testing-library/user-event';
import [Component] from '../../components/[Component]';

// Mock dependencies
jest.mock('../../utils/api', () => ({
  apiService: {
    someMethod: jest.fn(),
  },
}));

describe('[Component]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<[Component] />);
    expect(screen.getByRole('...')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<[Component] />);
    
    await user.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByText('Expected text')).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    render(<[Component] />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    // Mock API error
    (apiService.someMethod as jest.Mock).mockRejectedValue(new Error('Error'));
    
    render(<[Component] />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

---

## Test Coverage

### Backend Coverage

```bash
cd backend

# Generate HTML coverage report
pytest --cov=. --cov-report=html

# View report
# Open htmlcov/index.html in browser
```

### Frontend Coverage

```bash
cd frontend

# Generate coverage report
npm run test:coverage

# Coverage thresholds (from package.json):
# - branches: 50%
# - functions: 50%
# - lines: 50%
# - statements: 50%
```

### Coverage Report Example

```
---------- coverage: platform win32, python 3.11.0 ----------
Name                          Stmts   Miss  Cover
-------------------------------------------------
main.py                          45      5    89%
routers/health.py                12      0   100%
routers/reports.py               78     12    85%
routers/robot_data.py            95     20    79%
-------------------------------------------------
TOTAL                           230     37    84%
```

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/tests.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run tests with coverage
        run: |
          cd backend
          pytest --cov=. --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run tests
        run: |
          cd frontend
          npm run test:ci
```

---

## Best Practices

### General Guidelines

1. **Test Naming Convention**
   - Backend: `test_[action]_[expected_result]`
   - Frontend: `it('[action] [expected result]')`

2. **Test Structure (AAA Pattern)**
   ```python
   def test_something(self):
       # Arrange - set up test data
       data = {"key": "value"}
       
       # Act - perform the action
       result = function_under_test(data)
       
       # Assert - verify the result
       assert result == expected_value
   ```

3. **Test Isolation**
   - Each test should be independent
   - Use fixtures for shared setup
   - Clean up after tests (handled by fixtures)

4. **Mock External Dependencies**
   - Database (use in-memory SQLite)
   - MQTT client
   - InfluxDB client
   - External APIs

5. **Test Edge Cases**
   - Empty inputs
   - Invalid inputs
   - Error conditions
   - Boundary values

### What to Test

| Test Type | What to Test |
|-----------|--------------|
| Unit | Individual functions, methods, components |
| Integration | API endpoints, database operations |
| Component | UI rendering, user interactions |

### What NOT to Test

- Third-party library internals
- Framework code
- Simple getters/setters
- Configuration files

---

## Quick Reference

### Backend Commands

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific marker
pytest -m unit

# Verbose output
pytest -v

# Stop on first failure
pytest -x
```

### Frontend Commands

```bash
# Interactive watch mode
npm test

# Single run (CI)
npm run test:ci

# With coverage
npm run test:coverage

# Specific file
npm test -- Component.test.tsx
```

---

## Test Results Documentation

When documenting test results, include:

1. **Test Run Date**: When tests were executed
2. **Environment**: OS, Python/Node version
3. **Test Summary**: Pass/Fail counts
4. **Coverage Report**: Overall coverage percentage
5. **Failed Tests**: List any failures with error messages

### Example Test Report

```
=========================== Test Session ===========================
Date: 2026-01-18
Environment: Windows 10, Python 3.11.0

Backend Tests:
  Total: 25
  Passed: 24
  Failed: 1
  Skipped: 0
  Coverage: 84%

Frontend Tests:
  Total: 18
  Passed: 18
  Failed: 0
  Coverage: 72%

Failed Tests:
  - test_reports.py::TestReportsAPI::test_create_report
    Error: AssertionError: expected 201, got 200
================================================================
```

---

## Troubleshooting

### Common Issues

1. **Database not found**
   - Ensure `TESTING=true` environment variable is set
   - Check `conftest.py` is in the tests directory

2. **Import errors**
   - Run tests from the correct directory
   - Verify `__init__.py` files exist

3. **Async test failures**
   - Use `pytest-asyncio` plugin
   - Add `@pytest.mark.asyncio` decorator

4. **React Testing Library warnings**
   - Wrap state updates in `act()`
   - Use `waitFor()` for async operations

---

*Last Updated: January 2026*
