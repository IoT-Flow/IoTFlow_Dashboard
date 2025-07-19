const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/utils/db');
const User = require('../src/models/user');

describe('User API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('username', 'testuser');
    expect(res.body).toHaveProperty('email', 'test@example.com');
    expect(res.body).toHaveProperty('user_id');
    expect(res.body).toHaveProperty('api_key');
  });

  it('should get a user by ID', async () => {
    // First create a user
    const user = await User.create({
      username: 'testuser2',
      email: 'test2@example.com',
      password_hash: 'hashedpassword123',
    });

    const res = await request(app)
      .get(`/api/users/${user.id}`)
      .set('x-api-key', user.api_key);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('username', 'testuser2');
  });
});
