const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/utils/db');
const { User, Device } = require('../../src/models');
const bcrypt = require('bcrypt');

describe('Admin V1 API - TDD Implementation', () => {
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
      user_id: 'admin-v1-test',
      username: 'admin_v1',
      email: 'admin@v1.com',
      password_hash: hashedPassword,
      is_admin: true,
      is_active: true,
    });

    regularUser = await User.create({
      user_id: 'user-v1-test',
      username: 'user_v1',
      email: 'user@v1.com',
      password_hash: hashedPassword,
      is_admin: false,
      is_active: true,
    });

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin_v1', password: 'test123' });
    adminToken = adminLoginRes.body.token;

    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user_v1', password: 'test123' });
    userToken = userLoginRes.body.token;

    testDevice = await Device.create({
      name: 'Test Device V1',
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

  describe('Authentication & Authorization', () => {
    test('should reject requests without token', async () => {
      const response = await request(app).get('/api/v1/admin/users');
      expect(response.status).toBe(401);
    });

    test('should reject non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/admin/i);
    });

    test('should accept admin users', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/v1/admin/users - Get All Users', () => {
    test('should return all users with proper fields', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      const user = response.body[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('is_admin');
      expect(user).toHaveProperty('is_active');
      expect(user).not.toHaveProperty('password_hash');
    });

    test('should support pagination', async () => {
      // Create more users
      for (let i = 0; i < 5; i++) {
        await User.create({
          user_id: `user-${i}`,
          username: `user${i}`,
          email: `user${i}@test.com`,
          password_hash: await bcrypt.hash('test', 10),
          is_admin: false,
          is_active: true,
        });
      }

      const response = await request(app)
        .get('/api/v1/admin/users?page=1&limit=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeLessThanOrEqual(3);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
    });

    test('should support filtering by is_active', async () => {
      await User.create({
        user_id: 'inactive-user',
        username: 'inactive',
        email: 'inactive@test.com',
        password_hash: await bcrypt.hash('test', 10),
        is_admin: false,
        is_active: false,
      });

      const response = await request(app)
        .get('/api/v1/admin/users?is_active=false')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const inactiveUsers = Array.isArray(response.body)
        ? response.body.filter(u => !u.is_active)
        : response.body.users.filter(u => !u.is_active);
      expect(inactiveUsers.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/admin/users/:id - Get User Details', () => {
    test('should return specific user details', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(regularUser.id);
      expect(response.body.username).toBe(regularUser.username);
      expect(response.body).not.toHaveProperty('password_hash');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/admin/users - Create User', () => {
    test('should create new user', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'password123',
        is_admin: false,
        is_active: true,
      };

      const response = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.username).toBe(newUser.username);
      expect(response.body.email).toBe(newUser.email);
      expect(response.body).not.toHaveProperty('password_hash');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'test' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/v1/admin/users/:id - Update User', () => {
    test('should update user details', async () => {
      const updates = {
        email: 'updated@test.com',
        is_active: false,
      };

      const response = await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(updates.email);
      expect(response.body.is_active).toBe(updates.is_active);
    });

    test('should allow admin to change user role', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_admin: true });

      expect(response.status).toBe(200);
      expect(response.body.is_admin).toBe(true);
    });

    test('should prevent admin from modifying own role', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_admin: false });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/cannot modify your own/i);
    });
  });

  describe('DELETE /api/v1/admin/users/:id - Delete User', () => {
    test('should delete user', async () => {
      const response = await request(app)
        .delete(`/api/v1/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      const deletedUser = await User.findByPk(regularUser.id);
      expect(deletedUser).toBeNull();
    });

    test('should prevent admin from deleting themselves', async () => {
      const response = await request(app)
        .delete(`/api/v1/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/cannot delete yourself/i);
    });
  });

  describe('GET /api/v1/admin/devices - Get All Devices', () => {
    test('should return all devices from all users', async () => {
      const response = await request(app)
        .get('/api/v1/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('devices');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.devices)).toBe(true);
    });

    test('should include user information with devices', async () => {
      const response = await request(app)
        .get('/api/v1/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      if (response.body.devices.length > 0) {
        const device = response.body.devices[0];
        expect(device).toHaveProperty('user');
        expect(device.user).toHaveProperty('username');
      }
    });

    test('should support filtering by status', async () => {
      const response = await request(app)
        .get('/api/v1/admin/devices?status=active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const activeDevices = response.body.devices.filter(d => d.status === 'active');
      expect(activeDevices.length).toBe(response.body.devices.length);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/admin/devices?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.devices.length).toBeLessThanOrEqual(10);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
    });
  });

  describe('GET /api/v1/admin/devices/:id - Get Device Details', () => {
    test('should return device details with owner info', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/devices/${testDevice.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testDevice.id);
      expect(response.body).toHaveProperty('user');
    });
  });

  describe('DELETE /api/v1/admin/devices/:id - Delete Any Device', () => {
    test('should allow admin to delete any device', async () => {
      const response = await request(app)
        .delete(`/api/v1/admin/devices/${testDevice.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deletedDevice = await Device.findByPk(testDevice.id);
      expect(deletedDevice).toBeNull();
    });

    test('should return 404 for non-existent device', async () => {
      const response = await request(app)
        .delete('/api/v1/admin/devices/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/admin/stats - System Statistics', () => {
    test('should return system statistics', async () => {
      const response = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalDevices');
      expect(response.body).toHaveProperty('activeUsers');
      expect(response.body).toHaveProperty('activeDevices');
      expect(response.body).toHaveProperty('adminUsers');
    });

    test('should return accurate counts', async () => {
      const response = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalUsers).toBeGreaterThanOrEqual(2);
      expect(response.body.totalDevices).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/admin/users/:id/devices - Get User Devices', () => {
    test('should return all devices for specific user', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/users/${regularUser.id}/devices`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        expect(response.body[0].user_id).toBe(regularUser.id);
      }
    });
  });
});
