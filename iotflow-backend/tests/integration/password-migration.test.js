/**
 * Password Migration Integration Tests
 * Tests the complete password hashing migration from bcrypt to PBKDF2-SHA256
 *
 * Test scenarios:
 * 1. New user registration uses PBKDF2-SHA256
 * 2. Existing bcrypt users can still log in
 * 3. bcrypt passwords are automatically upgraded on login
 * 4. Password updates use PBKDF2-SHA256
 * 5. Admin-created users use PBKDF2-SHA256
 */

const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/utils/db');
const User = require('../../src/models/user');
const bcrypt = require('bcrypt');
const { hashPassword, verifyPassword, needsRehash } = require('../../src/utils/password');

describe('Password Migration Integration Tests', () => {
  let testUser;
  let adminToken;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear users before each test
    await User.destroy({ where: {}, truncate: true });
  });

  describe('New User Registration (PBKDF2-SHA256)', () => {
    test('should create new user with PBKDF2-SHA256 hash', async () => {
      const response = await request(app).post('/api/users/register').send({
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();

      // Verify password hash format in database
      const user = await User.findOne({ where: { username: 'newuser' } });
      expect(user.password_hash).toMatch(/^pbkdf2_sha256\$/);
      expect(needsRehash(user.password_hash)).toBe(false);
    });

    test('should be able to login immediately after registration', async () => {
      // Register
      await request(app).post('/api/users/register').send({
        username: 'testuser',
        email: 'testuser@test.com',
        password: 'mypassword',
      });

      // Login
      const response = await request(app).post('/api/users/login').send({
        email: 'testuser@test.com',
        password: 'mypassword',
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('testuser@test.com');
    });
  });

  describe('bcrypt Migration on Login', () => {
    test('should login with existing bcrypt password', async () => {
      // Create user with bcrypt hash (simulating existing user)
      const bcryptHash = await bcrypt.hash('oldpassword', 10);
      await User.create({
        username: 'legacyuser',
        email: 'legacy@test.com',
        password_hash: bcryptHash,
      });

      // Verify it's a bcrypt hash
      const userBefore = await User.findOne({ where: { username: 'legacyuser' } });
      expect(userBefore.password_hash).toMatch(/^\$2[aby]\$/);
      expect(needsRehash(userBefore.password_hash)).toBe(true);

      // Login should succeed
      const response = await request(app).post('/api/users/login').send({
        email: 'legacy@test.com',
        password: 'oldpassword',
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    test('should automatically upgrade bcrypt to PBKDF2 on login', async () => {
      // Create user with bcrypt hash
      const bcryptHash = await bcrypt.hash('upgradepassword', 10);
      await User.create({
        username: 'upgradeuser',
        email: 'upgrade@test.com',
        password_hash: bcryptHash,
      });

      // Verify it starts as bcrypt
      const userBefore = await User.findOne({ where: { username: 'upgradeuser' } });
      expect(userBefore.password_hash).toMatch(/^\$2[aby]\$/);

      // Login (triggers migration)
      const response = await request(app).post('/api/users/login').send({
        email: 'upgrade@test.com',
        password: 'upgradepassword',
      });

      expect(response.status).toBe(200);

      // Verify password was upgraded to PBKDF2
      const userAfter = await User.findOne({ where: { username: 'upgradeuser' } });
      expect(userAfter.password_hash).toMatch(/^pbkdf2_sha256\$/);
      expect(needsRehash(userAfter.password_hash)).toBe(false);

      // Verify new hash still works
      const isValid = await verifyPassword('upgradepassword', userAfter.password_hash);
      expect(isValid).toBe(true);
    });

    test('should still reject wrong password for bcrypt user', async () => {
      // Create user with bcrypt hash
      const bcryptHash = await bcrypt.hash('correctpassword', 10);
      await User.create({
        username: 'bcryptuser',
        email: 'bcrypt@test.com',
        password_hash: bcryptHash,
      });

      // Try to login with wrong password
      const response = await request(app).post('/api/users/login').send({
        email: 'bcrypt@test.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('Password Update (PBKDF2-SHA256)', () => {
    test('should update password with PBKDF2-SHA256', async () => {
      // Create admin user for authentication
      const adminHash = await hashPassword('adminpass');
      const admin = await User.create({
        username: 'admin',
        email: 'admin@test.com',
        password_hash: adminHash,
        is_admin: true,
      });

      // Login as admin to get token
      const loginResponse = await request(app).post('/api/users/login').send({
        email: 'admin@test.com',
        password: 'adminpass',
      });

      const token = loginResponse.body.token;

      // Create regular user
      const userHash = await hashPassword('oldpass');
      const user = await User.create({
        username: 'regularuser',
        email: 'regular@test.com',
        password_hash: userHash,
      });

      // Update password (using admin endpoint)
      const response = await request(app)
        .put(`/api/v1/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          password: 'newpassword123',
        });

      expect(response.status).toBe(200);

      // Verify new password is PBKDF2
      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser.password_hash).toMatch(/^pbkdf2_sha256\$/);
      expect(needsRehash(updatedUser.password_hash)).toBe(false);

      // Verify new password works
      const isValid = await verifyPassword('newpassword123', updatedUser.password_hash);
      expect(isValid).toBe(true);

      // Verify old password doesn't work
      const isOldValid = await verifyPassword('oldpass', updatedUser.password_hash);
      expect(isOldValid).toBe(false);
    });
  });

  describe('Admin User Creation (PBKDF2-SHA256)', () => {
    test('should create user via admin endpoint with PBKDF2-SHA256', async () => {
      // Create admin user
      const adminHash = await hashPassword('adminpass');
      const admin = await User.create({
        username: 'admin',
        email: 'admin@test.com',
        password_hash: adminHash,
        is_admin: true,
      });

      // Login as admin
      const loginResponse = await request(app).post('/api/users/login').send({
        email: 'admin@test.com',
        password: 'adminpass',
      });

      const token = loginResponse.body.token;

      // Create user via admin endpoint
      const response = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'admincreatduser',
          email: 'admincreated@test.com',
          password: 'userpassword',
          is_admin: false,
        });

      expect(response.status).toBe(201);

      // Verify password is PBKDF2
      const newUser = await User.findOne({ where: { username: 'admincreatduser' } });
      expect(newUser.password_hash).toMatch(/^pbkdf2_sha256\$/);
      expect(needsRehash(newUser.password_hash)).toBe(false);
    });
  });

  describe('Mixed Hash Format Support', () => {
    test('should support both bcrypt and PBKDF2 users simultaneously', async () => {
      // Create one bcrypt user
      const bcryptHash = await bcrypt.hash('bcryptpass', 10);
      await User.create({
        username: 'bcryptuser',
        email: 'bcrypt@test.com',
        password_hash: bcryptHash,
      });

      // Create one PBKDF2 user
      const pbkdf2Hash = await hashPassword('pbkdf2pass');
      await User.create({
        username: 'pbkdf2user',
        email: 'pbkdf2@test.com',
        password_hash: pbkdf2Hash,
      });

      // Both should be able to login
      const bcryptLogin = await request(app).post('/api/users/login').send({
        email: 'bcrypt@test.com',
        password: 'bcryptpass',
      });

      const pbkdf2Login = await request(app).post('/api/users/login').send({
        email: 'pbkdf2@test.com',
        password: 'pbkdf2pass',
      });

      expect(bcryptLogin.status).toBe(200);
      expect(pbkdf2Login.status).toBe(200);
    });
  });

  describe('Security Validation', () => {
    test('should use 210,000+ iterations for new passwords', async () => {
      const response = await request(app).post('/api/users/register').send({
        username: 'secureuser',
        email: 'secure@test.com',
        password: 'securepass123',
      });

      expect(response.status).toBe(201);

      const user = await User.findOne({ where: { username: 'secureuser' } });
      const parts = user.password_hash.split('$');
      const iterations = parseInt(parts[1]);

      expect(iterations).toBeGreaterThanOrEqual(210000);
    });

    test('should generate unique salts for same password', async () => {
      // Create two users with same password
      await request(app).post('/api/users/register').send({
        username: 'user1',
        email: 'user1@test.com',
        password: 'samepassword',
      });

      await request(app).post('/api/users/register').send({
        username: 'user2',
        email: 'user2@test.com',
        password: 'samepassword',
      });

      const user1 = await User.findOne({ where: { username: 'user1' } });
      const user2 = await User.findOne({ where: { username: 'user2' } });

      // Hashes should be different (different salts)
      expect(user1.password_hash).not.toBe(user2.password_hash);

      // Both should verify correctly
      const isValid1 = await verifyPassword('samepassword', user1.password_hash);
      const isValid2 = await verifyPassword('samepassword', user2.password_hash);
      expect(isValid1).toBe(true);
      expect(isValid2).toBe(true);
    });
  });
});
