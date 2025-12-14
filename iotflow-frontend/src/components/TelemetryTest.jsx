import { useState, useEffect } from 'react';
import {
  checkTelemetryStatus,
  getLatestTelemetry,
  getDeviceTelemetry,
  storeTelemetry,
} from '../services/telemetryService';

/**
 * TelemetryTest Component
 * Test component to verify Flask backend integration
 */
const TelemetryTest = () => {
  const [status, setStatus] = useState(null);
  const [latestData, setLatestData] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testDeviceId, setTestDeviceId] = useState('');
  const [testApiKey, setTestApiKey] = useState('');

  // Test 1: Check telemetry service status (no auth required)
  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkTelemetryStatus();
      setStatus(data);
      console.log('✅ Telemetry Status:', data);
    } catch (err) {
      setError(`Status check failed: ${err.response?.data?.error || err.message}`);
      console.error('❌ Status check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Get latest telemetry for a device
  const getLatest = async () => {
    if (!testDeviceId || !testApiKey) {
      setError('Please enter Device ID and API Key');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getLatestTelemetry(testApiKey, testDeviceId);
      setLatestData(data);
      console.log('✅ Latest Telemetry:', data);
    } catch (err) {
      setError(`Get latest failed: ${err.response?.data?.error || err.message}`);
      console.error('❌ Get latest failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Get paginated telemetry data
  const getTelemetry = async () => {
    if (!testDeviceId || !testApiKey) {
      setError('Please enter Device ID and API Key');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getDeviceTelemetry(testApiKey, testDeviceId, {
        limit: 10,
        page: 1,
      });
      setTelemetryData(data);
      console.log('✅ Telemetry Data:', data);
    } catch (err) {
      setError(`Get telemetry failed: ${err.response?.data?.error || err.message}`);
      console.error('❌ Get telemetry failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Store sample telemetry data
  const storeTestData = async () => {
    if (!testApiKey) {
      setError('Please enter API Key');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const sampleData = {
        temperature: Math.random() * 30 + 15, // Random temp between 15-45
        humidity: Math.random() * 50 + 30, // Random humidity 30-80
        pressure: Math.random() * 50 + 990, // Random pressure 990-1040
      };

      const result = await storeTelemetry(
        testApiKey,
        sampleData,
        { source: 'telemetry_test_component' },
        new Date().toISOString()
      );
      console.log('✅ Telemetry Stored:', result);
      alert(`Success! Telemetry stored for device ${result.device_name}`);

      // Refresh latest data
      if (testDeviceId) {
        getLatest();
      }
    } catch (err) {
      setError(`Store telemetry failed: ${err.response?.data?.error || err.message}`);
      console.error('❌ Store telemetry failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-check status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🧪 Flask Backend Telemetry Test</h1>

      {/* Status Section */}
      <div
        style={{
          marginBottom: '30px',
          padding: '15px',
          border: '1px solid #ddd',
          borderRadius: '8px',
        }}
      >
        <h2>1. Service Status</h2>
        <button onClick={checkStatus} disabled={loading}>
          {loading ? 'Checking...' : 'Check Status'}
        </button>
        {status && (
          <div
            style={{
              marginTop: '10px',
              backgroundColor: '#f0f0f0',
              padding: '10px',
              borderRadius: '4px',
            }}
          >
            <p>
              <strong>IoTDB Available:</strong> {status.iotdb_available ? '✅ Yes' : '❌ No'}
            </p>
            <p>
              <strong>Status:</strong> {status.status}
            </p>
            <p>
              <strong>Host:</strong> {status.iotdb_host}:{status.iotdb_port}
            </p>
            <p>
              <strong>Database:</strong> {status.iotdb_database}
            </p>
            <p>
              <strong>Total Devices:</strong> {status.total_devices}
            </p>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div
        style={{
          marginBottom: '30px',
          padding: '15px',
          border: '1px solid #ddd',
          borderRadius: '8px',
        }}
      >
        <h2>2. Test Configuration</h2>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            <strong>Device ID:</strong>
          </label>
          <input
            type="number"
            value={testDeviceId}
            onChange={e => setTestDeviceId(e.target.value)}
            placeholder="Enter device ID (e.g., 1)"
            style={{ padding: '8px', width: '300px', fontSize: '14px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            <strong>Device API Key:</strong>
          </label>
          <input
            type="text"
            value={testApiKey}
            onChange={e => setTestApiKey(e.target.value)}
            placeholder="Enter device API key"
            style={{ padding: '8px', width: '300px', fontSize: '14px' }}
          />
        </div>
      </div>

      {/* Test Actions */}
      <div
        style={{
          marginBottom: '30px',
          padding: '15px',
          border: '1px solid #ddd',
          borderRadius: '8px',
        }}
      >
        <h2>3. Test Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={storeTestData} disabled={loading || !testApiKey}>
            📤 Store Test Data
          </button>
          <button onClick={getLatest} disabled={loading || !testDeviceId || !testApiKey}>
            🔍 Get Latest
          </button>
          <button onClick={getTelemetry} disabled={loading || !testDeviceId || !testApiKey}>
            📊 Get Telemetry (10 records)
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c00',
          }}
        >
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Latest Data Display */}
      {latestData && (
        <div
          style={{
            marginBottom: '30px',
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '8px',
          }}
        >
          <h2>📍 Latest Telemetry Data</h2>
          <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
            <p>
              <strong>Device:</strong> {latestData.device_name} (ID: {latestData.device_id})
            </p>
            <p>
              <strong>Type:</strong> {latestData.device_type}
            </p>
            <p>
              <strong>IoTDB Available:</strong> {latestData.iotdb_available ? 'Yes' : 'No'}
            </p>
            <pre
              style={{
                backgroundColor: '#fff',
                padding: '10px',
                borderRadius: '4px',
                overflow: 'auto',
              }}
            >
              {JSON.stringify(latestData.latest_data || latestData.data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Telemetry Data Display */}
      {telemetryData && (
        <div
          style={{
            marginBottom: '30px',
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '8px',
          }}
        >
          <h2>📊 Telemetry Records</h2>
          <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
            <p>
              <strong>Device:</strong> {telemetryData.device_name} (ID: {telemetryData.device_id})
            </p>
            <p>
              <strong>Success:</strong> {telemetryData.success ? 'Yes' : 'No'}
            </p>
            {telemetryData.pagination && (
              <p>
                <strong>Pagination:</strong> Page {telemetryData.pagination.currentPage} of{' '}
                {telemetryData.pagination.totalPages}({telemetryData.pagination.total} total
                records)
              </p>
            )}
            <pre
              style={{
                backgroundColor: '#fff',
                padding: '10px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '400px',
              }}
            >
              {JSON.stringify(telemetryData.telemetry, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div
        style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#f9f9f9',
          border: '1px solid #ddd',
          borderRadius: '8px',
        }}
      >
        <h3>📝 Instructions:</h3>
        <ol>
          <li>First, check the service status to verify Flask backend is running</li>
          <li>Enter a Device ID and API Key from your Node.js backend (get from /api/devices)</li>
          <li>Click "Store Test Data" to send sample telemetry to Flask backend</li>
          <li>Click "Get Latest" to retrieve the most recent telemetry</li>
          <li>Click "Get Telemetry" to fetch paginated historical data</li>
          <li>Check the browser console for detailed logs</li>
        </ol>
        <p>
          <strong>Note:</strong> Make sure both backends are running:
        </p>
        <ul>
          <li>
            Node.js backend: <code>http://localhost:3001</code>
          </li>
          <li>
            Flask backend: <code>http://localhost:5000</code>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TelemetryTest;
