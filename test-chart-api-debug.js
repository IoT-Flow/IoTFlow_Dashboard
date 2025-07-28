#!/usr/bin/env node

// Simple test to validate chart API functionality

const API_BASE = 'http://localhost:3001/api';

// Test data for creating a chart
const testChartData = {
  name: "Test Chart API",
  title: "API Test Chart",
  description: "Testing chart creation via API",
  type: "line",
  devices: ["20"],
  measurements: ["temperature"],
  timeRange: "1h",
  refreshInterval: 30,
  aggregation: "none",
  groupBy: "device",
  showLegend: true,
  showGrid: true,
  animations: true,
  fillArea: false,
  lineWidth: 2,
  aspectRatio: 2,
  customColors: ["#1976d2"],
  backgroundColor: "#ffffff",
  borderColor: "#1976d2",
  pointStyle: "circle"
};

async function testChartAPI() {
  console.log('Testing Chart API endpoints...\n');

  try {
    // Test health endpoint first
    const healthResponse = await fetch(`${API_BASE.replace('/api', '')}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health endpoint working:', healthData.status);

    // Test charts endpoint without auth (should fail)
    console.log('\n📊 Testing charts endpoint without auth...');
    try {
      const response = await fetch(`${API_BASE}/charts`);
      const data = await response.json();
      if (response.status === 401) {
        console.log('✅ Auth protection working:', data.message);
      } else {
        console.log('❌ Expected 401, got:', response.status, data);
      }
    } catch (error) {
      console.log('❌ Error testing unauth access:', error.message);
    }

    console.log('\n🔑 For full testing, you need to:');
    console.log('1. Login to get a JWT token');
    console.log('2. Use the token to test authenticated endpoints');
    console.log('3. Check the browser console for detailed logs when creating charts');

    console.log('\n📝 Expected chart data structure:');
    console.log(JSON.stringify(testChartData, null, 2));

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testChartAPI();
}

module.exports = { testChartData };
