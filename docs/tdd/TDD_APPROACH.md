# Test-Driven Development (TDD) Approach - Dashboard Backend

## Overview

This document outlines the Test-Driven Development approach for the IoTFlow Dashboard Backend (Node.js/Express backend). TDD ensures code quality, maintainability, and reliability through a test-first development methodology.

---

## TDD Philosophy

**Test-Driven Development Cycle:**
```
1. 🔴 RED   → Write a failing test
2. 🟢 GREEN → Write minimal code to pass
3. 🔵 REFACTOR → Improve code quality
4. ♻️  REPEAT → Continue the cycle
```

**Benefits:**
- Ensures code correctness before implementation
- Provides living documentation
- Facilitates refactoring with confidence
- Reduces debugging time
- Improves code design
- Catches regressions early

---

## Testing Stack

### Core Testing Tools

| Tool | Purpose | Version |
|------|---------|---------|
| **Jest** | Test framework | 30.0.4+ |
| **Supertest** | HTTP testing | 7.1.3+ |
| **@testing-library** | Component testing | Latest |
| **ws** | WebSocket testing | 8.14.2+ |
| **sequelize-test-helpers** | Database testing | Latest |

### Additional Tools

- **jest-mock-extended** - Advanced mocking
- **faker-js** - Test data generation
- **nock** - HTTP request mocking
- **socket.io-client** - WebSocket client testing
- **jest-when** - Conditional mocking

---

## Test Structure

### Directory Organization

```
iotflow-backend/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middlewares/
│   └── utils/
├── tests/
│   ├── setup.js                      # Test setup
│   ├── teardown.js                   # Test cleanup
│   ├── helpers/                      # Test helpers
│   │   ├── factories.js              # Test data factories
│   │   ├── fixtures.js               # Test fixtures
│   │   └── assertions.js             # Custom assertions
│   ├── unit/                         # Unit tests
│   │   ├── models/
│   │   │   ├── user.test.js
│   │   │   ├── device.test.js
│   │   │   └── notification.test.js
│   │   ├── services/
│   │   │   └── notificationService.test.js
│   │   ├── utils/
│   │   │   ├── db.test.js
│   │   │   └── iotdbClient.test.js
│   │   └── middlewares/
│   │       └── authMiddleware.test.js
│   ├── integration/                  # Integration tests
│   │   ├── api/
│   │   │   ├── auth.test.js
│   │   │   ├── devices.test.js
│   │   │   ├── telemetry.test.js
│   │   │   ├── dashboard.test.js
│   │   │   └── charts.test.js
│   │   ├── websocket/
│   │   │   └── notifications.test.js
│   │   └── database/
│   │       └── sequelize.test.js
│   ├── e2e/                         # End-to-end tests
│   │   ├── userJourney.test.js
│   │   ├── deviceLifecycle.test.js
│   │   └── dashboardFlow.test.js
│   └── performance/                  # Performance tests
│       ├── loadTest.js
│       └── stressTest.js
├── jest.config.js                    # Jest configuration
└── .eslintrc.js                      # ESLint configuration
```

---

## Test Categories

### 1. Unit Tests

**Purpose:** Test individual functions and methods in isolation

**Characteristics:**
- Fast execution (< 10ms per test)
- No external dependencies
- Use mocks for dependencies
- Test single responsibility

**Example Structure:**

```javascript
// tests/unit/models/user.test.js
const { User } = require('../../../src/models');
const bcrypt = require('bcrypt');

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a user with hashed password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10)
      };
      
      const user = await User.create(userData);
      
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.user_id).toBeDefined();
      expect(user.user_id).toHaveLength(32);
    });
    
    it('should generate unique user_id', async () => {
      const user1 = await User.create({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hash1'
      });
      
      const user2 = await User.create({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hash2'
      });
      
      expect(user1.user_id).not.toBe(user2.user_id);
    });
  });
  
  describe('User Validation', () => {
    it('should require username', async () => {
      await expect(
        User.create({
          email: 'test@example.com',
          password_hash: 'hash'
        })
      ).rejects.toThrow();
    });
    
    it('should require unique email', async () => {
      await User.create({
        username: 'user1',
        email: 'duplicate@example.com',
        password_hash: 'hash'
      });
      
      await expect(
        User.create({
          username: 'user2',
          email: 'duplicate@example.com',
          password_hash: 'hash'
        })
      ).rejects.toThrow();
    });
  });
});
```

