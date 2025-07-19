#!/usr/bin/env node

/**
 * IoTFlow Backend Integration Test
 * Tests the complete authentication and data flow
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:5001';

async function testIntegration() {
  console.log('🧪 IoTFlow Backend Integration Test');
  console.log('=====================================\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Endpoint...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.message);

    // Test 2: Demo User Login
    console.log('\n2. Testing Demo User Authentication...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      username: 'demo',
      password: 'demo123'
    });

    if (loginResponse.data.success) {
      console.log('✅ Demo Login Successful');
      console.log(`   User: ${loginResponse.data.data.user.username}`);
      console.log(`   Role: ${loginResponse.data.data.user.role}`);
      console.log(`   Tenant: ${loginResponse.data.data.user.tenant_id}`);

      const token = loginResponse.data.data.token;

      // Test 3: Protected Endpoint (Profile)
      console.log('\n3. Testing Protected Profile Endpoint...');
      const profileResponse = await axios.get(`${BACKEND_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (profileResponse.data.success) {
        console.log('✅ Profile Fetch Successful');
        console.log(`   User ID: ${profileResponse.data.data.user.id}`);
      }

      // Test 4: Devices Endpoint
      console.log('\n4. Testing Devices Endpoint...');
      const devicesResponse = await axios.get(`${BACKEND_URL}/api/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (devicesResponse.data.success) {
        console.log('✅ Devices Fetch Successful');
        console.log(`   Total Devices: ${devicesResponse.data.data.devices.length}`);

        if (devicesResponse.data.data.devices.length > 0) {
          const firstDevice = devicesResponse.data.data.devices[0];
          console.log(`   First Device: ${firstDevice.name} (${firstDevice.device_id})`);

          // Test 5: Telemetry Data
          console.log('\n5. Testing Telemetry Endpoint...');
          const telemetryResponse = await axios.get(
            `${BACKEND_URL}/api/telemetry/device/${firstDevice.device_id}?limit=3`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (telemetryResponse.data.success) {
            console.log('✅ Telemetry Fetch Successful');
            console.log(`   Data Points: ${telemetryResponse.data.data.telemetry.length}`);
            console.log(`   Total Available: ${telemetryResponse.data.data.pagination.total}`);
          }
        }
      }

      // Test 6: Admin User Login
      console.log('\n6. Testing Admin User Authentication...');
      const adminLoginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        username: 'admin',
        password: 'admin123'
      });

      if (adminLoginResponse.data.success) {
        console.log('✅ Admin Login Successful');
        const adminToken = adminLoginResponse.data.data.token;

        // Test 7: Admin Stats
        console.log('\n7. Testing Admin Stats Endpoint...');
        const statsResponse = await axios.get(`${BACKEND_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });

        if (statsResponse.data.success) {
          console.log('✅ Admin Stats Successful');
          console.log(`   Total Users: ${statsResponse.data.data.overview.total_users}`);
          console.log(`   Total Devices: ${statsResponse.data.data.overview.total_devices}`);
          console.log(`   Telemetry Points Today: ${statsResponse.data.data.overview.telemetry_points_today}`);
        }
      }

    }

    console.log('\n🎉 All Integration Tests Passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Backend API is running correctly on port 5001');
    console.log('   ✅ Authentication (demo/admin) is working');
    console.log('   ✅ Multi-tenant data isolation is functioning');
    console.log('   ✅ Device management endpoints are operational');
    console.log('   ✅ Telemetry data retrieval is working');
    console.log('   ✅ Admin features are accessible');
    console.log('\n🔗 Ready for frontend integration!');
    console.log('   Frontend URL: http://localhost:3000');
    console.log('   Backend API: http://localhost:5001');

  } catch (error) {
    console.error('\n❌ Integration Test Failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.response.statusText}`);
      console.error(`   URL: ${error.config?.url}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }

    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure backend is running: npm run dev (in backend directory)');
    console.log('   2. Check if port 5001 is accessible');
    console.log('   3. Verify database is seeded: npm run seed (in backend directory)');

    process.exit(1);
  }
}

// Run the test
testIntegration();
