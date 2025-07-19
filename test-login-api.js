const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Adjust if your backend runs on a different port
const API_BASE = `${BASE_URL}/api`;

// Test credentials - you can modify these
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'password123'
};

// Function to test user registration
async function testRegister() {
  console.log('\n🔐 Testing User Registration...');
  try {
    const response = await axios.post(`${API_BASE}/users/register`, {
      username: 'testuser',
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password
    });

    console.log('✅ Registration successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log('❌ Registration failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
    return null;
  }
}

// Function to test user login
async function testLogin() {
  console.log('\n🔑 Testing User Login...');
  try {
    const response = await axios.post(`${API_BASE}/users/login`, {
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password
    });

    console.log('✅ Login successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    // Extract token for further testing
    const token = response.data.token;
    if (token) {
      console.log('\n🎟️  JWT Token received:', token.substring(0, 50) + '...');
      return { token, user: response.data.user };
    }
    
    return response.data;
  } catch (error) {
    console.log('❌ Login failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
    return null;
  }
}

// Function to test protected route with token
async function testProtectedRoute(token) {
  console.log('\n🛡️  Testing Protected Route (Get Profile)...');
  try {
    const response = await axios.get(`${API_BASE}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Protected route access successful!');
    console.log('Response status:', response.status);
    console.log('Profile data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log('❌ Protected route access failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
    return null;
  }
}

// Function to test invalid login
async function testInvalidLogin() {
  console.log('\n❌ Testing Invalid Login...');
  try {
    const response = await axios.post(`${API_BASE}/users/login`, {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    });

    console.log('⚠️  Unexpected success with invalid credentials');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('✅ Invalid login correctly rejected');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error message:', error.response.data.message);
    }
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting IoTFlow Login API Tests');
  console.log('=====================================');
  
  // Test 1: Try to register a user (might fail if user already exists)
  await testRegister();
  
  // Test 2: Test valid login
  const loginResult = await testLogin();
  
  // Test 3: Test protected route if login was successful
  if (loginResult && loginResult.token) {
    await testProtectedRoute(loginResult.token);
  }
  
  // Test 4: Test invalid login
  await testInvalidLogin();
  
  console.log('\n✨ Tests completed!');
}

// Check if backend is running
async function checkBackend() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Backend is running');
    return true;
  } catch (error) {
    try {
      // Try to hit any endpoint to see if server is up
      await axios.get(BASE_URL);
      console.log('✅ Backend is running (no health endpoint)');
      return true;
    } catch (e) {
      console.log('❌ Backend is not running or not accessible');
      console.log('Make sure your backend server is running on', BASE_URL);
      return false;
    }
  }
}

// Run the tests
async function main() {
  console.log('🔍 Checking if backend is running...');
  const backendRunning = await checkBackend();
  
  if (backendRunning) {
    await runTests();
  } else {
    console.log('\n💡 To start the backend, run:');
    console.log('cd iotflow-backend && npm start');
  }
}

main().catch(console.error);
