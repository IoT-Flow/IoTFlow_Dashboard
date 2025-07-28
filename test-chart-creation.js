const http = require('http');

const API_BASE_URL = 'http://localhost:3001/api';

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function testChartCreation() {
  try {
    console.log('🔐 Step 1: Login to get authentication token...');

    // Step 1: Login
    const loginResponse = await makeRequest(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'test123'
      })
    });

    console.log('Login response status:', loginResponse.status);

    if (loginResponse.status !== 200) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }

    const loginData = loginResponse.data;
    console.log('✅ Login successful!');
    console.log('User:', loginData.user.username, loginData.user.email);
    console.log('Token preview:', loginData.token.substring(0, 20) + '...');

    const token = loginData.token;

    console.log('\n📊 Step 2: Creating a test chart...');

    // Step 2: Create Chart
    const chartData = {
      name: 'Temperature Monitoring Test',
      title: 'Test Temperature Chart',
      description: 'A test chart created via API',
      type: 'line',
      devices: ['sensor001', 'sensor002'],
      measurements: ['temperature', 'humidity'],
      timeRange: '1h',
      refreshInterval: 30,
      aggregation: 'avg',
      groupBy: '5m',
      showLegend: true,
      showGrid: true,
      animations: true,
      fillArea: false,
      lineWidth: 2,
      aspectRatio: 2,
      customColors: ['#1976d2', '#ff5722'],
      backgroundColor: '#ffffff',
      borderColor: '#1976d2',
      pointStyle: 'circle'
    };

    const createResponse = await makeRequest(`${API_BASE_URL}/charts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(chartData)
    });

    console.log('Create chart response status:', createResponse.status);

    if (createResponse.status !== 200 && createResponse.status !== 201) {
      console.error('❌ Chart creation failed:', createResponse.data);
      return;
    }

    const chartResult = createResponse.data;
    console.log('✅ Chart created successfully!');
    console.log('Chart ID:', chartResult.data.id);
    console.log('Chart Name:', chartResult.data.name);
    console.log('Chart Type:', chartResult.data.type);
    console.log('Devices:', chartResult.data.devices);
    console.log('Measurements:', chartResult.data.measurements);

    console.log('\n📊 Step 3: Retrieving all charts...');

    // Step 3: Get all charts
    const getChartsResponse = await makeRequest(`${API_BASE_URL}/charts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Get charts response status:', getChartsResponse.status);

    if (getChartsResponse.status !== 200) {
      console.error('❌ Get charts failed:', getChartsResponse.data);
      return;
    }

    const chartsResult = getChartsResponse.data;
    console.log('✅ Charts retrieved successfully!');
    console.log('Total charts:', chartsResult.data.length);
    chartsResult.data.forEach(chart => {
      console.log(`- Chart ${chart.id}: ${chart.name} (${chart.type})`);
    });

    console.log('\n📊 Step 4: Creating another chart (Gauge type)...');

    // Step 4: Create another chart (different type)
    const gaugeChartData = {
      name: 'Pressure Gauge Test',
      title: 'System Pressure Monitor',
      description: 'A gauge chart for pressure monitoring',
      type: 'gauge',
      devices: ['pressure_sensor'],
      measurements: ['pressure'],
      timeRange: '5m',
      refreshInterval: 10,
      aggregation: 'last',
      showLegend: false,
      showGrid: false,
      animations: true,
      customColors: ['#4caf50', '#ff9800', '#f44336'],
      backgroundColor: '#ffffff',
      yAxisMin: 0,
      yAxisMax: 100
    };

    const createGaugeResponse = await makeRequest(`${API_BASE_URL}/charts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(gaugeChartData)
    });

    console.log('Create gauge chart response status:', createGaugeResponse.status);

    if (createGaugeResponse.status !== 200 && createGaugeResponse.status !== 201) {
      console.error('❌ Gauge chart creation failed:', createGaugeResponse.data);
      return;
    }

    const gaugeResult = createGaugeResponse.data;
    console.log('✅ Gauge chart created successfully!');
    console.log('Gauge Chart ID:', gaugeResult.data.id);
    console.log('Gauge Chart Name:', gaugeResult.data.name);
    console.log('Gauge Chart Type:', gaugeResult.data.type);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('💥 Error during testing:', error.message);
  }
}

// Run the test
testChartCreation();