### 2. Integration Tests

**Purpose:** Test interactions between components

**Characteristics:**
- Test API endpoints
- Use test database
- Test service integrations
- Verify data flow

**Example Structure:**
```javascript
// tests/integration/api/auth.test.js
const request = require('supertest');
const app = require('../../../src/app');
const { User } = require('../../../src/models');
const { sequelize } = require('../../../src/utils/db');

describe('Authentication API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.username).toBe('newuser');
      expect(response.body.user.email).toBe('newuser@example.com');
    });
    
    it('should return 409 for duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user1',
          email: 'duplicate@example.com',
          password: 'password123'
        });
      
      // Try to create second user with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user2',
          email: 'duplicate@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });
  });
  
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'loginuser',
          email: 'login@example.com',
          password: 'password123'
        });
    });
    
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('login@example.com');
    });
    
    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });
});
```

### 3. End-to-End Tests

**Purpose:** Test complete user workflows

**Example Structure:**
```javascript
// tests/e2e/deviceLifecycle.test.js
const request = require('supertest');
const app = require('../../src/app');
const WebSocket = require('ws');

describe('Device Lifecycle E2E', () => {
  let authToken;
  let userId;
  let deviceId;
  let wsClient;
  
  beforeAll(async () => {
    // Register and login user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'e2euser',
        email: 'e2e@example.com',
        password: 'password123'
      });
    
    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
    
    // Connect WebSocket
    wsClient = new WebSocket('ws://localhost:3001/ws');
    await new Promise(resolve => wsClient.on('open', resolve));
    
    // Authenticate WebSocket
    wsClient.send(JSON.stringify({
      type: 'auth',
      token: authToken
    }));
  });
  
  afterAll(async () => {
    wsClient.close();
  });
  
  it('should complete full device lifecycle', async () => {
    // 1. Create device
    const createResponse = await request(app)
      .post('/api/devices')
      .set('x-api-key', authToken)
      .send({
        name: 'E2E Test Device',
        device_type: 'sensor',
        location: 'Test Lab'
      });
    
    expect(createResponse.status).toBe(201);
    deviceId = createResponse.body.id;
    
    // 2. Get device details
    const getResponse = await request(app)
      .get(`/api/devices/${deviceId}`)
      .set('x-api-key', authToken);
    
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe('E2E Test Device');
    
    // 3. Submit telemetry
    const telemetryResponse = await request(app)
      .post('/api/telemetry')
      .set('x-api-key', authToken)
      .send({
        device_id: deviceId,
        data_type: 'temperature',
        value: 25.5,
        unit: '°C'
      });
    
    expect(telemetryResponse.status).toBe(201);
    
    // 4. Query telemetry
    const queryResponse = await request(app)
      .get(`/api/telemetry/device/${deviceId}`)
      .set('x-api-key', authToken);
    
    expect(queryResponse.status).toBe(200);
    expect(queryResponse.body.telemetry.length).toBeGreaterThan(0);
    
    // 5. Update device
    const updateResponse = await request(app)
      .put(`/api/devices/${deviceId}`)
      .set('x-api-key', authToken)
      .send({
        status: 'active',
        location: 'Updated Lab'
      });
    
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.location).toBe('Updated Lab');
    
    // 6. Delete device
    const deleteResponse = await request(app)
      .delete(`/api/devices/${deviceId}`)
      .set('x-api-key', authToken);
    
    expect(deleteResponse.status).toBe(200);
    
    // 7. Verify deletion
    const verifyResponse = await request(app)
      .get(`/api/devices/${deviceId}`)
      .set('x-api-key', authToken);
    
    expect(verifyResponse.status).toBe(404);
  });
});
```

