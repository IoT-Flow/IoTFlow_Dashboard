// Quick test to see if demo credentials work
const emailOrUsername = 'admin@iotflow.com';
const password = 'admin123';

const demoUsers = [
  {
    credentials: ['admin@iotflow.com', 'admin'],
    password: 'admin123',
    user: {
      id: 1,
      username: 'admin',
      email: 'admin@iotflow.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      api_key: 'admin_api_key_demo_secure_token_123'
    }
  }
];

// Find matching user - ensure case-insensitive matching
const matchedUser = demoUsers.find(user =>
  user.credentials.some(cred =>
    cred.toLowerCase() === emailOrUsername.toLowerCase()
  ) && user.password === password
);

console.log('Matched user:', matchedUser);

// Test with username instead
const matchedUser2 = demoUsers.find(user =>
  user.credentials.some(cred =>
    cred.toLowerCase() === 'admin'.toLowerCase()
  ) && user.password === password
);

console.log('Matched user with username:', matchedUser2);
