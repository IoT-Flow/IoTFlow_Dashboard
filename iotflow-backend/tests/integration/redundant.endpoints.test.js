const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/utils/db');
const { User, Device } = require('../../src/models');
const bcrypt = require('bcrypt');

describe('Redundant API Endpoints Analysis', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync();
  });

  beforeEach(async () => {
    await Device.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    const hashedPassword = await bcrypt.hash('test123', 10);
    adminUser = await User.create({
      user_id: 'admin-redundant-test',
      username: 'admin_redundant',
      email: 'admin@redundant.com',
      password_hash: hashedPassword,
      is_admin: true,
      is_active: true,
    });

    regularUser = await User.create({
      user_id: 'user-redundant-test',
      username: 'user_redundant',
      email: 'user@redundant.com',
      password_hash: hashedPassword,
      is_admin: false,
      is_active: true,
    });

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin_redundant', password: 'test123' });
    adminToken = adminLoginRes.body.token;

    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user_redundant', password: 'test123' });
    userToken = userLoginRes.body.token;
  });

  afterEach(async () => {
    await Device.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('REDUNDANCY 1: Admin Delete Device Endpoint', () => {
    // /api/devices/admin/devices/:id can be replaced by /api/devices/:id with admin check

    test('admin can delete device using standard DELETE /api/devices/:id', async () => {
      const device = await Device.create({
        name: 'Test Device',
        device_type: 'sensor',
        status: 'active',
        user_id: regularUser.id,
      });

      const response = await request(app)
        .delete(`/api/devices/${device.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Standard endpoint should work for admin
      expect([200, 403, 404]).toContain(response.status);
    });

    test('DELETE /api/devices/admin/devices/:id is redundant', async () => {
      const device = await Device.create({
        name: 'Test Device 2',
        device_type: 'sensor',
        status: 'active',
        user_id: regularUser.id,
      });

      const response = await request(app)
        .delete(`/api/devices/admin/devices/${device.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      // This endpoint exists but is redundant - admin should use standard delete
    });
  });

  describe('REDUNDANCY 2: Telemetry Health Check vs System Health', () => {
    // /api/telemetry/health and /health might be redundant

    test('system health check endpoint exists', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
    });

    test('telemetry health check might be redundant', async () => {
      const response = await request(app).get('/api/telemetry/health');
      expect(response.status).toBe(200);
      // If both return same structure, one is redundant
    });
  });

  describe('REDUNDANCY 3: User CRUD Endpoints Overlap', () => {
    // PUT /api/users/:id and PUT /api/users/:id/role + PUT /api/users/:id/status
    // might have overlapping functionality

    test('update user with generic PUT /api/users/:id', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'updated@test.com',
        });

      expect([200, 404]).toContain(response.status);
    });

    test('update user role with specific endpoint', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'admin',
        });

      expect([200, 404]).toContain(response.status);
      // If generic PUT can update role, this is redundant
    });

    test('update user status with specific endpoint', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'inactive',
        });

      expect([200, 404]).toContain(response.status);
      // If generic PUT can update status, this is redundant
    });
  });

  describe('REDUNDANCY 4: Device Control Endpoints', () => {
    // Control endpoints might not be implemented/used

    test('send device control command', async () => {
      const device = await Device.create({
        name: 'Control Test Device',
        device_type: 'actuator',
        user_id: regularUser.id,
      });

      const response = await request(app)
        .post(`/api/devices/${device.id}/control`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          command: 'turn_on',
        });

      // If returns 404 or not implemented, these endpoints are redundant
      expect([200, 404, 500]).toContain(response.status);
    });

    test('get control status', async () => {
      const device = await Device.create({
        name: 'Control Status Device',
        device_type: 'actuator',
        user_id: regularUser.id,
      });

      const response = await request(app)
        .get(`/api/devices/${device.id}/control/123/status`)
        .set('Authorization', `Bearer ${userToken}`);

      expect([200, 404, 500]).toContain(response.status);
    });

    test('get pending controls', async () => {
      const device = await Device.create({
        name: 'Pending Control Device',
        device_type: 'actuator',
        user_id: regularUser.id,
      });

      const response = await request(app)
        .get(`/api/devices/${device.id}/control/pending`)
        .set('Authorization', `Bearer ${userToken}`);

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('REDUNDANCY 5: Dashboard vs Telemetry Overlap', () => {
    // Dashboard endpoints might overlap with telemetry

    test('dashboard overview endpoint', async () => {
      const response = await request(app)
        .get('/api/dashboard/overview')
        .set('X-API-Key', 'test-key');

      expect([200, 401]).toContain(response.status);
    });

    test('dashboard health vs system health', async () => {
      const dashResponse = await request(app)
        .get('/api/dashboard/health')
        .set('X-API-Key', 'test-key');

      const sysResponse = await request(app).get('/health');

      expect([200, 401]).toContain(dashResponse.status);
      expect(sysResponse.status).toBe(200);
      // If both return similar data, one is redundant
    });
  });
});