---

## Test Fixtures and Factories

### Test Data Factories

```javascript
// tests/helpers/factories.js
const { User, Device, Notification } = require('../../src/models');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class TestFactory {
  static async createUser(overrides = {}) {
    const defaults = {
      username: `user_${Date.now()}`,
      email: `user_${Date.now()}@example.com`,
      password_hash: await bcrypt.hash('password123', 10),
      is_active: true,
      is_admin: false
    };
    
    return await User.create({ ...defaults, ...overrides });
  }
  
  static async createDevice(userId, overrides = {}) {
    const defaults = {
      name: `Device_${Date.now()}`,
      device_type: 'sensor',
      status: 'offline',
      user_id: userId
    };
    
    return await Device.create({ ...defaults, ...overrides });
  }
  
  static async createNotification(userId, deviceId = null, overrides = {}) {
    const defaults = {
      user_id: userId,
      device_id: deviceId,
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification',
      source: 'test',
      is_read: false
    };
    
    return await Notification.create({ ...defaults, ...overrides });
  }
  
  static generateJWT(userId, email) {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  }
}

module.exports = TestFactory;
```

### Using Factories in Tests

```javascript
// tests/integration/api/devices.test.js
const TestFactory = require('../../helpers/factories');

describe('Device API', () => {
  let user;
  let authToken;
  
  beforeEach(async () => {
    user = await TestFactory.createUser();
    authToken = TestFactory.generateJWT(user.id, user.email);
  });
  
  it('should create device for authenticated user', async () => {
    const response = await request(app)
      .post('/api/devices')
      .set('x-api-key', authToken)
      .send({
        name: 'Test Device',
        device_type: 'sensor'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.user_id).toBe(user.id);
  });
});
```

---

## TDD Workflow Examples

### Example 1: Adding Chart Builder Feature

#### Step 1: Write Failing Test (RED 🔴)

```javascript
// tests/unit/controllers/chartController.test.js
const chartController = require('../../../src/controllers/chartController');

describe('Chart Controller', () => {
  describe('createChart', () => {
    it('should create a new chart', async () => {
      const req = {
        user: { id: 1 },
        body: {
          name: 'Temperature Chart',
          chart_type: 'line',
          configuration: {
            devices: [1, 2],
            data_type: 'temperature'
          }
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      await chartController.createChart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Temperature Chart',
          chart_type: 'line'
        })
      );
    });
  });
});
```

**Run test:** `npm test`
**Result:** ❌ FAIL - Method doesn't exist

#### Step 2: Write Minimal Code (GREEN 🟢)

```javascript
// src/controllers/chartController.js
const { Chart } = require('../models');

class ChartController {
  async createChart(req, res) {
    try {
      const { name, chart_type, configuration } = req.body;
      
      const chart = await Chart.create({
        user_id: req.user.id,
        name,
        chart_type,
        configuration: JSON.stringify(configuration)
      });
      
      res.status(201).json(chart);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create chart' });
    }
  }
}

module.exports = new ChartController();
```

**Run test:** `npm test`
**Result:** ✅ PASS

#### Step 3: Refactor (REFACTOR 🔵)

```javascript
// src/controllers/chartController.js
const { Chart } = require('../models');
const { validateChartConfig } = require('../utils/validators');

class ChartController {
  /**
   * Create a new chart
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createChart(req, res) {
    try {
      const { name, chart_type, configuration, description } = req.body;
      
      // Validate configuration
      const validation = validateChartConfig(configuration);
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Invalid chart configuration',
          errors: validation.errors
        });
      }
      
      // Create chart
      const chart = await Chart.create({
        user_id: req.user.id,
        name: name.trim(),
        chart_type,
        description: description?.trim(),
        configuration: JSON.stringify(configuration),
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Send notification
      await notificationService.notifyChartCreated(req.user.id, chart);
      
      res.status(201).json({
        id: chart.id,
        name: chart.name,
        chart_type: chart.chart_type,
        configuration: JSON.parse(chart.configuration),
        created_at: chart.created_at
      });
    } catch (error) {
      console.error('Chart creation error:', error);
      res.status(500).json({
        message: 'Failed to create chart',
        error: error.message
      });
    }
  }
}

module.exports = new ChartController();
```

