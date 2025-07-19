const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/utils/db');

describe('IoTFlow API Tests', () => {
  let userApiKey;
  let deviceId;
  let authToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Authentication APIs', () => {
    test('POST /api/auth/register - Register new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('username', 'testuser');
      expect(res.body).toHaveProperty('api_key');
      userApiKey = res.body.api_key;
    });

    test('POST /api/auth/login - Login user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      authToken = res.body.token;
    });

    test('GET /api/auth/profile - Get user profile', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('x-api-key', userApiKey);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('username', 'testuser');
      expect(res.body).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('Device Management APIs', () => {
    test('POST /api/devices - Create device', async () => {
      const res = await request(app)
        .post('/api/devices')
        .set('x-api-key', userApiKey)
        .send({
          name: 'Test Sensor',
          description: 'A test sensor device',
          device_type: 'sensor',
          status: 'online',
          location: 'Test Room'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('name', 'Test Sensor');
      expect(res.body).toHaveProperty('device_type', 'sensor');
      deviceId = res.body.id;
    });

    test('GET /api/devices - Get all devices', async () => {
      const res = await request(app)
        .get('/api/devices')
        .set('x-api-key', userApiKey);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('devices');
      expect(res.body.devices).toHaveLength(1);
      expect(res.body).toHaveProperty('total', 1);
    });

    test('GET /api/devices/:id - Get device by ID', async () => {
      const res = await request(app)
        .get(`/api/devices/${deviceId}`)
        .set('x-api-key', userApiKey);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', 'Test Sensor');
      expect(res.body).toHaveProperty('id', deviceId);
    });

    test('PUT /api/devices/:id - Update device', async () => {
      const res = await request(app)
        .put(`/api/devices/${deviceId}`)
        .set('x-api-key', userApiKey)
        .send({
          name: 'Updated Test Sensor',
          status: 'offline'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Test Sensor');
      expect(res.body).toHaveProperty('status', 'offline');
    });

    test('PATCH /api/devices/:id/status - Update device status', async () => {
      const res = await request(app)
        .patch(`/api/devices/${deviceId}/status`)
        .set('x-api-key', userApiKey)
        .send({
          status: 'online'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'online');
    });
  });

  describe('Telemetry APIs', () => {
    test('POST /api/telemetry - Submit telemetry data', async () => {
      const res = await request(app)
        .post('/api/telemetry')
        .set('x-api-key', userApiKey)
        .send({
          device_id: deviceId,
          data_type: 'temperature',
          value: 25.5,
          unit: '°C'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('device_id', deviceId);
      expect(res.body).toHaveProperty('data_type', 'temperature');
      expect(res.body).toHaveProperty('value', 25.5);
    });

    test('GET /api/telemetry/device/:id/latest - Get latest telemetry', async () => {
      const res = await request(app)
        .get(`/api/telemetry/device/${deviceId}/latest`)
        .set('x-api-key', userApiKey);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty('data_type', 'temperature');
      expect(res.body[0]).toHaveProperty('value', 25.5);
    });

    test('GET /api/telemetry/device/:id - Get telemetry data', async () => {
      const res = await request(app)
        .get(`/api/telemetry/device/${deviceId}`)
        .set('x-api-key', userApiKey);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveLength(1);
      expect(res.body).toHaveProperty('total', 1);
    });
  });

  describe('Dashboard APIs', () => {
    test('GET /api/dashboard/overview - Get dashboard overview', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('x-api-key', userApiKey);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('totalDevices', 1);
      expect(res.body).toHaveProperty('deviceStats');
      expect(res.body).toHaveProperty('deviceTypes');
      expect(res.body).toHaveProperty('recentDevices');
    });

    test('GET /api/dashboard/health - Get system health', async () => {
      const res = await request(app)
        .get('/api/dashboard/health')
        .set('x-api-key', userApiKey);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('totalDevices', 1);
      expect(res.body).toHaveProperty('onlineDevices');
      expect(res.body).toHaveProperty('healthPercentage');
    });

    test('GET /api/dashboard/alerts - Get alerts', async () => {
      const res = await request(app)
        .get('/api/dashboard/alerts')
        .set('x-api-key', userApiKey);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Device Configuration APIs', () => {
    test('PUT /api/devices/:id/configurations - Update device configuration', async () => {
      const res = await request(app)
        .put(`/api/devices/${deviceId}/configurations`)
        .set('x-api-key', userApiKey)
        .send({
          config_key: 'sampling_rate',
          config_value: '10',
          data_type: 'integer'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('config_key', 'sampling_rate');
      expect(res.body).toHaveProperty('config_value', '10');
    });

    test('GET /api/devices/:id/configurations - Get device configurations', async () => {
      const res = await request(app)
        .get(`/api/devices/${deviceId}/configurations`)
        .set('x-api-key', userApiKey);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty('config_key', 'sampling_rate');
    });
  });

  describe('Health Check', () => {
    test('GET /health - Health check endpoint', async () => {
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('timestamp');
    });
  });
});
