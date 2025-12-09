/**
 * Unit Tests for Models
 * Testing User and Device models
 */

const { sequelize } = require('../../src/utils/db');
const { User, Device } = require('../../src/models');
const bcrypt = require('bcryptjs');
const {
  setupTestDatabase,
  cleanupTestDatabase,
  createTestUser,
  createTestDevice,
} = require('../helpers');

// Setup database once for all tests
beforeAll(async () => {
  await setupTestDatabase();
});

describe('User Model', () => {
  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true });
  });

  describe('User Creation', () => {
    test('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10),
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.is_active).toBe(true);
      expect(user.is_admin).toBe(false);
    });

    test('should generate unique user_id automatically', async () => {
      const user = await createTestUser();

      expect(user.user_id).toBeDefined();
      expect(user.user_id).toHaveLength(32);
    });

    test('should fail to create user with duplicate username', async () => {
      await createTestUser({ username: 'duplicate' });

      await expect(
        createTestUser({ username: 'duplicate', email: 'different@example.com' })
      ).rejects.toThrow();
    });

    test('should fail to create user with duplicate email', async () => {
      await createTestUser({ email: 'duplicate@example.com' });

      await expect(
        createTestUser({ username: 'different', email: 'duplicate@example.com' })
      ).rejects.toThrow();
    });

    test('should set default values correctly', async () => {
      const user = await createTestUser();

      expect(user.is_active).toBe(true);
      expect(user.is_admin).toBe(false);
      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();
    });
  });

  describe('User Validation', () => {
    test('should require username', async () => {
      await expect(
        User.create({
          email: 'test@example.com',
          password_hash: 'hashed',
        })
      ).rejects.toThrow();
    });

    test('should require email', async () => {
      await expect(
        User.create({
          username: 'testuser',
          password_hash: 'hashed',
        })
      ).rejects.toThrow();
    });

    test('should require password_hash', async () => {
      await expect(
        User.create({
          username: 'testuser',
          email: 'test@example.com',
        })
      ).rejects.toThrow();
    });
  });

  describe('User Updates', () => {
    test('should update user last_login', async () => {
      const user = await createTestUser();
      const loginTime = new Date();

      await user.update({ last_login: loginTime });
      await user.reload();

      expect(user.last_login).toBeDefined();
    });

    test('should update user is_active status', async () => {
      const user = await createTestUser();

      await user.update({ is_active: false });
      await user.reload();

      expect(user.is_active).toBe(false);
    });
  });
});

describe('Device Model', () => {
  let testUser;

  beforeEach(async () => {
    await Device.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
    testUser = await createTestUser();
  });

  describe('Device Creation', () => {
    test('should create a device with valid data', async () => {
      const deviceData = {
        name: 'Test Device',
        description: 'A test device',
        device_type: 'sensor',
        user_id: testUser.id,
      };

      const device = await Device.create(deviceData);

      expect(device).toBeDefined();
      expect(device.id).toBeDefined();
      expect(device.name).toBe('Test Device');
      expect(device.device_type).toBe('sensor');
      expect(device.status).toBe('offline');
    });

    test('should generate unique api_key automatically', async () => {
      const device = await createTestDevice(testUser.id);

      expect(device.api_key).toBeDefined();
      expect(device.api_key).toHaveLength(64);
    });

    test('should set default status to offline', async () => {
      const device = await createTestDevice(testUser.id);

      expect(device.status).toBe('offline');
    });

    test('should create device with timestamps', async () => {
      const device = await createTestDevice(testUser.id);

      expect(device.created_at).toBeDefined();
      expect(device.updated_at).toBeDefined();
    });
  });

  describe('Device Validation', () => {
    test('should require name', async () => {
      await expect(
        Device.create({
          device_type: 'sensor',
          user_id: testUser.id,
        })
      ).rejects.toThrow();
    });

    test('should require device_type', async () => {
      await expect(
        Device.create({
          name: 'Test Device',
          user_id: testUser.id,
        })
      ).rejects.toThrow();
    });

    test('should have unique api_key', async () => {
      const device1 = await createTestDevice(testUser.id);

      await expect(
        Device.create({
          name: 'Device 2',
          device_type: 'sensor',
          api_key: device1.api_key,
          user_id: testUser.id,
        })
      ).rejects.toThrow();
    });
  });

  describe('Device Updates', () => {
    test('should update device status', async () => {
      const device = await createTestDevice(testUser.id);

      await device.update({ status: 'online' });
      await device.reload();

      expect(device.status).toBe('online');
    });

    test('should update device last_seen', async () => {
      const device = await createTestDevice(testUser.id);
      const now = new Date();

      await device.update({ last_seen: now });
      await device.reload();

      expect(device.last_seen).toBeDefined();
    });

    test('should update device firmware_version', async () => {
      const device = await createTestDevice(testUser.id);

      await device.update({ firmware_version: '2.0.0' });
      await device.reload();

      expect(device.firmware_version).toBe('2.0.0');
    });
  });

  describe('Device Relationships', () => {
    test('should belong to a user', async () => {
      const device = await createTestDevice(testUser.id);

      expect(device.user_id).toBe(testUser.id);
    });
  });
});
