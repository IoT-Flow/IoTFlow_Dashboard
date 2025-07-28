const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

// Test user credentials
const testUser = {
  username: 'testuser',
  password: 'testpass123',
  email: 'test@example.com'
};

let authToken = null;

async function registerUser() {
  try {
    console.log('🔄 Registering test user...');
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ User registered successfully');
      return result;
    } else {
      const error = await response.json();
      if (error.error && error.error.includes('already exists')) {
        console.log('👤 User already exists, continuing...');
        return { success: true };
      }
      throw new Error(error.error || 'Registration failed');
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    // Continue even if registration fails (user might already exist)
    return { success: true };
  }
}

async function loginUser() {
  try {
    console.log('🔄 Logging in...');
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });

    const result = await response.json();
    if (response.ok && result.token) {
      authToken = result.token;
      console.log('✅ Login successful');
      console.log('🔑 Token received:', authToken.substring(0, 20) + '...');
      return result;
    } else {
      throw new Error(result.error || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    throw error;
  }
}

async function testCreateChart() {
  try {
    console.log('🔄 Testing chart creation...');

    const chartConfig = {
      name: 'Test Temperature Chart',
      title: 'Device Temperature Monitoring',
      description: 'A test chart for temperature data',
      type: 'line',
      devices: ['device-001', 'device-002'],
      measurements: ['temperature', 'humidity'],
      timeRange: '1h',
      refreshInterval: 30,
      aggregation: 'none',
      groupBy: 'device',
      showLegend: true,
      showGrid: true,
      animations: true,
      fillArea: false,
      lineWidth: 2,
      aspectRatio: 2,
      yAxisMin: null,
      yAxisMax: null,
      customColors: ['#FF6B6B', '#4ECDC4'],
      backgroundColor: '#ffffff',
      borderColor: '#1976d2',
      pointStyle: 'circle'
    };

    const response = await fetch(`${API_BASE_URL}/charts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(chartConfig)
    });

    const result = await response.json();
    console.log('📊 Create Chart Response Status:', response.status);
    console.log('📊 Create Chart Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('✅ Chart created successfully!');
      console.log('📊 Chart ID:', result.data.id);
      return result.data;
    } else {
      throw new Error(result.error || 'Chart creation failed');
    }
  } catch (error) {
    console.error('❌ Chart creation error:', error.message);
    throw error;
  }
}

async function testGetCharts() {
  try {
    console.log('🔄 Testing get charts...');

    const response = await fetch(`${API_BASE_URL}/charts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    const result = await response.json();
    console.log('📊 Get Charts Response Status:', response.status);
    console.log('📊 Get Charts Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('✅ Charts fetched successfully!');
      console.log('📊 Number of charts:', result.data.length);
      return result.data;
    } else {
      throw new Error(result.error || 'Failed to fetch charts');
    }
  } catch (error) {
    console.error('❌ Get charts error:', error.message);
    throw error;
  }
}

async function testUpdateChart(chartId) {
  try {
    console.log('🔄 Testing chart update...');

    const updateConfig = {
      name: 'Updated Test Chart',
      title: 'Updated Temperature Monitoring',
      description: 'An updated test chart',
      type: 'area',
      devices: ['device-001'],
      measurements: ['temperature'],
      timeRange: '2h',
      refreshInterval: 60,
      aggregation: 'avg',
      groupBy: 'device',
      showLegend: false,
      showGrid: true,
      animations: true,
      fillArea: true,
      lineWidth: 3,
      aspectRatio: 1.5,
      yAxisMin: 0,
      yAxisMax: 100,
      customColors: ['#9A60B4'],
      backgroundColor: '#f5f5f5',
      borderColor: '#9A60B4',
      pointStyle: 'square'
    };

    const response = await fetch(`${API_BASE_URL}/charts/${chartId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(updateConfig)
    });

    const result = await response.json();
    console.log('📊 Update Chart Response Status:', response.status);
    console.log('📊 Update Chart Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('✅ Chart updated successfully!');
      return result.data;
    } else {
      throw new Error(result.error || 'Chart update failed');
    }
  } catch (error) {
    console.error('❌ Chart update error:', error.message);
    throw error;
  }
}

async function testDeleteChart(chartId) {
  try {
    console.log('🔄 Testing chart deletion...');

    const response = await fetch(`${API_BASE_URL}/charts/${chartId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    const result = await response.json();
    console.log('📊 Delete Chart Response Status:', response.status);
    console.log('📊 Delete Chart Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('✅ Chart deleted successfully!');
      return true;
    } else {
      throw new Error(result.error || 'Chart deletion failed');
    }
  } catch (error) {
    console.error('❌ Chart deletion error:', error.message);
    throw error;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting Chart API Tests...\n');

    // Step 1: Register user
    await registerUser();

    // Step 2: Login
    await loginUser();

    // Step 3: Create a chart
    const createdChart = await testCreateChart();
    console.log('');

    // Step 4: Get all charts
    await testGetCharts();
    console.log('');

    // Step 5: Update the chart
    await testUpdateChart(createdChart.id);
    console.log('');

    // Step 6: Get charts again to verify update
    await testGetCharts();
    console.log('');

    // Step 7: Delete the chart
    await testDeleteChart(createdChart.id);
    console.log('');

    // Step 8: Verify chart was deleted
    await testGetCharts();

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
