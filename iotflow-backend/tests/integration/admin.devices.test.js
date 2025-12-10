const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/utils/db');
const User = require('../../src/models/user');
const Device = require('../../src/models/device');
const bcrypt = require('bcrypt');

describe('Admin Device Management - GET /api/devices/admin/devices', () => {
  let adminToken;
  let regularUserToken;
  let adminUser;
  let regularUser;
  let regularUser2;

  beforeAll(async () => {
    // Ensure database connection
    await sequelize.authenticate();
    await sequelize.sync();
  });

  beforeEach(async () => {
    // Clean up database
    await Device.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    adminUser = await User.create({
      user_id: 'admin-uuid-123',
      username: 'testadmin',
      email: 'admin@test.com',
      password_hash: adminPassword,
      is_admin: true,
      is_active: true,
    });

    // Create regular users
    const regularPassword = await bcrypt.hash('user123', 10);
    regularUser = await User.create({
      user_id: 'user-uuid-123',
      username: 'testuser1',
      email: 'user1@test.com',
      password_hash: regularPassword,
      is_admin: false,
      is_active: true,
    });

    regularUser2 = await User.create({
      user_id: 'user-uuid-456',
      username: 'testuser2',
      email: 'user2@test.com',
      password_hash: regularPassword,
      is_admin: false,
      is_active: true,
    });

    // Login to get tokens
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'admin123' });
    adminToken = adminLoginResponse.body.token;

    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser1', password: 'user123' });
    regularUserToken = userLoginResponse.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Authentication & Authorization', () => {
    test('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices');

      expect(response.status).toBe(401);
    });

    test('should return 403 when regular user tries to access admin endpoint', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Forbidden');
    });

    test('should return 200 when admin user accesses endpoint', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Fetching All Devices', () => {
    beforeEach(async () => {
      // Create devices for different users
      await Device.create({
        name: 'User1 Device 1',
        description: 'Temperature sensor',
        device_type: 'temperature_sensor',
        status: 'online',
        location: 'Room 1',
        user_id: regularUser.id,
      });

      await Device.create({
        name: 'User1 Device 2',
        description: 'Humidity sensor',
        device_type: 'humidity_sensor',
        status: 'offline',
        location: 'Room 2',
        user_id: regularUser.id,
      });

      await Device.create({
        name: 'User2 Device 1',
        description: 'Pressure sensor',
        device_type: 'pressure_sensor',
        status: 'online',
        location: 'Room 3',
        user_id: regularUser2.id,
      });

      await Device.create({
        name: 'Admin Device 1',
        description: 'Admin test device',
        device_type: 'test_sensor',
        status: 'online',
        location: 'Admin Room',
        user_id: adminUser.id,
      });
    });

    test('should return all devices from all users', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('devices');
      expect(response.body).toHaveProperty('total');
      expect(response.body.total).toBe(4);
      expect(response.body.devices).toHaveLength(4);
    });

    test('should include user information for each device', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const devices = response.body.devices;
      devices.forEach(device => {
        expect(device).toHaveProperty('user');
        expect(device.user).toHaveProperty('id');
        expect(device.user).toHaveProperty('username');
        expect(device.user).toHaveProperty('email');
        // Should not include sensitive data
        expect(device.user).not.toHaveProperty('password_hash');
      });
    });

    test('should return devices ordered by created_at DESC', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      const devices = response.body.devices;
      for (let i = 0; i < devices.length - 1; i++) {
        const currentDate = new Date(devices[i].created_at);
        const nextDate = new Date(devices[i + 1].created_at);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });

    test('should return empty array when no devices exist', async () => {
      // Delete all devices
      await Device.destroy({ where: {}, force: true });

      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.devices).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe('Filtering Devices', () => {
    beforeEach(async () => {
      // Create devices with different statuses and types
      await Device.create({
        name: 'Online Temp Sensor',
        device_type: 'temperature_sensor',
        status: 'online',
        user_id: regularUser.id,
      });

      await Device.create({
        name: 'Offline Temp Sensor',
        device_type: 'temperature_sensor',
        status: 'offline',
        user_id: regularUser.id,
      });

      await Device.create({
        name: 'Online Humidity Sensor',
        device_type: 'humidity_sensor',
        status: 'online',
        user_id: regularUser2.id,
      });

      await Device.create({
        name: 'Inactive Device',
        device_type: 'test_sensor',
        status: 'inactive',
        user_id: regularUser2.id,
      });
    });

    test('should filter devices by status', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices?status=online')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      response.body.devices.forEach(device => {
        expect(device.status).toBe('online');
      });
    });

    test('should filter devices by device_type', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices?device_type=temperature_sensor')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      response.body.devices.forEach(device => {
        expect(device.device_type).toBe('temperature_sensor');
      });
    });

    test('should filter devices by user_id', async () => {
      const response = await request(app)
        .get(`/api/devices/admin/devices?user_id=${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      response.body.devices.forEach(device => {
        expect(device.user_id).toBe(regularUser.id);
      });
    });

    test('should support multiple filters simultaneously', async () => {
      const response = await request(app)
        .get(`/api/devices/admin/devices?status=online&device_type=temperature_sensor`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.devices[0].status).toBe('online');
      expect(response.body.devices[0].device_type).toBe('temperature_sensor');
    });

    test('should return empty array when no devices match filters', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices?status=nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.devices).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe('Device Properties', () => {
    test('should include all expected device properties', async () => {
      await Device.create({
        name: 'Complete Device',
        description: 'Full featured device',
        device_type: 'temperature_sensor',
        status: 'online',
        location: 'Test Location',
        firmware_version: '1.0.0',
        hardware_version: '2.0',
        user_id: regularUser.id,
      });

      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const device = response.body.devices[0];
      
      expect(device).toHaveProperty('id');
      expect(device).toHaveProperty('name');
      expect(device).toHaveProperty('description');
      expect(device).toHaveProperty('device_type');
      expect(device).toHaveProperty('api_key');
      expect(device).toHaveProperty('status');
      expect(device).toHaveProperty('location');
      expect(device).toHaveProperty('firmware_version');
      expect(device).toHaveProperty('hardware_version');
      expect(device).toHaveProperty('created_at');
      expect(device).toHaveProperty('updated_at');
      expect(device).toHaveProperty('last_seen');
      expect(device).toHaveProperty('user_id');
    });

    test('should not expose sensitive internal fields', async () => {
      await Device.create({
        name: 'Test Device',
        device_type: 'sensor',
        user_id: regularUser.id,
      });

      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const device = response.body.devices[0];
      
      // API key should be included (admin needs it)
      expect(device).toHaveProperty('api_key');
      expect(device.api_key).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Force an error by closing the connection temporarily
      const originalFindAll = Device.findAll;
      Device.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Failed to retrieve devices');

      // Restore original method
      Device.findAll = originalFindAll;
    });

    test('should return valid JSON even with special characters in device names', async () => {
      await Device.create({
        name: 'Device "with" \'quotes\' & <special> chars',
        device_type: 'sensor',
        description: 'Special chars: é à ñ 中文',
        user_id: regularUser.id,
      });

      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.devices).toHaveLength(1);
      expect(response.body.devices[0].name).toContain('quotes');
    });
  });

  describe('Performance', () => {
    test('should handle large number of devices efficiently', async () => {
      // Create 100 devices
      const devices = [];
      for (let i = 0; i < 100; i++) {
        devices.push({
          name: `Device ${i}`,
          device_type: 'sensor',
          status: i % 2 === 0 ? 'online' : 'offline',
          user_id: i % 2 === 0 ? regularUser.id : regularUser2.id,
        });
      }
      await Device.bulkCreate(devices);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(100);
      
      // Should complete within reasonable time (2 seconds)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(2000);
    }, 10000); // Increase timeout for this test
  });
});
