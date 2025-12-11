/**
 * Unit Tests for Groups (Many-to-Many)
 * Testing Group model and many-to-many relationships with devices
 */

const { sequelize } = require('../../src/utils/db');
const { User, Device, Group, DeviceGroupAssociation } = require('../../src/models');
const { setupTestDatabase, createTestUser, createTestDevice } = require('../helpers');

// Setup database once for all tests
beforeAll(async () => {
  await setupTestDatabase();
});

describe('Group Model', () => {
  let testUser;

  beforeEach(async () => {
    await DeviceGroupAssociation.destroy({ where: {}, truncate: true });
    await Group.destroy({ where: {}, truncate: true });
    await Device.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
    testUser = await createTestUser();
  });

  describe('Group Creation', () => {
    test('should create a group with valid data', async () => {
      const groupData = {
        name: 'Living Room',
        description: 'Devices in the living room',
        user_id: testUser.id,
      };

      const group = await Group.create(groupData);

      expect(group).toBeDefined();
      expect(group.id).toBeDefined();
      expect(group.name).toBe('Living Room');
      expect(group.user_id).toBe(testUser.id);
    });

    test('should set default color', async () => {
      const group = await Group.create({
        name: 'Test Group',
        user_id: testUser.id,
      });

      expect(group.color).toBe('#3B82F6');
    });

    test('should require name', async () => {
      await expect(Group.create({ user_id: testUser.id })).rejects.toThrow();
    });

    test('should require user_id', async () => {
      await expect(Group.create({ name: 'Test Group' })).rejects.toThrow();
    });
  });

  describe('Many-to-Many Relationships', () => {
    test('should add device to group', async () => {
      const group = await Group.create({
        name: 'Kitchen',
        user_id: testUser.id,
      });

      const device = await createTestDevice(testUser.id, {
        name: 'Smart Light',
      });

      await group.addDevice(device);

      const groupWithDevices = await Group.findByPk(group.id, {
        include: [{ model: Device, as: 'devices' }],
      });

      expect(groupWithDevices.devices).toHaveLength(1);
      expect(groupWithDevices.devices[0].name).toBe('Smart Light');
    });

    test('should add multiple devices to group', async () => {
      const group = await Group.create({
        name: 'Living Room',
        user_id: testUser.id,
      });

      const device1 = await createTestDevice(testUser.id, { name: 'Device 1' });
      const device2 = await createTestDevice(testUser.id, { name: 'Device 2' });
      const device3 = await createTestDevice(testUser.id, { name: 'Device 3' });

      await group.addDevices([device1, device2, device3]);

      const groupWithDevices = await Group.findByPk(group.id, {
        include: [{ model: Device, as: 'devices' }],
      });

      expect(groupWithDevices.devices).toHaveLength(3);
    });

    test('should add device to multiple groups', async () => {
      const group1 = await Group.create({
        name: 'Living Room',
        user_id: testUser.id,
      });

      const group2 = await Group.create({
        name: 'Smart Lights',
        user_id: testUser.id,
      });

      const device = await createTestDevice(testUser.id, {
        name: 'Smart Bulb',
      });

      await device.addGroups([group1, group2]);

      const deviceWithGroups = await Device.findByPk(device.id, {
        include: [{ model: Group, as: 'groups' }],
      });

      expect(deviceWithGroups.groups).toHaveLength(2);
      expect(deviceWithGroups.groups.map(g => g.name)).toContain('Living Room');
      expect(deviceWithGroups.groups.map(g => g.name)).toContain('Smart Lights');
    });

    test('should remove device from group', async () => {
      const group = await Group.create({
        name: 'Kitchen',
        user_id: testUser.id,
      });

      const device = await createTestDevice(testUser.id);
      await group.addDevice(device);

      await group.removeDevice(device);

      const groupWithDevices = await Group.findByPk(group.id, {
        include: [{ model: Device, as: 'devices' }],
      });

      expect(groupWithDevices.devices).toHaveLength(0);
    });

    test('should prevent duplicate device-group associations', async () => {
      const group = await Group.create({
        name: 'Test Group',
        user_id: testUser.id,
      });

      const device = await createTestDevice(testUser.id);

      await group.addDevice(device);

      // Try to add same device again
      await expect(
        DeviceGroupAssociation.create({
          device_id: device.id,
          group_id: group.id,
        })
      ).rejects.toThrow();
    });
  });

  describe('Group Deletion', () => {
    test('should delete group and remove associations', async () => {
      const group = await Group.create({
        name: 'Test Group',
        user_id: testUser.id,
      });

      const device = await createTestDevice(testUser.id);
      await group.addDevice(device);

      await group.destroy();

      // Group should be deleted
      const deletedGroup = await Group.findByPk(group.id);
      expect(deletedGroup).toBeNull();

      // Device should still exist
      const existingDevice = await Device.findByPk(device.id);
      expect(existingDevice).toBeDefined();

      // Association should be removed
      const associations = await DeviceGroupAssociation.findAll({
        where: { group_id: group.id },
      });
      expect(associations).toHaveLength(0);
    });
  });

  describe('Query Operations', () => {
    test('should get all groups for a user', async () => {
      await Group.create({ name: 'Group 1', user_id: testUser.id });
      await Group.create({ name: 'Group 2', user_id: testUser.id });
      await Group.create({ name: 'Group 3', user_id: testUser.id });

      const groups = await Group.findAll({
        where: { user_id: testUser.id },
      });

      expect(groups).toHaveLength(3);
    });

    test('should get devices in a group', async () => {
      const group = await Group.create({
        name: 'Test Group',
        user_id: testUser.id,
      });

      const device1 = await createTestDevice(testUser.id, { name: 'Device 1' });
      const device2 = await createTestDevice(testUser.id, { name: 'Device 2' });

      await group.addDevices([device1, device2]);

      const devices = await group.getDevices();

      expect(devices).toHaveLength(2);
    });

    test('should get groups for a device', async () => {
      const group1 = await Group.create({ name: 'Group 1', user_id: testUser.id });
      const group2 = await Group.create({ name: 'Group 2', user_id: testUser.id });

      const device = await createTestDevice(testUser.id);
      await device.addGroups([group1, group2]);

      const groups = await device.getGroups();

      expect(groups).toHaveLength(2);
    });
  });
});
