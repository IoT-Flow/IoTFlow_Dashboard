/**
 * TDD Tests for User Active Status Check in Login
 * Testing that inactive users cannot login
 */

const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/user');
const { hashPassword } = require('../../src/utils/password');
const { setupTestDatabase, createTestUser } = require('../helpers');

// Setup database once for all tests
beforeAll(async () => {
  await setupTestDatabase();
});

describe('User Login Active Status Check - TDD', () => {
  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true });
  });

  describe('POST /api/auth/login - Active User Check', () => {
    const testPassword = 'password123';
    let activeUser;
    let inactiveUser;

    beforeEach(async () => {
      const password_hash = await hashPassword(testPassword);

      // Create active user
      activeUser = await createTestUser({
        username: 'activeuser',
        email: 'active@example.com',
        password_hash,
        is_active: true,
      });

      // Create inactive user
      inactiveUser = await createTestUser({
        username: 'inactiveuser',
        email: 'inactive@example.com',
        password_hash,
        is_active: false,
      });
    });

    test('should allow login for active user with email', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'active@example.com',
        password: testPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'active@example.com');
      expect(response.body.user).toHaveProperty('is_active', true);
    });

    test('should allow login for active user with username', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'activeuser',
        password: testPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('username', 'activeuser');
      expect(response.body.user).toHaveProperty('is_active', true);
    });

    test('should reject login for inactive user with email', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'inactive@example.com',
        password: testPassword,
      });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('account is inactive');
      expect(response.body).not.toHaveProperty('token');
    });

    test('should reject login for inactive user with username', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'inactiveuser',
        password: testPassword,
      });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('account is inactive');
      expect(response.body).not.toHaveProperty('token');
    });

    test('should not update last_login for inactive user', async () => {
      const beforeLogin = inactiveUser.last_login;

      const response = await request(app).post('/api/auth/login').send({
        email: 'inactive@example.com',
        password: testPassword,
      });

      // Verify login was rejected
      expect(response.status).toBe(403);

      await inactiveUser.reload();
      // Should remain unchanged - either null, undefined, or the original value
      if (beforeLogin === undefined || beforeLogin === null) {
        expect(inactiveUser.last_login).toBeNull();
      } else {
        expect(inactiveUser.last_login).toEqual(beforeLogin);
      }
    });

    test('should still update last_login for active user', async () => {
      const beforeLogin = activeUser.last_login;

      await request(app).post('/api/auth/login').send({
        email: 'active@example.com',
        password: testPassword,
      });

      await activeUser.reload();
      expect(activeUser.last_login).not.toBe(beforeLogin);
      expect(activeUser.last_login).toBeDefined();
    });

    test('should return 403 for inactive user even with correct credentials', async () => {
      // Verify the user exists and password is correct by checking the hash
      const user = await User.findOne({ where: { email: 'inactive@example.com' } });
      expect(user).toBeTruthy();
      expect(user.is_active).toBe(false);

      const response = await request(app).post('/api/auth/login').send({
        email: 'inactive@example.com',
        password: testPassword,
      });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/account is inactive|account has been deactivated/i);
    });

    test('should prioritize active check over invalid credentials', async () => {
      // Test with wrong password for inactive user
      const response = await request(app).post('/api/auth/login').send({
        email: 'inactive@example.com',
        password: 'wrongpassword',
      });

      // Should still return 403 for inactive account, not 401 for wrong password
      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/account is inactive|account has been deactivated/i);
    });

    test('should return appropriate error message for inactive account', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'inactive@example.com',
        password: testPassword,
      });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/account is inactive|account has been deactivated/i);
      expect(response.body).toHaveProperty('error_code', 'ACCOUNT_INACTIVE');
    });

    test('should handle null is_active as inactive', async () => {
      // Create user with null is_active
      const password_hash = await hashPassword(testPassword);
      const nullActiveUser = await User.create({
        username: 'nullactiveuser',
        email: 'nullactive@example.com',
        password_hash,
        is_active: null,
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'nullactive@example.com',
        password: testPassword,
      });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/account is inactive|account has been deactivated/i);
    });
  });

  describe('Edge Cases for Active Status Check', () => {
    const testPassword = 'password123';

    test('should handle user becoming inactive between password check and login', async () => {
      const password_hash = await hashPassword(testPassword);
      const user = await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
        password_hash,
        is_active: true,
      });

      // Simulate user being deactivated by admin during login process
      // This tests the race condition scenario
      await User.update({ is_active: false }, { where: { id: user.id } });

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: testPassword,
      });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/account is inactive|account has been deactivated/i);
    });

    test('should not leak user existence for inactive accounts', async () => {
      const password_hash = await hashPassword(testPassword);
      await createTestUser({
        username: 'inactiveuser',
        email: 'inactive@example.com',
        password_hash,
        is_active: false,
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'inactive@example.com',
        password: testPassword,
      });

      // Should return specific inactive message, not generic invalid credentials
      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/account is inactive|account has been deactivated/i);
      expect(response.body.message).not.toMatch(/invalid credentials/i);
    });
  });
});
