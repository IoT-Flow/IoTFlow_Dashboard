/**
 * Integration Tests for User API Endpoints
 * Testing user registration, login, and profile management
 */

const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/user');
const bcrypt = require('bcrypt');
const { setupTestDatabase, createTestUser, generateTestToken } = require('../helpers');

// Setup database once for all tests
beforeAll(async () => {
  await setupTestDatabase();
});

describe('User API Integration Tests', () => {
  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true });
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/api/auth/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('username', 'newuser');
      expect(response.body.user).toHaveProperty('email', 'newuser@example.com');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    test('should not register user with duplicate email', async () => {
      await createTestUser({ email: 'duplicate@example.com' });

      const userData = {
        username: 'newuser',
        email: 'duplicate@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/api/auth/register').send(userData);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message');
    });

    test('should not register user with duplicate username', async () => {
      await createTestUser({ username: 'duplicate' });

      const userData = {
        username: 'duplicate',
        email: 'newemail@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/api/auth/register').send(userData);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message');
    });

    test('should hash password before storing', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      await request(app).post('/api/auth/register').send(userData);

      const user = await User.findOne({ where: { email: 'test@example.com' } });
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe('password123');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;
    const testPassword = 'password123';

    beforeEach(async () => {
      const password_hash = await bcrypt.hash(testPassword, 10);
      testUser = await createTestUser({
        username: 'loginuser',
        email: 'login@example.com',
        password_hash,
      });
    });

    test('should login with email', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: testPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'login@example.com');
    });

    test('should login with username', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'loginuser',
        password: testPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
    });

    test('should fail with wrong password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    test('should fail with non-existent user', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: testPassword,
      });

      expect(response.status).toBe(401);
    });

    test('should require email/username', async () => {
      const response = await request(app).post('/api/auth/login').send({
        password: testPassword,
      });

      expect(response.status).toBe(400);
    });

    test('should require password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
      });

      expect(response.status).toBe(400);
    });

    test('should update last_login on successful login', async () => {
      const beforeLogin = testUser.last_login;

      await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: testPassword,
      });

      await testUser.reload();
      expect(testUser.last_login).not.toBe(beforeLogin);
      expect(testUser.last_login).toBeDefined();
    });
  });

  describe('GET /api/users/profile', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await createTestUser();
      authToken = generateTestToken(testUser.id);
    });

    test('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', testUser.username);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).not.toHaveProperty('password_hash');
    });

    test('should fail without token', async () => {
      const response = await request(app).get('/api/users/profile');

      expect(response.status).toBe(401);
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      testUser = await createTestUser();
      authToken = generateTestToken(testUser.id);
    });

    test('should update user profile', async () => {
      const updateData = {
        username: 'updateduser',
        email: 'updated@example.com',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'updateduser');
      expect(response.body).toHaveProperty('email', 'updated@example.com');
    });

    test('should fail without authentication', async () => {
      const response = await request(app).put('/api/users/profile').send({ username: 'updated' });

      expect(response.status).toBe(401);
    });
  });
});
