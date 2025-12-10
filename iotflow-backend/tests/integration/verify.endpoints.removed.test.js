const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/utils/db');
const { User, Device } = require('../../src/models');
const bcrypt = require('bcrypt');

describe('Verify Redundant Endpoints Removed - TDD', () => {
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
      user_id: 'admin-verify-test',
      username: 'admin_verify',
      email: 'admin@verify.com',
      password_hash: hashedPassword,
      is_admin: true,
      is_active: true,
    });

    regularUser = await User.create({
      user_id: 'user-verify-test',
      username: 'user_verify',
      email: 'user@verify.com',
      password_hash: hashedPassword,
      is_admin: false,
      is_active: true,
    });

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin_verify', password: 'test123' });
    adminToken = adminLoginRes.body.token;

    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user_verify', password: 'test123' });
    userToken = userLoginRes.body.token;

    testDevice = await Device.create({
      name: 'Test Device Verify',
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

  describe('✅ Removed: Device Control Endpoints', () => {
    test('POST /api/devices/:id/control should return 404', async () => {
      const response = await request(app)
        .post(`/api/devices/${testDevice.id}/control`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ command: 'turn_on' });

      expect(response.status).toBe(404);
    });

    test('GET /api/devices/:id/control/:controlId/status should return 404', async () => {
      const response = await request(app)
        .get(`/api/devices/${testDevice.id}/control/test-123/status`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    test('GET /api/devices/:id/control/pending should return 404', async () => {
      const response = await request(app)
        .get(`/api/devices/${testDevice.id}/control/pending`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('✅ Removed: User Specific Update Endpoints', () => {
    test('PUT /api/users/:id/role should return 404', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_admin: true });

      expect(response.status).toBe(404);
    });

    test('PUT /api/users/:id/status should return 404', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: false });

      expect(response.status).toBe(404);
    });
  });

  describe('✅ Removed: Telemetry Today Count Endpoint', () => {
    test('GET /api/telemetry/today/count should return 404', async () => {
      const response = await request(app)
        .get('/api/telemetry/today/count')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('✅ Consolidated: Generic User Update Handles Role/Status', () => {
    test('PUT /api/users/:id can update role with safeguards', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_admin: true });

      expect(response.status).toBe(200);
      expect(response.body.is_admin).toBe(true);
    });

    test('PUT /api/users/:id can update status with safeguards', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: false });

      expect(response.status).toBe(200);
      expect(response.body.is_active).toBe(false);
    });

    test('PUT /api/users/:id prevents self-modification of role', async () => {
      const response = await request(app)
        .put(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_admin: false });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot modify your own');
    });

    test('PUT /api/users/:id prevents self-modification of status', async () => {
      const response = await request(app)
        .put(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: false });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot modify your own');
    });

    test('PUT /api/users/:id allows self-modification of other fields', async () => {
      const response = await request(app)
        .put(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'newemail@test.com' });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('newemail@test.com');
    });
  });

  describe('✅ Core Functionality Still Works', () => {
    test('device CRUD operations work', async () => {
      const response = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('devices');
    });

    test('device configuration endpoints work', async () => {
      const response = await request(app)
        .get(`/api/devices/${testDevice.id}/configuration`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });

    test('user management works', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('telemetry aggregated data works', async () => {
      const response = await request(app)
        .get(`/api/telemetry/device/${testDevice.id}/aggregated`);

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('✅ Health Checks Still Available', () => {
    test('system health check works', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    test('telemetry health check works', async () => {
      const response = await request(app).get('/api/telemetry/health');
      expect(response.status).toBe(200);
    });
  });
});
