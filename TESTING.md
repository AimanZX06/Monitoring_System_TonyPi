# TonyPi Monitoring System - Testing Guide

This document describes the testing infrastructure and how to run tests for both the backend and frontend.

## Quick Start

### Backend Tests
```bash
cd backend
pip install -r requirements.txt  # Install test dependencies
pytest                           # Run all tests
pytest -v                        # Verbose output
pytest --cov                     # With coverage report
```

### Frontend Tests
```bash
cd frontend
npm install                      # Install test dependencies
npm test                         # Run tests in watch mode
npm run test:ci                  # Run tests once (CI mode)
npm run test:coverage            # Run with coverage report
```

---

## Backend Testing

### Test Framework
- **pytest** - Test framework
- **pytest-cov** - Coverage reporting
- **pytest-asyncio** - Async test support
- **pytest-mock** - Mocking utilities
- **factory-boy** - Test data factories

### Directory Structure
```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Shared fixtures
│   ├── test_health.py       # Health endpoint tests
│   ├── test_reports.py      # Reports API tests
│   └── test_robot_data.py   # Robot data API tests
└── pytest.ini               # Pytest configuration
```

### Running Tests

```bash
# All tests
pytest

# Specific test file
pytest tests/test_reports.py

# Specific test class
pytest tests/test_reports.py::TestReportsAPI

# Specific test
pytest tests/test_reports.py::TestReportsAPI::test_create_report

# With coverage
pytest --cov=. --cov-report=html

# Only unit tests (fast)
pytest -m unit

# Only API tests
pytest -m api

# Skip slow tests
pytest -m "not slow"

# Verbose with short traceback
pytest -v --tb=short
```

### Test Markers

| Marker | Description |
|--------|-------------|
| `@pytest.mark.unit` | Fast unit tests |
| `@pytest.mark.api` | API endpoint tests |
| `@pytest.mark.integration` | Integration tests |
| `@pytest.mark.slow` | Slow tests |

### Writing New Tests

```python
# tests/test_example.py
import pytest
from fastapi.testclient import TestClient

class TestExample:
    @pytest.mark.unit
    def test_something(self, client: TestClient):
        """Test description."""
        response = client.get("/api/v1/endpoint")
        assert response.status_code == 200
        
    @pytest.mark.api
    def test_with_database(self, client: TestClient, test_db):
        """Test that needs database."""
        # test_db is a fresh SQLite database for each test
        pass
```

### Available Fixtures

| Fixture | Description |
|---------|-------------|
| `test_db` | Fresh test database (SQLite in-memory) |
| `client` | FastAPI TestClient with DB override |
| `client_no_db` | TestClient without DB override |
| `mock_mqtt_client` | Mocked MQTT client |
| `mock_influx_client` | Mocked InfluxDB client |
| `sample_robot_data` | Sample robot data dict |
| `sample_sensor_data` | Sample sensor data list |
| `sample_report_data` | Sample report data dict |

---

## Frontend Testing

### Test Framework
- **Jest** - Test framework (via react-scripts)
- **React Testing Library** - Component testing
- **MSW (Mock Service Worker)** - API mocking
- **user-event** - User interaction simulation

### Directory Structure
```
frontend/src/
├── __tests__/
│   ├── components/
│   │   └── Toast.test.tsx
│   ├── pages/
│   │   └── Reports.test.tsx
│   ├── utils/
│   │   ├── api.test.ts
│   │   ├── config.test.ts
│   │   └── testUtils.tsx     # Custom render & utilities
│   └── mocks/
│       ├── handlers.ts       # MSW API handlers
│       └── server.ts         # MSW server setup
└── setupTests.ts             # Jest setup
```

### Running Tests

```bash
# Interactive watch mode
npm test

# Run once (CI mode)
npm run test:ci

# With coverage
npm run test:coverage

# Specific file
npm test -- Reports.test.tsx

# Update snapshots
npm test -- -u
```

### Writing New Tests

```tsx
// __tests__/pages/MyComponent.test.tsx
import { render, screen, waitFor } from '../utils/testUtils';
import userEvent from '@testing-library/user-event';
import MyComponent from '../../pages/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', async () => {
    render(<MyComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
```

### Custom Render Function

Always use the custom render from `testUtils.tsx` to include all providers:

```tsx
import { render, screen } from '../utils/testUtils';

// This wraps your component with NotificationProvider and other contexts
render(<MyComponent />);
```

### Mock Data Factories

```tsx
import { 
  createMockRobot, 
  createMockReport, 
  createMockSensorData 
} from '../utils/testUtils';

const robot = createMockRobot({ status: 'offline' });
const report = createMockReport({ title: 'Custom Title' });
```

### Mocking API Calls

```tsx
import { apiService } from '../../utils/api';

jest.mock('../../utils/api', () => ({
  apiService: {
    getReports: jest.fn(),
    // ... other methods
  },
  handleApiError: jest.fn(),
}));

beforeEach(() => {
  (apiService.getReports as jest.Mock).mockResolvedValue([/* mock data */]);
});
```

---

## Coverage Goals

| Metric | Target |
|--------|--------|
| Statements | 50% |
| Branches | 50% |
| Functions | 50% |
| Lines | 50% |

Current setup has minimal tests as templates. Increase coverage as you add more tests.

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          pytest --cov --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
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

### Do's
- ✅ Write tests for new features
- ✅ Use descriptive test names
- ✅ Test edge cases and error handling
- ✅ Use fixtures and factories for test data
- ✅ Mock external services (API, database)
- ✅ Keep tests isolated and independent

### Don'ts
- ❌ Don't test implementation details
- ❌ Don't share state between tests
- ❌ Don't use real databases in unit tests
- ❌ Don't make tests dependent on order
- ❌ Don't test third-party libraries

---

## Troubleshooting

### Backend
```bash
# Clear pytest cache
pytest --cache-clear

# Show print statements
pytest -s

# Debug specific test
pytest tests/test_example.py::test_function -v --pdb
```

### Frontend
```bash
# Clear Jest cache
npm test -- --clearCache

# Debug mode
npm test -- --debug

# See console.log output
npm test -- --verbose
```

---

## Next Steps

1. Run existing tests to verify setup works
2. Add tests for new features you implement
3. Gradually increase coverage to 80%+
4. Set up CI/CD pipeline to run tests automatically
