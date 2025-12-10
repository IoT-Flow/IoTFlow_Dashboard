/**
 * TDD Test Suite for Admin Devices Endpoint (Simplified)
 * 
 * Testing: GET /api/devices/admin/devices
 * Requirements:
 * 1. Only accessible with admin token
 * 2. Returns all devices from all users
 * 3. Includes user information for each device
 * 4. Returns 401 without token
 * 5. Returns 403 for non-admin users
 */

const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/utils/db');
const User = require('../../src/models/user');
const Device = require('../../src/models/device');
const bcrypt = require('bcrypt');

describe('Admin Devices Endpoint - TDD', () => {
  let adminToken;
  let regularUserToken;
  let adminUser;
  let regularUser;

  // Helper: Create a device for a user
  const createDevice = async (userId, name, deviceType = 'sensor', status = 'active') => {
    return await Device.create({
      name,
      description: `Test device ${name}`,
      device_type: deviceType,
      api_key: `test_key_${Date.now()}_${Math.random()}`,
      status,
      location: 'Test Location',
      user_id: userId,
    });
  };

  beforeAll(async () => {
    // Ensure database is connected
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Clean up database - delete devices first (foreign key constraint)
    try {
      await Device.destroy({ where: {} });
    } catch (err) {
      // Ignore errors if table doesn't exist yet
    }
    try {
      await User.destroy({ where: {} });
    } catch (err) {
      // Ignore errors if table doesn't exist yet
    }

    // Create admin user directly (skip login helper for simpler setup)
    const adminPassword = await bcrypt.hash('admin123', 10);
    adminUser = await User.create({
      user_id: `admin-${Date.now()}`,
      username: 'testadmin',
      email: 'admin@test.com',
      password_hash: adminPassword,
      is_admin: true,
      is_active: true,
    });

    // Login to get admin token
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'admin123' });
    adminToken = adminLogin.body.token;

    // Create regular user directly
    const userPassword = await bcrypt.hash('user123', 10);
    regularUser = await User.create({
      user_id: `user-${Date.now()}`,
      username: 'testuser',
      email: 'user@test.com',
      password_hash: userPassword,
      is_admin: false,
      is_active: true,
    });

    // Login to get regular user token
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'user123' });
    regularUserToken = userLogin.body.token;

    // Create test devices
    await createDevice(adminUser.id, 'Admin Device 1', 'temperature_sensor', 'online');
    await createDevice(adminUser.id, 'Admin Device 2', 'humidity_sensor', 'offline');
    await createDevice(regularUser.id, 'User Device 1', 'pressure_sensor', 'online');
    await createDevice(regularUser.id, 'User Device 2', 'motion_sensor', 'inactive');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ===== TEST 1: Authentication Required =====
  describe('Authentication', () => {
    test('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .expect(401);

      expect(response.body.message).toMatch(/token|required|unauthorized/i);
    });

    test('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);

      expect(response.body.message).toMatch(/token|invalid|malformed/i);
    });
  });

  // ===== TEST 2: Authorization (Admin Only) =====
  describe('Authorization', () => {
    test('should return 403 when regular user tries to access', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body.message).toMatch(/admin|forbidden|access denied/i);
    });

    test('should return 200 when admin user accesses', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('devices');
      expect(response.body).toHaveProperty('total');
    });
  });

  // ===== TEST 3: Return All Devices =====
  describe('Fetching All Devices', () => {
    test('should return all devices from all users', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.devices).toBeInstanceOf(Array);
      expect(response.body.devices.length).toBe(4); // 2 admin + 2 regular user
      expect(response.body.total).toBe(4);
    });

    test('should include user information for each device', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const devices = response.body.devices;
      
      // Check that all devices have user info
      devices.forEach(device => {
        expect(device).toHaveProperty('user');
        expect(device.user).toHaveProperty('id');
        expect(device.user).toHaveProperty('username');
        expect(device.user).toHaveProperty('email');
      });

      // Check specific user assignments
      const adminDevices = devices.filter(d => d.user.username === 'testadmin');
      const userDevices = devices.filter(d => d.user.username === 'testuser');
      
      expect(adminDevices.length).toBe(2);
      expect(userDevices.length).toBe(2);
    });

    test('should include all device properties', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const device = response.body.devices[0];
      
      expect(device).toHaveProperty('id');
      expect(device).toHaveProperty('name');
      expect(device).toHaveProperty('description');
      expect(device).toHaveProperty('device_type');
      expect(device).toHaveProperty('api_key');
      expect(device).toHaveProperty('status');
      expect(device).toHaveProperty('location');
      expect(device).toHaveProperty('user_id');
      expect(device).toHaveProperty('created_at');
      expect(device).toHaveProperty('updated_at');
    });

    test('should return empty array when no devices exist', async () => {
      // Delete all devices
      await Device.destroy({ where: {}, force: true });

      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.devices).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  // ===== TEST 4: Filtering =====
  describe('Filtering Devices', () => {
    test('should filter devices by status', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices?status=online')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.devices.length).toBe(2);
      response.body.devices.forEach(device => {
        expect(device.status).toBe('online');
      });
    });

    test('should filter devices by device_type', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices?device_type=pressure_sensor')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.devices.length).toBe(1);
      expect(response.body.devices[0].device_type).toBe('pressure_sensor');
    });

    test('should filter devices by user_id', async () => {
      const response = await request(app)
        .get(`/api/devices/admin/devices?user_id=${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.devices.length).toBe(2);
      response.body.devices.forEach(device => {
        expect(device.user_id).toBe(regularUser.id);
        expect(device.user.username).toBe('testuser');
      });
    });

    test('should support multiple filters', async () => {
      const response = await request(app)
        .get(`/api/devices/admin/devices?status=online&user_id=${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.devices.length).toBe(1);
      expect(response.body.devices[0].status).toBe('online');
      expect(response.body.devices[0].user_id).toBe(adminUser.id);
    });

    test('should return empty array when no devices match filters', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices?status=nonexistent_status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.devices).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  // ===== TEST 5: Ordering =====
  describe('Device Ordering', () => {
    test('should return devices ordered by created_at DESC', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const devices = response.body.devices;
      expect(devices.length).toBeGreaterThan(1);

      // Check that devices are in descending order by created_at
      for (let i = 0; i < devices.length - 1; i++) {
        const currentDate = new Date(devices[i].created_at);
        const nextDate = new Date(devices[i + 1].created_at);
        expect(currentDate >= nextDate).toBe(true);
      }
    });
  });

  // ===== TEST 6: Error Handling =====
  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock a database error by closing connection temporarily
      jest.spyOn(Device, 'findAll').mockRejectedValueOnce(new Error('Database connection lost'));

      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/failed|error/i);

      // Restore the mock
      Device.findAll.mockRestore();
    });

    test('should handle special characters in filter values', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices?status=online%20%3B%20DROP%20TABLE%20devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should return empty array (no match) but not cause SQL injection
      expect(response.body.devices).toEqual([]);
    });
  });

  // ===== TEST 7: Performance =====
  describe('Performance', () => {
    test('should handle large number of devices efficiently', async () => {
      // Create 100 devices
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          createDevice(
            i % 2 === 0 ? adminUser.id : regularUser.id,
            `Performance Test Device ${i}`,
            'test_sensor',
            i % 3 === 0 ? 'online' : 'offline'
          )
        );
      }
      await Promise.all(promises);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const endTime = Date.now();

      expect(response.body.devices.length).toBe(104); // 4 initial + 100 new
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in < 2 seconds
    });
  });

  // ===== TEST 8: Security =====
  describe('Security', () => {
    test('should not expose sensitive user data', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const device = response.body.devices[0];
      
      // Should NOT include password_hash or other sensitive fields
      expect(device.user).not.toHaveProperty('password_hash');
      expect(device.user).not.toHaveProperty('password');
    });

    test('should include device api_key for admin management', async () => {
      const response = await request(app)
        .get('/api/devices/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const device = response.body.devices[0];
      
      // Admin should see API keys for device management
      expect(device).toHaveProperty('api_key');
      expect(typeof device.api_key).toBe('string');
    });
  });
});