**Add more tests:**
```javascript
describe('Chart Controller', () => {
  describe('createChart', () => {
    it('should validate chart configuration', async () => {
      const req = {
        user: { id: 1 },
        body: {
          name: 'Invalid Chart',
          chart_type: 'line',
          configuration: {
            devices: []  // Empty devices array
          }
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      await chartController.createChart(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid chart configuration'
        })
      );
    });
  });
});
```

---

## WebSocket Testing

### Testing WebSocket Notifications

```javascript
// tests/integration/websocket/notifications.test.js
const WebSocket = require('ws');
const http = require('http');
const app = require('../../../src/app');
const TestFactory = require('../../helpers/factories');

describe('WebSocket Notifications', () => {
  let server;
  let wss;
  let client;
  let user;
  let authToken;
  
  beforeAll(async () => {
    // Create HTTP server
    server = http.createServer(app);
    
    // Create WebSocket server
    wss = new WebSocket.Server({ server, path: '/ws' });
    
    // Start server
    await new Promise(resolve => {
      server.listen(0, resolve);
    });
    
    // Create test user
    user = await TestFactory.createUser();
    authToken = TestFactory.generateJWT(user.id, user.email);
  });
  
  afterAll(async () => {
    await new Promise(resolve => {
      server.close(resolve);
    });
  });
  
  beforeEach(async () => {
    const port = server.address().port;
    client = new WebSocket(`ws://localhost:${port}/ws`);
    
    await new Promise(resolve => {
      client.on('open', resolve);
    });
  });
  
  afterEach(() => {
    if (client.readyState === WebSocket.OPEN) {
      client.close();
    }
  });
  
  it('should authenticate WebSocket connection', async () => {
    const authPromise = new Promise(resolve => {
      client.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'auth_success') {
          resolve(message);
        }
      });
    });
    
    // Send auth message
    client.send(JSON.stringify({
      type: 'auth',
      token: authToken
    }));
    
    const response = await authPromise;
    expect(response.type).toBe('auth_success');
  });
  
  it('should receive notification via WebSocket', async () => {
    // Authenticate first
    client.send(JSON.stringify({
      type: 'auth',
      token: authToken
    }));
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Listen for notification
    const notificationPromise = new Promise(resolve => {
      client.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'notification') {
          resolve(message);
        }
      });
    });
    
    // Trigger notification
    await TestFactory.createNotification(user.id, null, {
      title: 'Test Notification',
      message: 'WebSocket test message'
    });
    
    const notification = await notificationPromise;
    expect(notification.data.title).toBe('Test Notification');
  });
});
```

---

## Mocking External Dependencies

### Mocking IoTDB Client

```javascript
// tests/unit/utils/iotdbClient.test.js
jest.mock('iotdb-client-nodejs');

const iotdbClient = require('../../../src/utils/iotdbClient');
const { Session } = require('iotdb-client-nodejs');

describe('IoTDB Client', () => {
  let mockSession;
  
  beforeEach(() => {
    mockSession = {
      open: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(true),
      insertRecord: jest.fn().mockResolvedValue(true),
      executeQueryStatement: jest.fn().mockResolvedValue({
        hasNext: jest.fn().mockReturnValue(false)
      })
    };
    
    Session.mockImplementation(() => mockSession);
  });
  
  it('should insert telemetry record', async () => {
    const devicePath = 'root.iotflow.users.user_1.devices.device_1';
    const data = { temperature: 25.5 };
    const timestamp = Date.now();
    
    await iotdbClient.insertRecord(devicePath, data, timestamp);
    
    expect(mockSession.insertRecord).toHaveBeenCalledWith(
      devicePath,
      timestamp,
      ['temperature'],
      [25.5],
      expect.any(Array)
    );
  });
  
  it('should handle connection errors', async () => {
    mockSession.open.mockRejectedValue(new Error('Connection failed'));
    
    await expect(
      iotdbClient.testConnection()
    ).rejects.toThrow('Connection failed');
  });
});
```

---

## Test Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85
    }
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  globalTeardown: '<rootDir>/tests/teardown.js',
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
```

