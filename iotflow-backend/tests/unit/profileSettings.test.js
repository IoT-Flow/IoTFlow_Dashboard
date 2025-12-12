/**
 * TDD Tests: Profile Settings
 *
 * Tests for user profile management:
 * 1. Change name (username)
 * 2. Change email with validation
 * 3. Change password with current password verification
 * 4. Form validation (email format, password strength, current password required)
 */

const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/user');
const { hashPassword, verifyPassword } = require('../../src/utils/password');
const { setupTestDatabase } = require('../helpers');

// Setup database before all tests
beforeAll(async () => {
  await setupTestDatabase();
});

describe('Profile Settings API - TDD', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Clean up users
    await User.destroy({ where: {}, truncate: true });

    // Create test user
    const passwordHash = await hashPassword('OldPassword123!');
    testUser = await User.create({
      username: 'profiletest',
      email: 'profiletest@example.com',
      password_hash: passwordHash,
      is_active: true,
    });

    // Login to get token
    const loginResponse = await request(app).post('/api/auth/login').send({
      username: 'profiletest',
      password: 'OldPassword123!',
    });

    authToken = loginResponse.body.token;
  });

  describe('RED Phase: Change Username', () => {
    it('should update username with valid data', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'newusername',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'newusername');
      expect(response.body).not.toHaveProperty('password_hash');

      // Verify in database
      const updated = await User.findByPk(testUser.id);
      expect(updated.username).toBe('newusername');
    });

    it('should reject duplicate username', async () => {
      // Create another user first
      const otherUser = await User.create({
        username: 'existinguser',
        email: 'existing@example.com',
        password_hash: await hashPassword('Password123!'),
        is_active: true,
      });

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'existinguser',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/already exists|duplicate|taken/i);

      // Cleanup
      await User.destroy({ where: { id: otherUser.id } });
    });

    it('should reject empty username', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: '',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('RED Phase: Change Email', () => {
    it('should update email with valid format', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newemail@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'newemail@example.com');

      // Verify in database
      const updated = await User.findByPk(testUser.id);
      expect(updated.email).toBe('newemail@example.com');
    });

    it('should reject invalid email format', async () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
      ];

      for (const invalidEmail of invalidEmails) {
        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            email: invalidEmail,
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      }
    });

    it('should reject duplicate email', async () => {
      // Create another user first
      const otherUser = await User.create({
        username: 'emailuser',
        email: 'taken@example.com',
        password_hash: await hashPassword('Password123!'),
        is_active: true,
      });

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'taken@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/already exists|duplicate|taken/i);

      // Cleanup
      await User.destroy({ where: { id: otherUser.id } });
    });
  });

  describe('RED Phase: Change Password', () => {
    it('should change password with valid current password', async () => {
      // Reset user password to known value
      await User.update(
        { password_hash: await hashPassword('CurrentPass123!') },
        { where: { id: testUser.id } }
      );

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'CurrentPass123!',
          newPassword: 'NewSecurePass456!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/password.*changed/i);

      // Verify new password works
      const updated = await User.findByPk(testUser.id);
      const isValid = await verifyPassword('NewSecurePass456!', updated.password_hash);
      expect(isValid).toBe(true);

      // Verify old password doesn't work
      const oldValid = await verifyPassword('CurrentPass123!', updated.password_hash);
      expect(oldValid).toBe(false);
    });

    it('should reject incorrect current password', async () => {
      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword!',
          newPassword: 'NewSecurePass456!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/current password.*incorrect|invalid/i);
    });

    it('should reject weak passwords', async () => {
      const weakPasswords = ['123', 'password', 'abc', '12345'];

      for (const weakPass of weakPasswords) {
        const response = await request(app)
          .put('/api/users/password')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currentPassword: 'NewSecurePass456!',
            newPassword: weakPass,
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toMatch(/password.*weak|too short|at least 8 characters/i);
      }
    });

    it('should require minimum password length (8 characters)', async () => {
      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'NewSecurePass456!',
          newPassword: 'Short1!',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/at least 8 characters/i);
    });

    it('should require current password', async () => {
      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newPassword: 'NewSecurePass456!',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/current password.*required/i);
    });

    it('should not allow same password as current', async () => {
      // First, set a known password
      await User.update(
        { password_hash: await hashPassword('KnownPassword123!') },
        { where: { id: testUser.id } }
      );

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'KnownPassword123!',
          newPassword: 'KnownPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/new password.*same|different/i);
    });
  });

  describe('RED Phase: Authorization', () => {
    it('should require authentication', async () => {
      const response = await request(app).put('/api/users/profile').send({
        username: 'newname',
      });

      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', 'Bearer invalid_token')
        .send({
          username: 'newname',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('RED Phase: Combined Updates', () => {
    it('should update multiple fields at once (username and email)', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'combinedtest',
          email: 'combined@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'combinedtest');
      expect(response.body).toHaveProperty('email', 'combined@example.com');
    });

    it('should not allow password change through profile endpoint', async () => {
      // Password changes should only go through dedicated password endpoint
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'test',
          password: 'ShouldNotWork123!',
        });

      // Should reject password field
      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/password.*endpoint/i);
    });
  });
});
