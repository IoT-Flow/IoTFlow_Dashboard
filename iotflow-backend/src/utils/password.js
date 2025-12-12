/**
 * Password Utilities - PBKDF2-SHA256
 * Secure password hashing using PBKDF2 with SHA-256
 *
 * Format: pbkdf2_sha256$iterations$salt$hash
 *
 * OWASP Recommendations (2023):
 * - Use PBKDF2 with at least 100,000 iterations for SHA-256
 * - Use a unique random salt for each password (32 bytes minimum)
 * - Use a 32-byte (256-bit) derived key length
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');

// PBKDF2 Configuration (OWASP 2023 recommendations)
const PBKDF2_ITERATIONS = 210000; // OWASP 2023 recommendation for PBKDF2-SHA256
const PBKDF2_KEYLEN = 32; // 256 bits
const PBKDF2_DIGEST = 'sha256';
const SALT_LENGTH = 32; // 256 bits

/**
 * Hash a password using PBKDF2-SHA256
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password in format: pbkdf2_sha256$iterations$salt$hash
 */
async function hashPassword(password) {
  // Input validation
  if (typeof password !== 'string') {
    throw new Error('Password must be a string');
  }

  if (password.length === 0) {
    throw new Error('Password cannot be empty');
  }

  return new Promise((resolve, reject) => {
    // Generate random salt
    crypto.randomBytes(SALT_LENGTH, (err, saltBuffer) => {
      if (err) {
        return reject(err);
      }

      const saltBase64 = saltBuffer.toString('base64');

      // Derive key using PBKDF2 (use the Buffer, not base64 string)
      crypto.pbkdf2(
        password,
        saltBuffer,
        PBKDF2_ITERATIONS,
        PBKDF2_KEYLEN,
        PBKDF2_DIGEST,
        (err, derivedKey) => {
          if (err) {
            return reject(err);
          }

          const hash = derivedKey.toString('base64');
          const hashedPassword = `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${saltBase64}$${hash}`;
          resolve(hashedPassword);
        }
      );
    });
  });
}

/**
 * Verify a password against a hash
 * Supports both PBKDF2-SHA256 and bcrypt (for migration)
 * @param {string} password - Plain text password to verify
 * @param {string} hashedPassword - Hashed password to verify against
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(password, hashedPassword) {
  // Input validation
  if (!password || typeof password !== 'string') {
    return false;
  }

  if (!hashedPassword || typeof hashedPassword !== 'string') {
    return false;
  }

  try {
    // Check if it's a PBKDF2 hash
    if (hashedPassword.startsWith('pbkdf2_sha256$')) {
      return await verifyPBKDF2(password, hashedPassword);
    }

    // Check if it's a bcrypt hash (for migration compatibility)
    if (
      hashedPassword.startsWith('$2b$') ||
      hashedPassword.startsWith('$2a$') ||
      hashedPassword.startsWith('$2y$')
    ) {
      return await bcrypt.compare(password, hashedPassword);
    }

    // Unknown hash format
    return false;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Verify PBKDF2-SHA256 hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - PBKDF2 hashed password
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPBKDF2(password, hashedPassword) {
  return new Promise((resolve, reject) => {
    try {
      // Parse hash format: pbkdf2_sha256$iterations$salt$hash
      const parts = hashedPassword.split('$');

      if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') {
        return resolve(false);
      }

      const iterations = parseInt(parts[1]);
      const saltBase64 = parts[2];
      const originalHashBase64 = parts[3];

      // Validate iterations
      if (isNaN(iterations) || iterations <= 0) {
        return resolve(false);
      }

      // Decode base64 salt to Buffer (matching Python implementation)
      const salt = Buffer.from(saltBase64, 'base64');

      // Derive key with same parameters
      crypto.pbkdf2(password, salt, iterations, PBKDF2_KEYLEN, PBKDF2_DIGEST, (err, derivedKey) => {
        if (err) {
          return reject(err);
        }

        const computedHash = derivedKey.toString('base64');

        // Constant-time comparison to prevent timing attacks
        const isMatch = crypto.timingSafeEqual(
          Buffer.from(originalHashBase64, 'base64'),
          derivedKey
        );

        resolve(isMatch);
      });
    } catch (error) {
      resolve(false);
    }
  });
}

/**
 * Check if a password hash needs to be rehashed
 * Returns true if:
 * - Hash is not PBKDF2-SHA256
 * - Hash uses outdated number of iterations
 * - Hash is malformed
 *
 * @param {string} hashedPassword - Password hash to check
 * @returns {boolean} True if hash needs to be regenerated
 */
function needsRehash(hashedPassword) {
  if (!hashedPassword || typeof hashedPassword !== 'string') {
    return true;
  }

  // Check if it's bcrypt (needs migration to PBKDF2)
  if (
    hashedPassword.startsWith('$2b$') ||
    hashedPassword.startsWith('$2a$') ||
    hashedPassword.startsWith('$2y$')
  ) {
    return true;
  }

  // Check if it's PBKDF2
  if (!hashedPassword.startsWith('pbkdf2_sha256$')) {
    return true;
  }

  try {
    const parts = hashedPassword.split('$');

    if (parts.length !== 4) {
      return true;
    }

    const iterations = parseInt(parts[1]);

    // Need rehash if iterations are less than current recommended
    if (isNaN(iterations) || iterations < PBKDF2_ITERATIONS) {
      return true;
    }

    return false;
  } catch (error) {
    return true;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  needsRehash,
  PBKDF2_ITERATIONS,
  PBKDF2_KEYLEN,
  PBKDF2_DIGEST,
};
