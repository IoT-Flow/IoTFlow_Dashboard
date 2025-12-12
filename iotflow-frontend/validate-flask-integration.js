/**
 * Flask Integration Validation Script
 * Tests the frontend implementation against the actual Flask backend
 */

const axios = require('axios');

// Configuration
const FLASK_BASE_URL = process.env.REACT_APP_FLASK_API_URL || 'http://localhost:5000/api/v1';
const ADMIN_TOKEN = process.env.REACT_APP_ADMIN_TOKEN || 'test';
const TEST_DEVICE_API_KEY = 'test-device-key'; // You may need a valid API key

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
  const symbol = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⊘';
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  log(`  ${symbol} ${name}${details ? ' - ' + details : ''}`, color);
  
  results.tests.push({ name, status, details });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.skipped++;
}

// Create axios instance matching flaskApi
const flaskApi = axios.create({
  baseURL: FLASK_BASE_URL,
  timeout: 10000,
});

// Test functions
async function testTelemetryStatus() {
  log('\n📊 Testing Telemetry Status Endpoint', colors.cyan);
  try {
    const response = await flaskApi.get('/telemetry/status');
    if (response.data && response.data.status) {
      logTest('GET /telemetry/status', 'PASS', `Status: ${response.data.status}`);
      return true;
    } else {
      logTest('GET /telemetry/status', 'FAIL', 'Invalid response structure');
      return false;
    }
  } catch (error) {
    logTest('GET /telemetry/status', 'FAIL', error.message);
    return false;
  }
}

async function testAdminStats() {
  log('\n📈 Testing Admin Statistics Endpoint', colors.cyan);
  try {
    const response = await flaskApi.get('/admin/stats', {
      headers: { 'Authorization': `admin ${ADMIN_TOKEN}` }
    });
    
    if (response.data && response.data.device_stats) {
      logTest('GET /admin/stats', 'PASS', 
        `Devices: ${response.data.device_stats.total || 0}`);
      
      // Validate structure
      const hasRequiredFields = 
        response.data.device_stats &&
        response.data.auth_stats &&
        response.data.config_stats;
      
      if (hasRequiredFields) {
        logTest('Response structure validation', 'PASS', 'All required fields present');
      } else {
        logTest('Response structure validation', 'FAIL', 'Missing required fields');
      }
      return true;
    } else {
      logTest('GET /admin/stats', 'FAIL', 'Invalid response structure');
      return false;
    }
  } catch (error) {
    logTest('GET /admin/stats', 'FAIL', error.message);
    return false;
  }
}

async function testAdminStatsWithoutToken() {
  log('\n🔒 Testing Admin Stats Without Token (Should Fail)', colors.cyan);
  try {
    await flaskApi.get('/admin/stats');
    logTest('GET /admin/stats (no token)', 'FAIL', 'Should have rejected request');
    return false;
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      logTest('GET /admin/stats (no token)', 'PASS', `Correctly rejected with ${error.response.status}`);
      return true;
    } else {
      logTest('GET /admin/stats (no token)', 'FAIL', `Unexpected error: ${error.message}`);
      return false;
    }
  }
}

async function testHealthEndpoint() {
  log('\n💚 Testing Health Endpoint', colors.cyan);
  try {
    const response = await axios.get('http://localhost:5000/health');
    if (response.data && response.data.status === 'healthy') {
      logTest('GET /health', 'PASS', `Version: ${response.data.version || 'unknown'}`);
      return true;
    } else {
      logTest('GET /health', 'FAIL', 'Invalid response');
      return false;
    }
  } catch (error) {
    logTest('GET /health', 'FAIL', error.message);
    return false;
  }
}

async function testStatusEndpoint() {
  log('\n🔍 Testing Detailed Status Endpoint', colors.cyan);
  try {
    const response = await axios.get('http://localhost:5000/status');
    if (response.data && response.data.checks) {
      const checks = response.data.checks;
      
      logTest('GET /status', 'PASS', `Overall: ${response.data.status}`);
      
      // Check individual services
      if (checks.database) {
        logTest('Database check', checks.database.healthy ? 'PASS' : 'FAIL', 
          `${checks.database.status} (${checks.database.response_time_ms?.toFixed(2)}ms)`);
      }
      
      if (checks.redis) {
        logTest('Redis check', checks.redis.healthy ? 'PASS' : 'FAIL',
          `${checks.redis.status} (${checks.redis.response_time_ms?.toFixed(2)}ms)`);
      }
      
      if (checks.iotdb) {
        logTest('IoTDB check', checks.iotdb.healthy ? 'PASS' : 'FAIL',
          `${checks.iotdb.status} (${checks.iotdb.query_time_ms?.toFixed(2)}ms)`);
      }
      
      return true;
    } else {
      logTest('GET /status', 'FAIL', 'Invalid response structure');
      return false;
    }
  } catch (error) {
    logTest('GET /status', 'FAIL', error.message);
    return false;
  }
}

