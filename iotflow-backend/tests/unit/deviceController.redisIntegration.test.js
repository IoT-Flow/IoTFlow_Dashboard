/**
 * Unit Tests for Device Controller Redis Integration
 * Tests that device listing includes real-time status from Redis
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
const deviceController = require('../../src/controllers/deviceController');

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  const redis = require('redis');
  const client = redis.createClient();
  client._mockStore.clear();

  redisService.isConnected = false;
  redisService.client = null;

  await Device.destroy({ where: {}, truncate: true });
  await User.destroy({ where: {}, truncate: true });
});

describe('DeviceController Redis Integration', () => {
  let testUser;
  let testDevice1;
  let testDevice2;

  beforeEach(async () => {
    testUser = await createTestUser();
    testDevice1 = await createTestDevice(testUser.id, { name: 'Online Device' });
    testDevice2 = await createTestDevice(testUser.id, { name: 'Offline Device' });
  });

  describe('getAllDevices with Redis status', () => {
    test('should include is_online=true for devices with Redis status', async () => {
      await redisService.connect();
      await redisService.markDeviceOnline(testDevice1.id);
      // testDevice2 stays offline

      const req = {
        user: { id: testUser.id },
        query: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await deviceController.getAllDevices(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const { devices } = res.json.mock.calls[0][0];

      const onlineDevice = devices.find(d => d.id === testDevice1.id);
      const offlineDevice = devices.find(d => d.id === testDevice2.id);

      expect(onlineDevice.is_online).toBe(true);
      expect(onlineDevice.realtime_status).toBe('online');
      expect(offlineDevice.is_online).toBe(false);
      expect(offlineDevice.realtime_status).toBe('offline');
    });

    test('should return is_online=false when Redis not connected', async () => {
      // Don't connect Redis
      const req = {
        user: { id: testUser.id },
        query: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await deviceController.getAllDevices(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const { devices } = res.json.mock.calls[0][0];

      devices.forEach(device => {
        expect(device.is_online).toBe(false);
        expect(device.realtime_status).toBe('offline');
      });
    });
  });

  describe('adminGetAllDevices with Redis status', () => {
    test('should include real-time status for admin device listing', async () => {
      await redisService.connect();
      await redisService.markDeviceOnline(testDevice1.id);

      const req = {
        user: { id: testUser.id, is_admin: true, username: 'admin' },
        query: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await deviceController.adminGetAllDevices(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const { devices } = res.json.mock.calls[0][0];

      const onlineDevice = devices.find(d => d.id === testDevice1.id);
      expect(onlineDevice.is_online).toBe(true);
    });
  });
});
