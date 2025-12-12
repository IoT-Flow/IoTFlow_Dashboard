/**
 * Password Utilities Tests (TDD)
 * Testing PBKDF2-SHA256 password hashing and verification
 */

const {
  hashPassword,
  verifyPassword,
  needsRehash,
  PBKDF2_ITERATIONS,
  PBKDF2_KEYLEN,
  PBKDF2_DIGEST,
} = require('../../src/utils/password');

describe('Password Utilities - PBKDF2-SHA256 (TDD)', () => {
  const testPassword = 'SecurePassword123!';
  const weakPassword = 'pass';
  const longPassword = 'a'.repeat(200);

  describe('hashPassword', () => {
    it('should hash a password using PBKDF2-SHA256', async () => {
      const hash = await hashPassword(testPassword);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(testPassword);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should return hash in pbkdf2_sha256 format', async () => {
      const hash = await hashPassword(testPassword);

      // Format: pbkdf2_sha256$iterations$salt$hash
      expect(hash).toMatch(/^pbkdf2_sha256\$\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    });

    it('should use correct number of iterations', async () => {
      const hash = await hashPassword(testPassword);
      const parts = hash.split('$');

      expect(parseInt(parts[1])).toBe(PBKDF2_ITERATIONS);
      expect(parseInt(parts[1])).toBeGreaterThanOrEqual(100000); // OWASP recommendation
    });

    it('should generate unique hashes for same password (different salts)', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate unique salts', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);

      const salt1 = hash1.split('$')[2];
      const salt2 = hash2.split('$')[2];

      expect(salt1).not.toBe(salt2);
    });

    it('should handle empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password cannot be empty');
    });

    it('should handle null password', async () => {
      await expect(hashPassword(null)).rejects.toThrow('Password must be a string');
    });

    it('should handle undefined password', async () => {
      await expect(hashPassword(undefined)).rejects.toThrow('Password must be a string');
    });

    it('should handle non-string password', async () => {
      await expect(hashPassword(12345)).rejects.toThrow('Password must be a string');
    });

    it('should handle very long passwords', async () => {
      const hash = await hashPassword(longPassword);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^pbkdf2_sha256\$/);
    });
  });

  describe('verifyPassword', () => {
    let hashedPassword;

    beforeAll(async () => {
      hashedPassword = await hashPassword(testPassword);
    });

    it('should verify correct password', async () => {
      const isValid = await verifyPassword(testPassword, hashedPassword);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await verifyPassword('WrongPassword123!', hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should reject password with different case', async () => {
      const isValid = await verifyPassword(testPassword.toLowerCase(), hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const isValid = await verifyPassword('', hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should handle malformed hash gracefully', async () => {
      const isValid = await verifyPassword(testPassword, 'invalid_hash');

      expect(isValid).toBe(false);
    });

    it('should handle bcrypt hash format (for migration)', async () => {
      const bcryptHash = '$2b$10$K1wT5zLx1YqZ5yH8vX9Oj.N1qZ5yH8vX9Oj';
      const isValid = await verifyPassword(testPassword, bcryptHash);

      expect(isValid).toBe(false);
    });

    it('should reject null password', async () => {
      const isValid = await verifyPassword(null, hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should reject undefined password', async () => {
      const isValid = await verifyPassword(undefined, hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should handle hash with wrong algorithm', async () => {
      const wrongHash = 'sha256$100000$salt$hash';
      const isValid = await verifyPassword(testPassword, wrongHash);

      expect(isValid).toBe(false);
    });
  });

  describe('needsRehash', () => {
    it('should return false for current PBKDF2 hash', async () => {
      const hash = await hashPassword(testPassword);
      const needs = needsRehash(hash);

      expect(needs).toBe(false);
    });

    it('should return true for bcrypt hash', () => {
      const bcryptHash = '$2b$10$K1wT5zLx1YqZ5yH8vX9Oj.N1qZ5yH8vX9Oj';
      const needs = needsRehash(bcryptHash);

      expect(needs).toBe(true);
    });

    it('should return true for old PBKDF2 with low iterations', () => {
      const oldHash = 'pbkdf2_sha256$10000$salt$hash';
      const needs = needsRehash(oldHash);

      expect(needs).toBe(true);
    });

    it('should return true for malformed hash', () => {
      const malformedHash = 'invalid_hash_format';
      const needs = needsRehash(malformedHash);

      expect(needs).toBe(true);
    });

    it('should return false for hash with current iterations', () => {
      const currentHash = `pbkdf2_sha256$${PBKDF2_ITERATIONS}$salthere$hashhere`;
      const needs = needsRehash(currentHash);

      expect(needs).toBe(false);
    });

    it('should handle null hash', () => {
      const needs = needsRehash(null);

      expect(needs).toBe(true);
    });

    it('should handle undefined hash', () => {
      const needs = needsRehash(undefined);

      expect(needs).toBe(true);
    });
  });

  describe('Security properties', () => {
    it('should use SHA-256 as digest algorithm', () => {
      expect(PBKDF2_DIGEST).toBe('sha256');
    });

    it('should use at least 100,000 iterations (OWASP 2023)', () => {
      expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(100000);
    });

    it('should use at least 32 bytes key length', () => {
      expect(PBKDF2_KEYLEN).toBeGreaterThanOrEqual(32);
    });

    it('should generate 32-byte salt (256 bits)', async () => {
      const hash = await hashPassword(testPassword);
      const salt = hash.split('$')[2];
      const saltBuffer = Buffer.from(salt, 'base64');

      expect(saltBuffer.length).toBe(32);
    });

    it('should be resistant to timing attacks', async () => {
      const hash = await hashPassword(testPassword);

      const start1 = Date.now();
      await verifyPassword('wrong', hash);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await verifyPassword(testPassword, hash);
      const time2 = Date.now() - start2;

      // Times should be similar (within reasonable variance)
      // This is a basic check; true timing-attack resistance is harder to test
      const timeDifference = Math.abs(time1 - time2);
      expect(timeDifference).toBeLessThan(100); // milliseconds
    });
  });

  describe('Integration with bcrypt migration', () => {
    it('should be able to verify bcrypt hashes during migration', async () => {
      const bcrypt = require('bcrypt');
      const password = 'testpassword123';
      const bcryptHash = await bcrypt.hash(password, 10);

      // During migration, we need to detect bcrypt and rehash
      expect(needsRehash(bcryptHash)).toBe(true);
    });

    it('should create new PBKDF2 hash when rehashing needed', async () => {
      const oldBcryptHash = '$2b$10$K1wT5zLx1YqZ5yH8vX9Oj.N1qZ5yH8vX9Oj';

      if (needsRehash(oldBcryptHash)) {
        const newHash = await hashPassword(testPassword);
        expect(newHash).toMatch(/^pbkdf2_sha256\$/);
        expect(needsRehash(newHash)).toBe(false);
      }
    });
  });

  describe('Performance', () => {
    it('should hash password in reasonable time (<500ms)', async () => {
      const start = Date.now();
      await hashPassword(testPassword);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    }, 10000); // 10 second timeout

    it('should verify password in reasonable time (<500ms)', async () => {
      const hash = await hashPassword(testPassword);

      const start = Date.now();
      await verifyPassword(testPassword, hash);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    }, 10000);
  });
});
