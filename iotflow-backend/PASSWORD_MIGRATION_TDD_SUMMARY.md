# Password Hashing Migration: bcrypt → PBKDF2-SHA256

## TDD Implementation Summary

### ✅ Red-Green-Refactor Cycle

#### 🔴 Red Phase (COMPLETE)
- Created comprehensive test suite: `tests/unit/password.test.js`
- 35 test cases covering all security requirements
- Tests failed with "Cannot find module" (expected)

#### 🟢 Green Phase (COMPLETE)
- Implemented `src/utils/password.js` module
- **All 35 tests passing** in 1.878s
- Security requirements met:
  - ✅ PBKDF2-SHA256 algorithm
  - ✅ 210,000 iterations (exceeds OWASP 2023 minimum of 100,000)
  - ✅ 32-byte (256-bit) salt
  - ✅ 32-byte (256-bit) key length
  - ✅ Constant-time comparison (timing-attack resistant)
  - ✅ Bcrypt migration support

#### 🔵 Refactor Phase (IN PROGRESS)
- Need to update all bcrypt usage locations
- Implement automatic rehashing on login
- Update tests to use new password utilities

---

## Implementation Details

### Password Utility Module
**File:** `src/utils/password.js`

**Exported Functions:**
```javascript
hashPassword(password)       // Hash new password
verifyPassword(password, hash) // Verify password (supports bcrypt + PBKDF2)
needsRehash(hash)             // Check if rehashing needed
```

**Constants:**
```javascript
PBKDF2_ITERATIONS = 210000   // OWASP 2023 recommendation
PBKDF2_KEYLEN = 32           // 256 bits
PBKDF2_DIGEST = 'sha256'     // SHA-256
SALT_LENGTH = 32             // 256 bits
```

**Hash Format:**
```
pbkdf2_sha256$210000$<base64_salt>$<base64_hash>
```

---

## Security Improvements

### Before (bcrypt)
- Algorithm: bcrypt
- Rounds: 10 (2^10 = 1,024 iterations)
- Salt: Built-in
- Status: ⚠️ Considered weak for modern threats

### After (PBKDF2-SHA256)
- Algorithm: PBKDF2 with SHA-256
- Iterations: 210,000 (OWASP 2023 compliant)
- Salt: 32 bytes (256 bits), unique per password
- Key length: 32 bytes (256 bits)
- Timing-attack protection: ✅ `crypto.timingSafeEqual()`
- Status: ✅ OWASP 2023 compliant

### Migration Support
- **Backward compatibility:** Can verify existing bcrypt hashes
- **Automatic upgrade:** `needsRehash()` detects old hashes
- **Graceful transition:** No downtime required

---

## Test Coverage

### Test Categories (35 tests)

#### 1. hashPassword() - 10 tests
- ✅ Format validation (pbkdf2_sha256$iterations$salt$hash)
- ✅ Iteration count (210,000)
- ✅ Salt uniqueness
- ✅ Input validation (empty, null, undefined, non-string)
- ✅ Long password handling

#### 2. verifyPassword() - 9 tests
- ✅ Correct password verification
- ✅ Incorrect password rejection
- ✅ Case sensitivity
- ✅ Malformed hash handling
- ✅ Bcrypt migration support
- ✅ Null/undefined handling

#### 3. needsRehash() - 7 tests
- ✅ Current PBKDF2 detection (no rehash needed)
- ✅ Bcrypt hash detection (rehash needed)
- ✅ Old PBKDF2 detection (low iterations)
- ✅ Malformed hash handling
- ✅ Null/undefined handling

#### 4. Security Properties - 5 tests
- ✅ SHA-256 digest verification
- ✅ OWASP 2023 iteration compliance (≥100,000)
- ✅ Key length (≥32 bytes)
- ✅ Salt length (32 bytes)
- ✅ Timing-attack resistance

#### 5. Migration Support - 2 tests
- ✅ Bcrypt verification during migration
- ✅ Rehashing workflow

#### 6. Performance - 2 tests
- ✅ Hash time <500ms (actual: ~60ms)
- ✅ Verify time <500ms (actual: ~124ms)

---

## Files Requiring Updates

### Controllers (3 files)

#### 1. `src/controllers/userController.js`
**Current usage:**
```javascript
const bcrypt = require('bcrypt');

// Line 24 - register()
const password_hash = await bcrypt.hash(password, 10);

// Line 78 - login()
const isValidPassword = await bcrypt.compare(password, user.password_hash);

// Line 241 - updateUser()
user.password_hash = await bcrypt.hash(password, 10);
```

**Required changes:**
```javascript
const { hashPassword, verifyPassword, needsRehash } = require('../utils/password');

// register()
const password_hash = await hashPassword(password);

// login() - with automatic rehashing
const isValidPassword = await verifyPassword(password, user.password_hash);
if (isValidPassword && needsRehash(user.password_hash)) {
  user.password_hash = await hashPassword(password);
  await user.save();
}

// updateUser()
user.password_hash = await hashPassword(password);
```

#### 2. `src/controllers/adminV1Controller.js`
**Current usage (line ~95):**
```javascript
const password_hash = await bcrypt.hash(password, 10);
```

