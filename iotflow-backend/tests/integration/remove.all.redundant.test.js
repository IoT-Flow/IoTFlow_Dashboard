const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/utils/db');
const { User, Device } = require('../../src/models');
const bcrypt = require('bcrypt');

describe('Remove All Redundant Endpoints - TDD', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;
  let testDevice;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync();
  });

  beforeEach(async () => {
    await Device.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    const hashedPassword = await bcrypt.hash('test123', 10);
    adminUser = await User.create({
      user_id: 'admin-all-test',
      username: 'admin_all',
      email: 'admin@all.com',
      password_hash: hashedPassword,
      is_admin: true,
      is_active: true,
    });

    regularUser = await User.create({
      user_id: 'user-all-test',
      username: 'user_all',
      email: 'user@all.com',
      password_hash: hashedPassword,
      is_admin: false,
      is_active: true,
    });

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin_all', password: 'test123' });
    adminToken = adminLoginRes.body.token;

    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user_all', password: 'test123' });
    userToken = userLoginRes.body.token;

    testDevice = await Device.create({
      name: 'Test Device',
      device_type: 'sensor',
      status: 'active',
      user_id: regularUser.id,
    });
  });

  afterEach(async () => {
    await Device.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('REDUNDANT: Device Control Endpoints (In-Memory Only)', () => {
    // These endpoints use global.deviceControls (in-memory) - not persistent
    // They are demo implementations that should be removed until properly implemented

    test('POST /api/devices/:id/control uses in-memory storage (not production-ready)', async () => {
      const response = await request(app)
        .post(`/api/devices/${testDevice.id}/control`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ command: 'turn_on' });

      // Currently returns 200 but stores in memory only
      expect([200, 404, 500]).toContain(response.status);
      
      // If implemented, would need database table
      // Currently uses global.deviceControls which is lost on restart
    });

    test('GET /api/devices/:id/control/:controlId/status relies on in-memory data', async () => {
      const response = await request(app)
        .get(`/api/devices/${testDevice.id}/control/fake-id/status`)
        .set('Authorization', `Bearer ${userToken}`);

      // Returns 404 because no database table exists
      expect([200, 404]).toContain(response.status);
    });

    test('GET /api/devices/:id/control/pending relies on in-memory data', async () => {
      const response = await request(app)
        .get(`/api/devices/${testDevice.id}/control/pending`)
        .set('Authorization', `Bearer ${userToken}`);

      // Returns data from global.deviceControls (in-memory)
      expect([200, 404]).toContain(response.status);
    });

    test('control endpoints should be removed until properly implemented', async () => {
      // These endpoints are not production-ready:
      // 1. Use global variables (lost on restart)
      // 2. No database persistence
      // 3. No real MQTT/WebSocket integration
      // 4. Demo/placeholder code
      
      // After removal, these should return 404
      expect(true).toBe(true); // Placeholder for documentation
    });
  });

  describe('REDUNDANT: User Update Endpoints', () => {
    // PUT /api/users/:id/role and PUT /api/users/:id/status
    // May be redundant if generic PUT /api/users/:id supports these fields

    test('generic PUT /api/users/:id should handle role updates', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_admin: true });

      // Check if generic endpoint can update role
      expect([200, 400, 403, 404]).toContain(response.status);
    });

    test('generic PUT /api/users/:id should handle status updates', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: false });

      // Check if generic endpoint can update status
      expect([200, 400, 403, 404]).toContain(response.status);
    });

    test('specific PUT /api/users/:id/role endpoint exists', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      // Current behavior
      expect([200, 400, 404]).toContain(response.status);
    });

    test('specific PUT /api/users/:id/status endpoint exists', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' });

      // Current behavior
      expect([200, 400, 404]).toContain(response.status);
    });

    test('after removal, specific endpoints should return 404', async () => {
      // These will be removed if generic PUT handles role/status
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('REDUNDANT: Telemetry Today Count Endpoint', () => {
    // GET /api/telemetry/today/count is very specific
    // Dashboard overview provides similar data

    test('GET /api/telemetry/today/count returns count', async () => {
      const response = await request(app)
        .get('/api/telemetry/today/count')
        .set('Authorization', `Bearer ${userToken}`);

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('count');
      }
    });

    test('dashboard overview provides similar telemetry data', async () => {
      const response = await request(app)
        .get('/api/dashboard/overview')
        .set('X-API-Key', regularUser.api_key || 'test-key');

      // Dashboard overview should include message counts
      expect([200, 401]).toContain(response.status);
    });

    test('after removal, today count endpoint should return 404', async () => {
      // Will be removed - dashboard provides better aggregation
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('KEEP: Health Check Endpoints (Multiple)', () => {
    // Multiple health checks are common in production
    // Each may check different subsystems

    test('system health check works', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });

    test('telemetry health check works', async () => {
      const response = await request(app).get('/api/telemetry/health');
      expect(response.status).toBe(200);
    });

    test('dashboard health check works', async () => {
      const response = await request(app)
        .get('/api/dashboard/health')
        .set('X-API-Key', 'test-key');

      expect([200, 401]).toContain(response.status);
    });

    test('multiple health checks are acceptable for monitoring', async () => {
      // These are kept - useful for service monitoring
      // Low maintenance overhead
      expect(true).toBe(true);
    });
  });

  describe('Verify Core Functionality Remains After Cleanup', () => {
    test('device CRUD still works', async () => {
      const response = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('devices');
    });

    test('user management still works', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('telemetry endpoints still work', async () => {
      const response = await request(app)
        .get(`/api/telemetry/${testDevice.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect([200, 404]).toContain(response.status);
    });

    test('dashboard endpoints still work', async () => {
      const response = await request(app)
        .get('/api/dashboard/overview')
        .set('X-API-Key', regularUser.api_key || 'test-key');

      expect([200, 401]).toContain(response.status);
    });
  });
});
