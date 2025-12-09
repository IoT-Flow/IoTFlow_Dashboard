/**
 * Test Helper Functions
 * Shared utilities for testing
 */

const { sequelize } = require('../src/utils/db');
const User = require('../src/models/user');
const Device = require('../src/models/device');
const bcrypt = require('bcryptjs');

/**
 * Setup test database
 */
async function setupTestDatabase() {
  try {
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

/**
 * Cleanup test database
 */
async function cleanupTestDatabase() {
  try {
    // Don't close connection, just truncate tables
    await User.destroy({ where: {}, truncate: true, cascade: true });
    await Device.destroy({ where: {}, truncate: true, cascade: true });
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error);
  }
}

/**
 * Close database connection (call once at the end of all tests)
 */
async function closeDatabase() {
  try {
    await sequelize.close();
  } catch (error) {
    console.error('❌ Database close failed:', error);
  }
}

/**
 * Create a test user
 */
async function createTestUser(overrides = {}) {
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password_hash: await bcrypt.hash('password123', 10),
    is_active: true,
    is_admin: false,
  };

  const user = await User.create({ ...defaultUser, ...overrides });
  return user;
}

/**
 * Create a test admin user
 */
async function createTestAdmin(overrides = {}) {
  return createTestUser({
    username: 'adminuser',
    email: 'admin@example.com',
    is_admin: true,
    ...overrides,
  });
}

/**
 * Create a test device
 */
async function createTestDevice(userId, overrides = {}) {
  const defaultDevice = {
    name: 'Test Device',
    description: 'Test device for unit tests',
    device_type: 'sensor',
    user_id: userId,
    // Don't set status - let model default take effect
  };

  const device = await Device.create({ ...defaultDevice, ...overrides });
  return device;
}

/**
 * Create multiple test devices
 */
async function createMultipleDevices(userId, count = 3) {
  const devices = [];
  for (let i = 0; i < count; i++) {
    const device = await createTestDevice(userId, {
      name: `Test Device ${i + 1}`,
      device_type: i % 2 === 0 ? 'sensor' : 'actuator',
      status: i < 2 ? 'active' : 'inactive',
    });
    devices.push(device);
  }
  return devices;
}

/**
 * Generate JWT token for testing
 */
function generateTestToken(userId) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: userId, username: 'testuser' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );
}

module.exports = {
  setupTestDatabase,
  cleanupTestDatabase,
  closeDatabase,
  createTestUser,
  createTestAdmin,
  createTestDevice,
  createMultipleDevices,
  generateTestToken,
};
