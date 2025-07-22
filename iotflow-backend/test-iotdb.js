// Test IoTDB REST API connection
const iotdbClient = require('./src/utils/iotdbClient');

async function testIoTDB() {
  console.log('Testing IoTDB REST API connection...');
  console.log('Host: localhost, Port: 8181');

  try {
    await iotdbClient.testConnection();
    console.log('✅ IoTDB connection successful!');
  } catch (error) {
    console.error('❌ IoTDB connection failed:', error.message);
  }
}

testIoTDB();
