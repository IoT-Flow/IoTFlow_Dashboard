const request = require('supertest');
const app = require('../../src/app');
const { Device, User } = require('../../src/models');

let adminToken, userToken, testUser1, testUser2;

beforeAll(async () => {
  // Create users
  testUser1 = await User.create({ username: 'user1', password: 'pass123', is_admin: false });
  testUser2 = await User.create({ username: 'user2', password: 'pass456', is_admin: false });
  const admin = await User.create({ username: 'admin', password: 'adminpass', is_admin: true });
  
  // Get tokens (you'll need to implement proper login to get real tokens)
  const userLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({ username: 'user1', password: 'pass123' });
  userToken = userLoginResponse.body.token;
  
  const adminLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'adminpass' });
  adminToken = adminLoginResponse.body.token;
});

describe('Admin Device List', () => {
  beforeAll(async () => {
    // Create devices for different users
    await Device.bulkCreate([
      { name: 'User1 Device 1', device_type: 'Sensor', user_id: testUser1.id, status: 'online' },
      { name: 'User1 Device 2', device_type: 'Actuator', user_id: testUser1.id, status: 'offline' },
      { name: 'User2 Device 1', device_type: 'Gateway', user_id: testUser2.id, status: 'online' },
    ]);
  });

  test('admin can list all devices from all users', async () => {
    const response = await request(app)
      .get('/api/admin/devices')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('devices');
    expect(Array.isArray(response.body.devices)).toBe(true);
    expect(response.body.devices.length).toBeGreaterThanOrEqual(3);
    
    // Check that devices from different users are included
    const userIds = response.body.devices.map(d => d.user_id);
    expect(userIds).toContain(testUser1.id);
    expect(userIds).toContain(testUser2.id);
    
    // Check device properties
    expect(response.body.devices[0]).toHaveProperty('name');
    expect(response.body.devices[0]).toHaveProperty('device_type');
    expect(response.body.devices[0]).toHaveProperty('user_id');
  });

  test('regular user cannot access admin device list', async () => {
    const response = await request(app)
      .get('/api/admin/devices')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(403);
  });

  test('unauthenticated user cannot access admin device list', async () => {
    const response = await request(app)
      .get('/api/admin/devices');
    
    expect(response.status).toBe(401);
  });
});
