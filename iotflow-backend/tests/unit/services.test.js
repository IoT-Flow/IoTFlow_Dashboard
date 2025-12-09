/**
 * Unit Tests for Services
 * Testing notification service and other business logic
 */

const notificationService = require('../../src/services/notificationService');
const { User, Device, Notification } = require('../../src/models');
const { setupTestDatabase, createTestUser, createTestDevice } = require('../helpers');

// Setup database once for all tests
beforeAll(async () => {
  await setupTestDatabase();
});

describe('Notification Service', () => {
  let testUser;
  let testDevice;

  beforeEach(async () => {
    await Notification.destroy({ where: {}, truncate: true });
    await Device.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
    testUser = await createTestUser();
    testDevice = await createTestDevice(testUser.id);
  });

  describe('createNotification', () => {
    test('should create a notification', async () => {
      const notificationData = {
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification',
        device_id: testDevice.id,
        source: 'test',
      };

      const notification = await notificationService.createNotification(
        testUser.id,
        notificationData
      );

      expect(notification).toBeDefined();
      expect(notification.title).toBe('Test Notification');
      expect(notification.type).toBe('info');
      expect(notification.user_id).toBe(testUser.id);
    });

    test('should create notification without device_id', async () => {
      const notificationData = {
        type: 'success',
        title: 'System Notification',
        message: 'System message',
        source: 'system',
      };

      const notification = await notificationService.createNotification(
        testUser.id,
        notificationData
      );

      expect(notification).toBeDefined();
      expect(notification.device_id).toBeNull();
    });

    test('should set default values', async () => {
      const notificationData = {
        title: 'Simple Notification',
        message: 'Simple message',
      };

      const notification = await notificationService.createNotification(
        testUser.id,
        notificationData
      );

      expect(notification.type).toBeDefined();
      expect(notification.is_read).toBe(false);
      expect(notification.created_at).toBeDefined();
    });
  });

  describe('Notification Storage', () => {
    test('should store notifications in database', async () => {
      await notificationService.createNotification(testUser.id, {
        title: 'Test Notification',
        message: 'Test message',
      });

      const notifications = await Notification.findAll({
        where: { user_id: testUser.id },
      });

      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });

    test('should store multiple notifications', async () => {
      await notificationService.createNotification(testUser.id, {
        title: 'Notification 1',
        message: 'Message 1',
      });
      await notificationService.createNotification(testUser.id, {
        title: 'Notification 2',
        message: 'Message 2',
      });

      const notifications = await Notification.findAll({
        where: { user_id: testUser.id },
      });

      expect(notifications.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Notification Types', () => {
    test('should create device-related notification', async () => {
      const notification = await notificationService.notifyDeviceCreated(testUser.id, testDevice);

      expect(notification).toBeDefined();
      expect(notification.device_id).toBe(testDevice.id);
    });

    test('should create device update notification', async () => {
      const notification = await notificationService.notifyDeviceUpdated(testUser.id, testDevice);

      expect(notification).toBeDefined();
    });

    test('should create device deletion notification', async () => {
      const notification = await notificationService.notifyDeviceDeleted(
        testUser.id,
        testDevice.name,
        testDevice.id
      );

      expect(notification).toBeDefined();
    });

    test('should create login notification', async () => {
      const notification = await notificationService.notifySuccessfulLogin(testUser.id, {
        login_method: 'email',
      });

      expect(notification).toBeDefined();
    });
  });
});
