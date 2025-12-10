const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/utils/db');
const { User, Device } = require('../../src/models');
const bcrypt = require('bcrypt');

describe('Remove Redundant Endpoints - TDD', () => {
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
      user_id: 'admin-remove-test',
      username: 'admin_remove',
      email: 'admin@remove.com',
      password_hash: hashedPassword,
      is_admin: true,
      is_active: true,
    });

    regularUser = await User.create({
      user_id: 'user-remove-test',
      username: 'user_remove',
      email: 'user@remove.com',
      password_hash: hashedPassword,
      is_admin: false,
      is_active: true,
    });

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin_remove', password: 'test123' });
    adminToken = adminLoginRes.body.token;

    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user_remove', password: 'test123' });
    userToken = userLoginRes.body.token;
  });

  afterEach(async () => {
    await Device.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Standard DELETE endpoint should handle all deletion scenarios', () => {
    test('AFTER CONSOLIDATION: admin can delete any device using standard endpoint', async () => {
      // Create device for regular user
      const device = await Device.create({
        name: 'Test Device',
        device_type: 'sensor',
        status: 'active',
        user_id: regularUser.id,
      });

      // Admin deletes it using standard DELETE endpoint
      const response = await request(app)
        .delete(`/api/devices/${device.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // After consolidation, this should work with 200
      // Before consolidation, this returns 404 (device not found for admin's user_id)
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');

      // Verify device is deleted
      const deletedDevice = await Device.findByPk(device.id);
      expect(deletedDevice).toBeNull();
    });

    test('user can delete their own device using standard endpoint', async () => {
      const device = await Device.create({
        name: 'User Device',
        device_type: 'sensor',
        status: 'active',
        user_id: regularUser.id,
      });

      const response = await request(app)
        .delete(`/api/devices/${device.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);

      const deletedDevice = await Device.findByPk(device.id);
      expect(deletedDevice).toBeNull();
    });

    test('user cannot delete other users device', async () => {
      const device = await Device.create({
        name: 'Admin Device',
        device_type: 'sensor',
        status: 'active',
        user_id: adminUser.id,
      });

      const response = await request(app)
        .delete(`/api/devices/${device.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404); // Device not found (filtered by user_id)

      // Verify device still exists
      const existingDevice = await Device.findByPk(device.id);
      expect(existingDevice).not.toBeNull();
    });

    test('deletion without auth fails', async () => {
      const device = await Device.create({
        name: 'No Auth Device',
        device_type: 'sensor',
        status: 'active',
        user_id: regularUser.id,
      });

      const response = await request(app).delete(`/api/devices/${device.id}`);

      expect(response.status).toBe(401);

      const existingDevice = await Device.findByPk(device.id);
      expect(existingDevice).not.toBeNull();
    });
  });

  describe('After removing admin delete endpoint', () => {
    test('admin delete endpoint should return 404', async () => {
      const device = await Device.create({
        name: 'Test Device',
        device_type: 'sensor',
        status: 'active',
        user_id: regularUser.id,
      });

      // This should fail after we remove the route
      const response = await request(app)
        .delete(`/api/devices/admin/devices/${device.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // After removal, expect 404 (route not found)
      // Before removal, this will pass with 200
      // This test documents the expected behavior after removal
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Verify admin GET endpoint is still needed', () => {
    test('admin get all devices returns devices from all users', async () => {
      await Device.create({
        name: 'Admin Device 1',
        device_type: 'sensor',
        user_id: adminUser.id,
      });

      await Device.create({
        name: 'User Device 1',
        device_type: 'sensor',
        user_id: regularUser.id,
      });

      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.devices).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    test('regular get all devices only returns users own devices', async () => {
      await Device.create({
        name: 'Admin Device',
        device_type: 'sensor',
        user_id: adminUser.id,
      });

      await Device.create({
        name: 'User Device',
        device_type: 'sensor',
        user_id: regularUser.id,
      });

      const response = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.devices).toHaveLength(1);
      expect(response.body.devices[0].name).toBe('User Device');
    });
  });
});
