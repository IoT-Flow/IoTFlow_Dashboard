/**
 * Unit Tests for Device Status Sync Service
 */

const { setupTestDatabase, createTestUser, createTestDevice } = require('../helpers');
const Device = require('../../src/models/device');
const User = require('../../src/models/user');

// Mock redis module
jest.mock('redis', () => {
  const mockStore = new Map();

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
        return Promise.resolve('OK');
      }),
      del: jest.fn(key => {
        mockStore.delete(key);
        return Promise.resolve(1);
      }),
      keys: jest.fn(() => Promise.resolve([])),
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
      _mockStore: mockStore,
    })),
  };
});

const redisService = require('../../src/services/redisService');
const deviceStatusSyncService = require('../../src/services/deviceStatusSyncService');

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  const redis = require('redis');
  const client = redis.createClient();
  client._mockStore.clear();

  redisService.isConnected = false;
  redisService.client = null;

  // Stop sync service if running
  deviceStatusSyncService.stop();

  await Device.destroy({ where: {}, truncate: true });
  await User.destroy({ where: {}, truncate: true });
});

afterEach(() => {
  deviceStatusSyncService.stop();
});

describe('DeviceStatusSyncService', () => {
  let testUser;
  let testDevice1;
  let testDevice2;

  beforeEach(async () => {
    testUser = await createTestUser();
    testDevice1 = await createTestDevice(testUser.id, { name: 'Device 1', status: 'offline' });
    testDevice2 = await createTestDevice(testUser.id, { name: 'Device 2', status: 'offline' });
  });

  describe('syncAllDevices', () => {
    test('should update device status from offline to online when Redis shows online', async () => {
      await redisService.connect();
      await redisService.markDeviceOnline(testDevice1.id);
      // testDevice2 stays offline in Redis

      await deviceStatusSyncService.syncAllDevices();

      await testDevice1.reload();
      await testDevice2.reload();

      expect(testDevice1.status).toBe('online');
      expect(testDevice2.status).toBe('offline');
    });

    test('should update device status from online to offline when Redis TTL expires', async () => {
      // Set device1 as online in DB
      await testDevice1.update({ status: 'online' });

      await redisService.connect();
      // Don't mark device1 online in Redis (simulating TTL expiry)

      await deviceStatusSyncService.syncAllDevices();

      await testDevice1.reload();
      expect(testDevice1.status).toBe('offline');
    });

    test('should not sync when Redis is not connected', async () => {
      // Don't connect Redis
      await testDevice1.update({ status: 'online' });

      await deviceStatusSyncService.syncAllDevices();

      await testDevice1.reload();
      // Status should remain unchanged
      expect(testDevice1.status).toBe('online');
    });
  });

  describe('start/stop', () => {
    test('should set isRunning to true when started', () => {
      deviceStatusSyncService.start();
      expect(deviceStatusSyncService.isRunning).toBe(true);
    });

    test('should set isRunning to false when stopped', () => {
      deviceStatusSyncService.start();
      deviceStatusSyncService.stop();
      expect(deviceStatusSyncService.isRunning).toBe(false);
    });

    test('should not start twice', () => {
      deviceStatusSyncService.start();
      deviceStatusSyncService.start(); // Should not throw
      expect(deviceStatusSyncService.isRunning).toBe(true);
    });
  });

  describe('syncDevice', () => {
    test('should sync a specific device', async () => {
      await redisService.connect();
      await redisService.markDeviceOnline(testDevice1.id);

      await deviceStatusSyncService.syncDevice(testDevice1.id);

      await testDevice1.reload();
      expect(testDevice1.status).toBe('online');
    });
  });
});
