const request = require('supertest');
const app = require('../../src/app');
const { Device, User } = require('../../src/models');

let userToken, adminToken, testDevice;

beforeAll(async () => {
  // Create user and admin
  const user = await User.create({ username: 'user1', password: 'pass', is_admin: false });
  const admin = await User.create({ username: 'admin1', password: 'pass', is_admin: true });
  // Simulate login to get tokens (replace with your actual login logic)
  userToken = 'user-test-token';
  adminToken = 'admin-test-token';
  // Create device for user
  testDevice = await Device.create({ name: 'DeleteMe', type: 'Sensor', user_id: user.id });
});

describe('Device Deletion', () => {
  test('user can delete own device', async () => {
    const response = await request(app)
      .delete(`/api/devices/${testDevice.id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 204]).toContain(response.status);
    // Optionally check device is gone
    const device = await Device.findByPk(testDevice.id);
    expect(device).toBeNull();
  });

  test('admin can delete any device', async () => {
    // Create another device
    const device = await Device.create({ name: 'AdminDelete', type: 'Sensor', user_id: 999 });
    const response = await request(app)
      .delete(`/api/admin/devices/${device.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 204]).toContain(response.status);
    const deleted = await Device.findByPk(device.id);
    expect(deleted).toBeNull();
  });

  test('cannot delete non-existent device', async () => {
    const response = await request(app)
      .delete('/api/devices/999999')
      .set('Authorization', `Bearer ${userToken}`);
    expect([404, 400]).toContain(response.status);
  });
});
