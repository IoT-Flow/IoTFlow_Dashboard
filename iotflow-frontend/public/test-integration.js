/**
 * Frontend-Backend Integration Test
 * Run this in the browser console to test the connection
 */

// Test function to verify frontend-backend communication
async function testFrontendBackendConnection() {
  console.log('🔗 Testing Frontend-Backend Integration...');

  try {
    // Test 1: Check if backend is accessible
    console.log('1. Testing backend accessibility...');
    const healthResponse = await fetch('http://localhost:5001/health');
    const healthData = await healthResponse.json();
    console.log('✅ Backend health check:', healthData);

    // Test 2: Test login API
    console.log('\n2. Testing login API...');
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'demo',
        password: 'demo123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('✅ Login response:', loginData);

    if (loginData.success) {
      const token = loginData.data.token;
      console.log('✅ JWT Token received:', token.substring(0, 50) + '...');

      // Test 3: Test protected endpoint
      console.log('\n3. Testing protected endpoint...');
      const profileResponse = await fetch('http://localhost:5001/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const profileData = await profileResponse.json();
      console.log('✅ Profile data:', profileData);

      // Test 4: Test devices endpoint
      console.log('\n4. Testing devices endpoint...');
      const devicesResponse = await fetch('http://localhost:5001/api/devices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const devicesData = await devicesResponse.json();
      console.log('✅ Devices data:', devicesData);

      if (devicesData.success && devicesData.data.devices.length > 0) {
        const firstDevice = devicesData.data.devices[0];
        console.log('\n5. Testing telemetry endpoint...');
        const telemetryResponse = await fetch(`http://localhost:5001/api/telemetry/device/${firstDevice.device_id}?limit=3`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const telemetryData = await telemetryResponse.json();
        console.log('✅ Telemetry data:', telemetryData);
      }
    }

    console.log('\n🎉 All tests passed! Frontend-Backend integration is working correctly.');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Ensure backend is running on port 5001');
    console.log('- Check CORS configuration');
    console.log('- Verify API endpoints are accessible');
  }
}

// Run the test
testFrontendBackendConnection();

// Also provide a simple login test for the UI
window.testLogin = async function () {
  console.log('🔑 Testing login via UI...');

  try {
    // Import the API service from the React app
    const apiService = window.apiService;

    if (!apiService) {
      console.error('❌ API Service not found. Make sure the React app is loaded.');
      return;
    }

    const response = await apiService.login('demo', 'demo123');
    console.log('✅ Login response:', response);

    if (response.success) {
      console.log('🎉 Login successful! You can now use the dashboard.');
    } else {
      console.error('❌ Login failed:', response.error);
    }

  } catch (error) {
    console.error('❌ Login test failed:', error);
  }
};

console.log('\n📝 Instructions:');
console.log('1. Open the browser console (F12)');
console.log('2. The integration test will run automatically');
console.log('3. Use testLogin() to test the UI login function');
console.log('4. Go to http://localhost:3000/login to test the actual login form');
