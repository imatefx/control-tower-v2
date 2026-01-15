# Control Tower Backend E2E Tests

## Overview

This directory contains end-to-end tests for the Control Tower Backend API. The tests verify all major API endpoints including authentication, CRUD operations for all resources, and dashboard metrics.

## Running Tests

### Prerequisites

1. Ensure the backend server is running:
   ```bash
   npm run dev
   ```

2. Make sure the database is properly configured and seeded.

### Run Tests

```bash
# From the backend directory
npm test

# Or directly
node tests/e2e.test.js
```

### Configuration

You can configure the tests using environment variables or command-line arguments:

```bash
# Custom base URL
node tests/e2e.test.js --base-url=http://localhost:3000

# Custom admin credentials (for authentication tests)
TEST_ADMIN_EMAIL=admin@example.com TEST_ADMIN_PASSWORD=admin123 npm test
```

## Test Suites

The E2E tests cover the following areas:

| Suite | Description |
|-------|-------------|
| Authentication | Login, token verification, protected routes |
| Products | CRUD operations for products |
| Clients | CRUD operations for clients |
| Deployments | CRUD operations, status updates, blocked comments |
| Users | CRUD operations, role updates |
| Release Notes | CRUD operations |
| Dashboard | Metrics, reports, status breakdown |
| Checklists | Deployment checklists and progress |

## Test Output

The test script provides colored output showing:
- ✓ Passed tests (green)
- ✗ Failed tests (red)
- ○ Skipped tests (yellow)

At the end, a summary shows:
- Total passed/failed/skipped counts
- Total duration
- List of failed tests with error messages

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

## Cleanup

The test script automatically cleans up any test data it creates (products, clients, deployments, users, release notes) at the end of the test run.