async function testPrometheusMetrics() {
  log('\n📊 Testing Prometheus Metrics Endpoint', colors.cyan);
  try {
    const response = await axios.get('http://localhost:5000/metrics');
    if (response.data && typeof response.data === 'string') {
      const hasHttpMetrics = response.data.includes('http_requests_total');
      const hasSystemMetrics = response.data.includes('system_cpu_usage_percent');
      
      logTest('GET /metrics', 'PASS', `${response.data.split('\n').length} lines`);
      logTest('HTTP metrics present', hasHttpMetrics ? 'PASS' : 'FAIL');
      logTest('System metrics present', hasSystemMetrics ? 'PASS' : 'FAIL');
      
      return true;
    } else {
      logTest('GET /metrics', 'FAIL', 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('GET /metrics', 'FAIL', error.message);
    return false;
  }
}

async function testAdminDevices() {
  log('\n📱 Testing Admin Device List Endpoint', colors.cyan);
  try {
    const response = await flaskApi.get('/admin/devices', {
      headers: { 'Authorization': `admin ${ADMIN_TOKEN}` }
    });
    
    if (response.data && Array.isArray(response.data.devices)) {
      logTest('GET /admin/devices', 'PASS', 
        `Found ${response.data.total_devices || response.data.devices.length} devices`);
      
      if (response.data.devices.length > 0) {
        const device = response.data.devices[0];
        const hasRequiredFields = device.id && device.name && device.status;
        logTest('Device structure validation', hasRequiredFields ? 'PASS' : 'FAIL',
          hasRequiredFields ? `Sample: ${device.name} (${device.status})` : 'Missing fields');
      }
      
      return true;
    } else {
      logTest('GET /admin/devices', 'FAIL', 'Invalid response structure');
      return false;
    }
  } catch (error) {
    logTest('GET /admin/devices', 'FAIL', error.message);
    return false;
  }
}

async function testCacheStats() {
  log('\n💾 Testing Cache Statistics Endpoint', colors.cyan);
  try {
    const response = await flaskApi.get('/admin/cache/device-status', {
      headers: { 'Authorization': `admin ${ADMIN_TOKEN}` }
    });
    
    if (response.data && response.data.cache_stats) {
      logTest('GET /admin/cache/device-status', 'PASS',
        `Redis: ${response.data.cache_stats.redis_version || 'unknown'}`);
      return true;
    } else {
      logTest('GET /admin/cache/device-status', 'FAIL', 'Invalid response');
      return false;
    }
  } catch (error) {
    logTest('GET /admin/cache/device-status', 'FAIL', error.message);
    return false;
  }
}

async function testRedisSyncStatus() {
  log('\n🔄 Testing Redis-DB Sync Status', colors.cyan);
  try {
    const response = await flaskApi.get('/admin/redis-db-sync/status', {
      headers: { 'Authorization': `admin ${ADMIN_TOKEN}` }
    });
    
    if (response.data && response.data.redis_db_sync) {
      const sync = response.data.redis_db_sync;
      logTest('GET /admin/redis-db-sync/status', 'PASS',
        `Enabled: ${sync.enabled}, Redis: ${sync.redis_available}`);
      return true;
    } else {
      logTest('GET /admin/redis-db-sync/status', 'FAIL', 'Invalid response');
      return false;
    }
  } catch (error) {
    logTest('GET /admin/redis-db-sync/status', 'FAIL', error.message);
    return false;
  }
}

async function testEnvironmentConfig() {
  log('\n⚙️  Validating Environment Configuration', colors.cyan);
  
  const flaskUrl = process.env.REACT_APP_FLASK_API_URL;
  const adminToken = process.env.REACT_APP_ADMIN_TOKEN;
  
  if (flaskUrl) {
    logTest('REACT_APP_FLASK_API_URL set', 'PASS', flaskUrl);
  } else {
    logTest('REACT_APP_FLASK_API_URL set', 'FAIL', 'Using default');
  }
  
  if (adminToken) {
    logTest('REACT_APP_ADMIN_TOKEN set', 'PASS', '***');
  } else {
    logTest('REACT_APP_ADMIN_TOKEN set', 'FAIL', 'Using default');
  }
}

async function validateServiceFunctions() {
  log('\n🔧 Validating Service Layer Functions', colors.cyan);
  
  try {
    // Check if service files exist and can be loaded
    const fs = require('fs');
    const path = require('path');
    
    const telemetryServicePath = path.join(__dirname, 'src/services/telemetryService.js');
    const flaskMetricsServicePath = path.join(__dirname, 'src/services/flaskMetricsService.js');
    
    if (fs.existsSync(telemetryServicePath)) {
      const content = fs.readFileSync(telemetryServicePath, 'utf8');
      const functions = [
        'checkTelemetryStatus',
        'storeTelemetry',
        'getDeviceTelemetry',
        'getLatestTelemetry',
        'queryTelemetryByTime',
        'deleteTelemetry',
        'getDeviceTimeSeries',
      ];
      
      functions.forEach(fn => {
        if (content.includes(`export const ${fn}`)) {
          logTest(`telemetryService.${fn}`, 'PASS', 'Implemented');
        } else {
          logTest(`telemetryService.${fn}`, 'FAIL', 'Not found');
        }
      });
    } else {
      logTest('telemetryService.js', 'FAIL', 'File not found');
    }
    
    if (fs.existsSync(flaskMetricsServicePath)) {
      const content = fs.readFileSync(flaskMetricsServicePath, 'utf8');
      const functions = [
        'getSystemStats',
        'getDeviceStats',
        'getTelemetryMetrics',
        'getCombinedAdminStats',
      ];
      
      functions.forEach(fn => {
        if (content.includes(`export const ${fn}`)) {
          logTest(`flaskMetricsService.${fn}`, 'PASS', 'Implemented');
        } else {
          logTest(`flaskMetricsService.${fn}`, 'FAIL', 'Not found');
        }
      });
    } else {
      logTest('flaskMetricsService.js', 'FAIL', 'File not found');
    }
  } catch (error) {
    logTest('Service validation', 'FAIL', error.message);
  }
}

async function printSummary() {
  log('\n' + '='.repeat(60), colors.blue);
  log('  VALIDATION SUMMARY', colors.blue);
  log('='.repeat(60), colors.blue);
  
  log(`\n  Total Tests: ${results.passed + results.failed + results.skipped}`);
  log(`  ✓ Passed: ${results.passed}`, colors.green);
  
  if (results.failed > 0) {
    log(`  ✗ Failed: ${results.failed}`, colors.red);
  }
  
  if (results.skipped > 0) {
    log(`  ⊘ Skipped: ${results.skipped}`, colors.yellow);
  }
  
  const passRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  log(`\n  Pass Rate: ${passRate}%`, passRate >= 90 ? colors.green : colors.yellow);
  
  if (results.failed === 0) {
    log('\n  🎉 ALL VALIDATIONS PASSED! 🎉', colors.green);
    log('  Frontend implementation is correctly integrated with Flask backend.\n', colors.green);
  } else {
    log('\n  ⚠️  Some validations failed. Please review the errors above.\n', colors.yellow);
  }
  
  log('='.repeat(60) + '\n', colors.blue);
}

// Main execution
async function runValidation() {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.blue);
  log('║     FLASK INTEGRATION VALIDATION                          ║', colors.blue);
  log('║     Testing Frontend Implementation Against Live Backend  ║', colors.blue);
  log('╚════════════════════════════════════════════════════════════╝\n', colors.blue);
  
  log(`Flask Backend: ${FLASK_BASE_URL}`, colors.cyan);
  log(`Admin Token: ${ADMIN_TOKEN ? '***' : 'not set'}`, colors.cyan);
  
  // Run all tests
  await testHealthEndpoint();
  await testStatusEndpoint();
  await testPrometheusMetrics();
  await testTelemetryStatus();
  await testAdminStats();
  await testAdminStatsWithoutToken();
  await testAdminDevices();
  await testCacheStats();
  await testRedisSyncStatus();
  await testEnvironmentConfig();
  await validateServiceFunctions();
  
  // Print summary
  await printSummary();
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run validation
runValidation().catch(error => {
  log(`\n❌ Validation failed with error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