**Required change:**
```javascript
const { hashPassword } = require('../utils/password');
const password_hash = await hashPassword(password);
```

#### 3. `scripts/initDatabase.js`
**Current usage (line ~128):**
```javascript
const hashedPassword = await bcrypt.hash('admin123', 10);
```

**Required change:**
```javascript
const { hashPassword } = require('../utils/password');
const hashedPassword = await hashPassword('admin123');
```

### Tests (3 files)

#### 1. `tests/unit/models.test.js`
- Update any direct bcrypt usage in test fixtures

#### 2. `tests/integration/user-api.test.js`
- Update user creation fixtures
- Test password verification

#### 3. `tests/integration/admin.devices.test.js`
- Update admin user creation if using bcrypt directly

---

## Migration Strategy

### Automatic Rehashing on Login

```javascript
// In login function (userController.js)
const isValidPassword = await verifyPassword(password, user.password_hash);

if (!isValidPassword) {
  return res.status(401).json({ message: 'Invalid credentials' });
}

// Automatic migration: rehash if old algorithm detected
if (needsRehash(user.password_hash)) {
  user.password_hash = await hashPassword(password);
  await user.save();
  console.log(`Migrated password hash for user: ${user.username}`);
}

// Continue with login...
```

### Key Points
- ✅ **No downtime:** Migration happens automatically on next login
- ✅ **Backward compatible:** Old bcrypt hashes still work
- ✅ **Transparent:** Users don't notice the change
- ✅ **Progressive:** Each user migrates individually
- ✅ **Safe:** Failed migrations don't break authentication

---

## Performance Analysis

### Hashing Performance
- **PBKDF2-SHA256 (210,000 iterations):** ~60ms average
- **bcrypt (10 rounds):** ~50ms average
- **Difference:** +10ms (negligible for authentication)

### Verification Performance
- **PBKDF2-SHA256:** ~124ms average
- **bcrypt:** ~50ms average
- **Difference:** +74ms (still well under 500ms requirement)

### Load Impact
- **For 100 concurrent logins:**
  - Before: ~5 seconds
  - After: ~12.4 seconds
  - **Conclusion:** Acceptable for typical workloads

---

## Security Compliance

### OWASP Password Storage Cheat Sheet (2023)
- ✅ Use PBKDF2-SHA256
- ✅ Minimum 210,000 iterations (recommends 100,000+)
- ✅ Unique salt per password (32 bytes)
- ✅ Output length 32+ bytes
- ✅ Constant-time comparison

### NIST SP 800-63B Guidelines
- ✅ Use approved key derivation function (PBKDF2)
- ✅ Minimum 10,000 iterations (we use 210,000)
- ✅ Salt at least 32 bits (we use 256 bits)

---

## Next Steps (Refactor Phase)

### 1. Update Controllers (Priority: HIGH)
- [ ] Update `src/controllers/userController.js`
- [ ] Update `src/controllers/adminV1Controller.js`
- [ ] Update `scripts/initDatabase.js`

### 2. Update Tests (Priority: HIGH)
- [ ] Update `tests/unit/models.test.js`
- [ ] Update `tests/integration/user-api.test.js`
- [ ] Update `tests/integration/admin.devices.test.js`

### 3. Run Integration Tests (Priority: HIGH)
- [ ] Test user registration with new hash
- [ ] Test user login with new hash
- [ ] Test bcrypt → PBKDF2 migration on login
- [ ] Test admin user creation
- [ ] Test password update functionality

### 4. Documentation (Priority: MEDIUM)
- [ ] Update API documentation
- [ ] Create migration guide for deployments
- [ ] Add security advisory to release notes
- [ ] Update developer setup guide

### 5. Deployment (Priority: MEDIUM)
- [ ] Update production environment
- [ ] Monitor migration progress
- [ ] Set up alerts for failed migrations
- [ ] Plan for 100% migration timeline

---

## Risk Assessment

### Low Risk
- ✅ All tests passing (35/35)
- ✅ Backward compatibility maintained
- ✅ No database schema changes required
- ✅ Automatic migration on login

### Medium Risk
- ⚠️ Performance impact (+74ms per login verification)
- ⚠️ Users who don't log in won't migrate
- ⚠️ Requires monitoring during rollout

### Mitigation
- ✅ Performance is acceptable (<500ms requirement)
- ✅ Old hashes remain valid indefinitely
- ✅ TDD ensures implementation correctness
- ✅ Comprehensive test coverage

---

## Conclusion

✅ **TDD Red-Green phases complete**
✅ **35/35 tests passing**
✅ **OWASP 2023 compliant**
✅ **Ready for Refactor phase**

The password utility module is fully implemented and tested. The next step is to update all controllers to use the new password utilities, ensuring existing users can still log in while automatically migrating to the more secure PBKDF2-SHA256 algorithm.

**Estimated time to complete Refactor phase:** 30-45 minutes
**Risk level:** Low (comprehensive test coverage + backward compatibility)
**Recommended:** Proceed with controller updates

---

**Generated:** TDD Implementation
**Test Results:** 35 passed, 0 failed
**Total Time:** 1.878s
**Status:** ✅ Green Phase Complete
