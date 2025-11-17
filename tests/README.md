# Tests

This directory contains automated tests for the Bubble Backend API.

## Structure

- `unit/` - Unit tests for individual functions and modules
- `integration/` - Integration tests for API endpoints
- `setup.js` - Test configuration and environment setup

## Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test tests/unit/helpers.test.js
```

## Test Coverage

Current test coverage:
- **20+ tests** covering core functionality
- Unit tests for utilities and helpers
- Integration tests for all major endpoints
- Security and validation tests
- Error handling tests

## Writing Tests

### Unit Tests
```javascript
const { myFunction } = require('../../utils/myModule');

describe('MyModule', () => {
  test('should do something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

### Integration Tests
```javascript
const request = require('supertest');
const app = require('../../app');

describe('My Endpoint', () => {
  test('should return 200', async () => {
    const res = await request(app).get('/api/v1/endpoint');
    expect(res.status).toBe(200);
  });
});
```

## Mocking

Tests use mock credentials defined in `setup.js`. No real API calls are made during testing.

## CI/CD

Tests are run automatically on:
- Git push
- Pull requests
- Pre-deployment checks
