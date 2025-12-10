const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/utils/db');
const { User, Device, DeviceConfiguration } = require('../../src/models');
const bcrypt = require('bcrypt');

describe('Device Operations Without TelemetryData and DeviceAuth Tables', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;
  let testDevice;

  beforeAll(async () => {
    // Ensure database connection
    await sequelize.authenticate();
    await sequelize.sync();
  });

  beforeEach(async () => {
    // Clean up before each test
    await Device.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    adminUser = await User.create({
      user_id: 'admin-uuid-test',
      username: 'admin_test',
      email: 'admin@test.com',
      password_hash: hashedPassword,
      is_admin: true,
      is_active: true,
    });

    // Create regular user
    regularUser = await User.create({
      user_id: 'user-uuid-test',
      username: 'user_test',
      email: 'user@test.com',
      password_hash: hashedPassword,
      is_admin: false,
      is_active: true,
    });

    // Login admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin_test', password: 'admin123' });
    adminToken = adminLoginRes.body.token;

    // Login regular user
    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'user_test', password: 'admin123' });
    userToken = userLoginRes.body.token;
  });

  afterEach(async () => {
    // Clean up after each test
    await Device.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  describe('Device Creation', () => {
    test('should create a device without telemetry_data or device_auth tables', async () => {
      const response = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Device',
          device_type: 'sensor',
          status: 'active',
          description: 'Test device without telemetry',
        });

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
      expect(response.body.name).toBe('Test Device');
      expect(response.body.device_type).toBe('sensor');
      testDevice = response.body;
    });

    test('should retrieve created device', async () => {
      // Create device first
      const createRes = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Device 2',
          device_type: 'sensor',
          status: 'active',
        });
      
      const response = await request(app)
        .get(`/api/devices/${createRes.body.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createRes.body.id);
      expect(response.body.name).toBe('Test Device 2');
    });
  });

  describe('Device Update', () => {
    test('should update device without telemetry_data dependencies', async () => {
      // Create device first
      const createRes = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Device to Update',
          device_type: 'actuator',
          status: 'active',
        });

      const response = await request(app)
        .put(`/api/devices/${createRes.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Device',
          status: 'inactive',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Device');
      expect(response.body.status).toBe('inactive');
    });
  });

  describe('Device Configuration', () => {
    test('should create device configuration without device_auth dependencies', async () => {
      // Create device first
      const createRes = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Device with Config',
          device_type: 'sensor',
          status: 'active',
        });

      const response = await request(app)
        .put(`/api/devices/${createRes.body.id}/configuration`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          configuration: {
            refresh_rate: 60,
            threshold: 25,
          },
        });

      if (response.status !== 200) {
        console.log('Configuration error:', response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.configuration).toBeDefined();
    });

    test('should retrieve device configuration', async () => {
      // Create device and config first
      const createRes = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Device Config Test',
          device_type: 'sensor',
        });

      await request(app)
        .put(`/api/devices/${createRes.body.id}/configuration`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          configuration: { test: 'value' },
        });

      const response = await request(app)
        .get(`/api/devices/${createRes.body.id}/configuration`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.configuration).toBeDefined();
    });
  });

  describe('Admin Device Operations', () => {
    test('should get all devices without telemetry_data table', async () => {
      // Create a test device first
      await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Admin Test Device',
          device_type: 'sensor',
          status: 'active',
        });

      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.devices).toBeDefined();
      expect(Array.isArray(response.body.devices)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
    });

    test('should filter devices by status', async () => {
      // Create devices with different statuses
      await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Inactive Device',
          device_type: 'sensor',
          status: 'inactive',
        });

      const response = await request(app)
        .get('/api/devices/admin/devices?status=inactive')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.devices).toBeDefined();
      response.body.devices.forEach(device => {
        expect(device.status).toBe('inactive');
      });
    });

    test('should filter devices by device_type', async () => {
      // Create a sensor device
      await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Sensor Device',
          device_type: 'sensor',
          status: 'active',
        });

      const response = await request(app)
        .get('/api/devices/admin/devices?device_type=sensor')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.devices).toBeDefined();
      response.body.devices.forEach(device => {
        expect(device.device_type).toBe('sensor');
      });
    });
  });

  describe('Device Deletion', () => {
    test('should delete device without telemetry_data and device_auth cleanup', async () => {
      // Create a device to delete
      const createRes = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Device to Delete',
          device_type: 'actuator',
          status: 'active',
        });

      const response = await request(app)
        .delete(`/api/devices/${createRes.body.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      if (response.status !== 200) {
        console.log('Delete error:', response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Device deleted successfully');
    });

    test('should verify device is deleted', async () => {
      // Create and delete a device
      const createRes = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Device to Verify Delete',
          device_type: 'actuator',
          status: 'active',
        });

      await request(app)
        .delete(`/api/devices/${createRes.body.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      const response = await request(app)
        .get(`/api/devices/${createRes.body.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Admin Device Deletion', () => {
    test('should delete any device as admin without telemetry_data cleanup', async () => {
      // Create a device under regular user
      const createRes = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'User Device to Delete as Admin',
          device_type: 'sensor',
          status: 'active',
        });

      const response = await request(app)
        .delete(`/api/devices/admin/devices/${createRes.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Device deleted successfully');
    });

    test('should verify admin-deleted device is gone', async () => {
      // Create and delete a device
      const createRes = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Device to Verify Admin Delete',
          device_type: 'actuator',
        });

      await request(app)
        .delete(`/api/devices/admin/devices/${createRes.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const device = await Device.findOne({ where: { id: createRes.body.id } });
      expect(device).toBeNull();
    });
  });

  describe('Model Verification', () => {
    test('should verify TelemetryData model is not imported', () => {
      const models = require('../../src/models');
      expect(models.TelemetryData).toBeUndefined();
    });

    test('should verify DeviceAuth model is not imported', () => {
      const models = require('../../src/models');
      expect(models.DeviceAuth).toBeUndefined();
    });

    test('should verify only expected models are exported', () => {
      const models = require('../../src/models');
      const expectedModels = [
        'User',
        'Device',
        'DeviceConfiguration',
        'Chart',
        'Notification',
        'Group',
        'DeviceGroupAssociation',
      ];

      const actualModels = Object.keys(models);
      
      expectedModels.forEach(modelName => {
        expect(actualModels).toContain(modelName);
      });

      expect(actualModels).not.toContain('TelemetryData');
      expect(actualModels).not.toContain('DeviceAuth');
    });
  });

  describe('Device List Operations', () => {
    test('should list all user devices without telemetry relations', async () => {
      // Create a device first
      await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'List Test Device',
          device_type: 'sensor',
          status: 'active',
        });

      const response = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.devices).toBeDefined();
      expect(Array.isArray(response.body.devices)).toBe(true);
    });

    test('should handle empty device list', async () => {
      // Create a new user with no devices
      const hashedPassword = await bcrypt.hash('test123', 10);
      const newUser = await User.create({
        user_id: 'empty-user-uuid',
        username: 'empty_user',
        email: 'empty@test.com',
        password_hash: hashedPassword,
        is_admin: false,
        is_active: true,
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'empty_user', password: 'test123' });

      const response = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body.devices).toEqual([]);

      // Cleanup
      await User.destroy({ where: { id: newUser.id } });
    });
  });
});