### Test Setup

```javascript
// tests/setup.js
const { sequelize } = require('../src/utils/db');

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  
  // Sync database
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
});

// Global test utilities
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/models/user.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should create"

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run only changed tests
npm test -- --onlyChanged

# Run with verbose output
npm test -- --verbose

# Run specific test suite
npm test -- --testPathPattern=integration
```

### Test Scripts in package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: iotflow_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm run test:ci
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/iotflow_test
          JWT_SECRET: test-secret-key
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Best Practices

### 1. Test Naming

```javascript
// ✅ GOOD: Descriptive test names
describe('User Authentication', () => {
  it('should return 201 when registering with valid data', () => {});
  it('should return 409 when email already exists', () => {});
  it('should hash password before storing', () => {});
});

// ❌ BAD: Vague test names
describe('User', () => {
  it('works', () => {});
  it('test registration', () => {});
});
```

### 2. Arrange-Act-Assert Pattern

```javascript
it('should update device status', async () => {
  // Arrange
  const user = await TestFactory.createUser();
  const device = await TestFactory.createDevice(user.id);
  const authToken = TestFactory.generateJWT(user.id, user.email);
  
  // Act
  const response = await request(app)
    .put(`/api/devices/${device.id}`)
    .set('x-api-key', authToken)
    .send({ status: 'active' });
  
  // Assert
  expect(response.status).toBe(200);
  expect(response.body.status).toBe('active');
});
```

### 3. Test Independence

```javascript
// ✅ GOOD: Each test is independent
describe('Device API', () => {
  let user;
  let authToken;
  
  beforeEach(async () => {
    user = await TestFactory.createUser();
    authToken = TestFactory.generateJWT(user.id, user.email);
  });
  
  it('should create device', async () => {
    const response = await request(app)
      .post('/api/devices')
      .set('x-api-key', authToken)
      .send({ name: 'Device 1', device_type: 'sensor' });
    
    expect(response.status).toBe(201);
  });
  
  it('should list devices', async () => {
    await TestFactory.createDevice(user.id);
    
    const response = await request(app)
      .get('/api/devices')
      .set('x-api-key', authToken);
    
    expect(response.status).toBe(200);
  });
});
```

---

## Test Coverage Goals

### Coverage Targets

| Component | Target Coverage | Priority |
|-----------|----------------|----------|
| **Models** | 95%+ | Critical |
| **Controllers** | 90%+ | Critical |
| **Services** | 90%+ | High |
| **Routes** | 85%+ | High |
| **Middlewares** | 90%+ | High |
| **Utils** | 80%+ | Medium |
| **Overall** | 85%+ | - |

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

---

## Next Steps

### Implementing TDD

1. **Start Small** - Begin with unit tests for new features
2. **Add Integration Tests** - Test API endpoints
3. **Build E2E Suite** - Cover critical user journeys
4. **Measure Coverage** - Aim for 85%+ coverage
5. **Automate** - Set up CI/CD pipeline
6. **Maintain** - Keep tests updated with code changes

### Resources

- **Jest Documentation**: https://jestjs.io/
- **Supertest Guide**: https://github.com/visionmedia/supertest
- **Testing Best Practices**: https://testingjavascript.com/
- **Node.js Testing**: https://nodejs.org/en/docs/guides/testing/

---

**Document Version:** 1.0  
**Last Updated:** December 8, 2025  
**Dashboard Backend Version:** 2.0.0
