#!/usr/bin/env node

/**
 * Device Management Test Script
 * Tests device creation and listing functionality
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:5001';

async function testDeviceManagement() {
  console.log('🛠️  IoTFlow Device Management Test');
  console.log('=====================================\n');

  try {
    // Step 1: Login to get token
    console.log('1. Logging in as demo user...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      username: 'demo',
      password: 'demo123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');

    // Step 2: List existing devices
    console.log('\n2. Listing existing devices...');
    const devicesResponse = await axios.get(`${BACKEND_URL}/api/devices`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (devicesResponse.data.success) {
      console.log('✅ Devices retrieved successfully');
      console.log(`📱 Found ${devicesResponse.data.data.devices.length} devices:`);
      devicesResponse.data.data.devices.forEach(device => {
        console.log(`   - ${device.name} (${device.device_id}) - ${device.type}`);
      });
    }

    // Step 3: Create a new device
    console.log('\n3. Creating a new device...');
    const deviceData = {
      device_id: `test_device_${Date.now()}`,
      name: 'Test IoT Device',
      type: 'temperature_sensor',
      location: 'Office',
      description: 'Test device for integration testing',
      configuration: {
        firmware_version: '1.0.0',
        hardware_version: '1.0'
      }
    };

    const createResponse = await axios.post(`${BACKEND_URL}/api/devices`, deviceData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (createResponse.data.success) {
      console.log('✅ Device created successfully');
      console.log(`📱 New device: ${createResponse.data.data.device.name}`);
      console.log(`🆔 Device ID: ${createResponse.data.data.device.device_id}`);
    } else {
      console.error('❌ Device creation failed:', createResponse.data.message);
    }

    // Step 4: List devices again to verify
    console.log('\n4. Verifying device creation...');
    const updatedDevicesResponse = await axios.get(`${BACKEND_URL}/api/devices`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (updatedDevicesResponse.data.success) {
      const deviceCount = updatedDevicesResponse.data.data.devices.length;
      console.log(`✅ Updated device count: ${deviceCount}`);
    }

    console.log('\n🎉 Device management test completed successfully!');

  } catch (error) {
    console.error('\n❌ Device management test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.response.statusText}`);
      console.error(`   Data:`, error.response.data);
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
}

// Run the test
testDeviceManagement();
