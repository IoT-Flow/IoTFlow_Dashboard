/**
 * Integration Tests for Groups API (Many-to-Many)
 * Testing group CRUD and device-group associations
 */

const request = require('supertest');
const app = require('../../src/app');
const { User, Device, Group, DeviceGroupAssociation } = require('../../src/models');
const {
  setupTestDatabase,
  createTestUser,
  createTestDevice,
  generateTestToken,
} = require('../helpers');

// Setup database once for all tests
beforeAll(async () => {
  await setupTestDatabase();
});

describe('Groups API Integration Tests', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    await DeviceGroupAssociation.destroy({ where: {}, truncate: true });
    await Group.destroy({ where: {}, truncate: true });
    await Device.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
    testUser = await createTestUser();
    authToken = generateTestToken(testUser.id);
  });

  describe('POST /api/groups', () => {
    test('should create a new group', async () => {
      const groupData = {
        name: 'Living Room',
        description: 'Devices in the living room',
        color: '#3B82F6',
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Living Room');
    });

    test('should require name', async () => {
      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Test' });

      expect(response.status).toBe(400);
    });

    test('should require authentication', async () => {
      const response = await request(app).post('/api/groups').send({ name: 'Test Group' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/groups', () => {
    test('should return all user groups', async () => {
      await Group.create({ name: 'Group 1', user_id: testUser.id });
      await Group.create({ name: 'Group 2', user_id: testUser.id });

      const response = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    test('should include device count', async () => {
      const group = await Group.create({
        name: 'Test Group',
        user_id: testUser.id,
      });

      const device1 = await createTestDevice(testUser.id);
      const device2 = await createTestDevice(testUser.id);
      await group.addDevices([device1, device2]);

      const response = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const testGroup = response.body.find(g => g.id === group.id);
      expect(testGroup.device_count).toBe(2);
    });
  });

  describe('GET /api/groups/:id', () => {
    test('should return group with devices', async () => {
      const group = await Group.create({
        name: 'Test Group',
        user_id: testUser.id,
      });

      const device = await createTestDevice(testUser.id, { name: 'Device 1' });
      await group.addDevice(device);

      const response = await request(app)
        .get(`/api/groups/${group.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Test Group');
      expect(response.body).toHaveProperty('devices');
      expect(response.body.devices).toHaveLength(1);
    });

    test('should return 404 for non-existent group', async () => {
      const response = await request(app)
        .get('/api/groups/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/groups/:id', () => {
    test('should update group', async () => {
      const group = await Group.create({
        name: 'Old Name',
        user_id: testUser.id,
      });

      const response = await request(app)
        .put(`/api/groups/${group.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Name', color: '#EF4444' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'New Name');
      expect(response.body).toHaveProperty('color', '#EF4444');
    });
  });

  describe('DELETE /api/groups/:id', () => {
    test('should delete group', async () => {
      const group = await Group.create({
        name: 'Test Group',
        user_id: testUser.id,
      });

      const response = await request(app)
        .delete(`/api/groups/${group.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const deletedGroup = await Group.findByPk(group.id);
      expect(deletedGroup).toBeNull();
    });
  });

  describe('POST /api/groups/:id/devices', () => {
    test('should add device to group', async () => {
      const group = await Group.create({
        name: 'Test Group',
        user_id: testUser.id,
      });

      const device = await createTestDevice(testUser.id);

      const response = await request(app)
        .post(`/api/groups/${group.id}/devices`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ device_id: device.id });

      expect(response.status).toBe(200);

      const deviceGroups = await device.getGroups();
      expect(deviceGroups).toHaveLength(1);
      expect(deviceGroups[0].id).toBe(group.id);
    });

    test('should add multiple devices to group', async () => {
      const group = await Group.create({
        name: 'Test Group',
        user_id: testUser.id,
      });

      const device1 = await createTestDevice(testUser.id);
      const device2 = await createTestDevice(testUser.id);

      const response = await request(app)
        .post(`/api/groups/${group.id}/devices`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ device_ids: [device1.id, device2.id] });

      expect(response.status).toBe(200);

      const groupDevices = await group.getDevices();
      expect(groupDevices).toHaveLength(2);
    });
  });

  describe('DELETE /api/groups/:id/devices/:deviceId', () => {
    test('should remove device from group', async () => {
      const group = await Group.create({
        name: 'Test Group',
        user_id: testUser.id,
      });

      const device = await createTestDevice(testUser.id);
      await group.addDevice(device);

      const response = await request(app)
        .delete(`/api/groups/${group.id}/devices/${device.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const groupDevices = await group.getDevices();
      expect(groupDevices).toHaveLength(0);
    });
  });

  describe('GET /api/devices/:id/groups', () => {
    test('should get all groups for a device', async () => {
      const device = await createTestDevice(testUser.id);

      const group1 = await Group.create({ name: 'Group 1', user_id: testUser.id });
      const group2 = await Group.create({ name: 'Group 2', user_id: testUser.id });

      await device.addGroups([group1, group2]);

      const response = await request(app)
        .get(`/api/devices/${device.id}/groups`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/devices?group_id=:id', () => {
    test('should filter devices by group', async () => {
      const group1 = await Group.create({ name: 'Group 1', user_id: testUser.id });
      const group2 = await Group.create({ name: 'Group 2', user_id: testUser.id });

      const device1 = await createTestDevice(testUser.id, { name: 'Device 1' });
      const device2 = await createTestDevice(testUser.id, { name: 'Device 2' });
      const device3 = await createTestDevice(testUser.id, { name: 'Device 3' });

      await group1.addDevices([device1, device2]);
      await group2.addDevice(device3);

      const response = await request(app)
        .get(`/api/devices?group_id=${group1.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('devices');
      expect(response.body.devices).toHaveLength(2);
    });

    test('should return devices without any group', async () => {
      const group = await Group.create({ name: 'Test Group', user_id: testUser.id });

      const device1 = await createTestDevice(testUser.id);
      const device2 = await createTestDevice(testUser.id);
      const device3 = await createTestDevice(testUser.id);

      await group.addDevice(device1);

      const response = await request(app)
        .get('/api/devices?group_id=null')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('devices');
      expect(response.body.devices).toHaveLength(2);
    });
  });
});
