/**
 * Unit Tests for Redis Device Status Service
 * TDD approach - tests written first
 */

const { setupTestDatabase, createTestUser, createTestDevice } = require('../helpers');
const Device = require('../../src/models/device');

// Mock redis module
jest.mock('redis', () => {
  const mockStore = new Map();
  const mockExpiry = new Map();

  return {
    createClient: jest.fn(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      get: jest.fn(key => Promise.resolve(mockStore.get(key) || null)),
      set: jest.fn((key, value) => {
        mockStore.set(key, value);
        return Promise.resolve('OK');
      }),
      setEx: jest.fn((key, ttl, value) => {
        mockStore.set(key, value);
        mockExpiry.set(key, ttl);
        return Promise.resolve('OK');
      }),
      del: jest.fn(key => {
        mockStore.delete(key);
        mockExpiry.delete(key);
        return Promise.resolve(1);
      }),
      keys: jest.fn(pattern => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        const matchingKeys = Array.from(mockStore.keys()).filter(k => regex.test(k));
        return Promise.resolve(matchingKeys);
      }),
      multi: jest.fn(() => {
        const commands = [];
        const pipeline = {
          get: jest.fn(key => {
            commands.push(['get', key]);
            return pipeline;
          }),
          exec: jest.fn(() => {
            return Promise.resolve(commands.map(([cmd, key]) => mockStore.get(key) || null));
          }),
        };
        return pipeline;
      }),
      // Expose mock store for test manipulation
      _mockStore: mockStore,
      _mockExpiry: mockExpiry,
    })),
  };
});

// Import after mocking
const redisService = require('../../src/services/redisService');

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  // Clear mock store before each test
  const redis = require('redis');
  const client = redis.createClient();
  client._mockStore.clear();
  client._mockExpiry.clear();

  // Reset service state
  redisService.isConnected = false;
  redisService.client = null;
});

describe('RedisService', () => {
  describe('connect', () => {
    test('should connect to Redis successfully', async () => {
      await redisService.connect();
      expect(redisService.isConnected).toBe(true);
      expect(redisService.client).not.toBeNull();
    });
  });

  describe('disconnect', () => {
    test('should disconnect from Redis', async () => {
      await redisService.connect();
      await redisService.disconnect();
      expect(redisService.isConnected).toBe(false);
    });
  });

  describe('updateDeviceStatus', () => {
    test('should set device status to online with TTL', async () => {
      await redisService.connect();

      await redisService.updateDeviceStatus(123, 'online');

      const status = await redisService.getDeviceStatus(123);
      expect(status).toBe('online');
    });

    test('should update last_seen timestamp', async () => {
      await redisService.connect();

      await redisService.updateDeviceStatus(123, 'online');

      const lastSeen = await redisService.getDeviceLastSeen(123);
      expect(lastSeen).not.toBeNull();
    });

    test('should set TTL of 60 seconds for online status', async () => {
      await redisService.connect();

      await redisService.updateDeviceStatus(123, 'online');

      // Check that setEx was called with 60 second TTL
      expect(redisService.client.setEx).toHaveBeenCalledWith('device:status:123', 60, 'online');
    });
  });

  describe('markDeviceOnline', () => {
    test('should mark device as online when telemetry received', async () => {
      await redisService.connect();

      await redisService.markDeviceOnline(456);

      const status = await redisService.getDeviceStatus(456);
      expect(status).toBe('online');
    });

    test('should refresh TTL on subsequent telemetry', async () => {
      await redisService.connect();

      await redisService.markDeviceOnline(456);
      await redisService.markDeviceOnline(456);

      // setEx should be called twice (refreshing TTL)
      expect(redisService.client.setEx).toHaveBeenCalledTimes(2);
    });
  });

  describe('isDeviceOnline', () => {
    test('should return true for online device', async () => {
      await redisService.connect();
      await redisService.markDeviceOnline(789);

      const isOnline = await redisService.isDeviceOnline(789);
      expect(isOnline).toBe(true);
    });

    test('should return false for device with no status', async () => {
      await redisService.connect();

      const isOnline = await redisService.isDeviceOnline(999);
      expect(isOnline).toBe(false);
    });

    test('should return false when Redis not connected', async () => {
      const isOnline = await redisService.isDeviceOnline(123);
      expect(isOnline).toBe(false);
    });
  });

  describe('getDeviceStatuses', () => {
    test('should return statuses for multiple devices', async () => {
      await redisService.connect();
      await redisService.markDeviceOnline(1);
      await redisService.markDeviceOnline(2);

      const statuses = await redisService.getDeviceStatuses([1, 2, 3]);

      expect(statuses.get(1).is_online).toBe(true);
      expect(statuses.get(2).is_online).toBe(true);
      expect(statuses.get(3).is_online).toBe(false);
    });

    test('should return empty map when Redis not connected', async () => {
      const statuses = await redisService.getDeviceStatuses([1, 2]);
      expect(statuses.size).toBe(0);
    });
  });
});

describe('DeviceStatusSyncService', () => {
  let testUser;
  let testDevice;

  beforeEach(async () => {
    await Device.destroy({ where: {}, truncate: true });
    const User = require('../../src/models/user');
    await User.destroy({ where: {}, truncate: true });

    testUser = await createTestUser();
    testDevice = await createTestDevice(testUser.id, { status: 'offline' });
  });

  describe('syncDeviceStatusToDb', () => {
    test('should update device status in database when online', async () => {
      await redisService.connect();
      await redisService.markDeviceOnline(testDevice.id);

      await redisService.syncDeviceStatusToDb(testDevice.id);

      await testDevice.reload();
      expect(testDevice.status).toBe('online');
    });

    test('should update last_seen in database', async () => {
      await redisService.connect();
      await redisService.markDeviceOnline(testDevice.id);

      const beforeSync = testDevice.last_seen;
      await redisService.syncDeviceStatusToDb(testDevice.id);

      await testDevice.reload();
      expect(testDevice.last_seen).not.toEqual(beforeSync);
    });

    test('should set device offline when no Redis status', async () => {
      await redisService.connect();
      // Device has no status in Redis (simulating TTL expiry)

      // First set it online in DB
      await testDevice.update({ status: 'online' });

      await redisService.syncDeviceStatusToDb(testDevice.id);

      await testDevice.reload();
      expect(testDevice.status).toBe('offline');
    });
  });

  describe('syncAllDeviceStatuses', () => {
    test('should sync all devices for a user', async () => {
      const device2 = await createTestDevice(testUser.id, {
        name: 'Device 2',
        status: 'offline',
      });

      await redisService.connect();
      await redisService.markDeviceOnline(testDevice.id);
      // device2 stays offline (no telemetry)

      await redisService.syncAllDeviceStatuses(testUser.id);

      await testDevice.reload();
      await device2.reload();

      expect(testDevice.status).toBe('online');
      expect(device2.status).toBe('offline');
    });
  });
});
