import axios from 'axios';
import toast from 'react-hot-toast';

// IoTFlow Dashboard API configuration
// Dashboard → Node.js Backend API → SQLite (secure multi-tenant architecture)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws';

// System configuration (for reference only - actual connections go through Flask backend)
const SYSTEM_CONFIG = {
  api_version: 'v1',
  rate_limit: 60, // requests per minute per user
  polling_interval: 30000, // 30 seconds for real-time updates
  max_telemetry_points: 1000,
  supported_aggregations: ['avg', 'min', 'max', 'count'],
  supported_intervals: ['1m', '5m', '15m', '1h', '1d'],
  supported_sensor_types: [
    'temperature', 'humidity', 'pressure', 'battery_level',
    'signal_strength', 'signal_quality', 'air_quality', 'light_level'
  ]
};

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
    });

    // Demo users storage (persisted in localStorage for demo purposes)
    this.demoUsers = this.loadDemoUsers();

    // Request interceptor for API key authentication
    this.api.interceptors.request.use(
      (config) => {
        const user = this.getCurrentUserFromStorage();
        const token = localStorage.getItem('iotflow_token');

        // For auth endpoints, don't add headers
        if (config.url.includes('/auth/') || config.url.includes('/login') || config.url.includes('/register')) {
          return config;
        }

        // Use JWT token for authenticated requests
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        } else {
          console.warn('No auth token found for authenticated request');
        }

        // Add user context for multi-tenant data isolation
        if (user && user.id) {
          config.headers['X-User-ID'] = user.id;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor with enhanced error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        } else if (error.response?.status === 403) {
          this.handleForbidden();
        }

        // Don't show toast for auth endpoints to handle errors manually
        if (!error.config?.url?.includes('/auth/')) {
          const message = error.response?.data?.message || 'An error occurred';
          toast.error(message);
        }

        return Promise.reject(error);
      }
    );

    // Flask backend service endpoints
    this.endpoints = {
      devices: '/devices',
      telemetry: '/telemetry',
      auth: '/auth',
      user_overview: '/telemetry/user/overview',
      device_register: '/devices/register',
      websocket: `${WS_BASE_URL}/telemetry`
    };

    console.log('IoTFlow Dashboard Configuration:', {
      api: API_BASE_URL,
      architecture: 'Dashboard → Flask Backend → IoTDB',
      rate_limit: `${SYSTEM_CONFIG.rate_limit} req/min`,
      polling_interval: `${SYSTEM_CONFIG.polling_interval}ms`
    });
  }

  // Demo users management
  loadDemoUsers() {
    try {
      const stored = localStorage.getItem('iotflow_demo_users');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading demo users:', error);
    }

    // Default demo users
    return [
      {
        credentials: ['admin@iotflow.com', 'admin'],
        password: 'admin123',
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@iotflow.com',
          role: 'admin',
          tenant_id: 1,
          permissions: ['admin', 'user_management', 'system_access'],
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
      },
      {
        credentials: ['john@iotflow.com', 'john'],
        password: 'john123',
        user: {
          id: 2,
          username: 'john',
          email: 'john@iotflow.com',
          role: 'user',
          tenant_id: 2,
          permissions: ['device_access', 'telemetry_read'],
          createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
          lastLogin: new Date().toISOString()
        }
      },
      {
        credentials: ['alice@iotflow.com', 'alice'],
        password: 'alice123',
        user: {
          id: 3,
          username: 'alice',
          email: 'alice@iotflow.com',
          role: 'user',
          tenant_id: 3,
          permissions: ['device_access', 'telemetry_read', 'analytics_read'],
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          lastLogin: new Date().toISOString()
        }
      }
    ];
  }

  saveDemoUsers() {
    try {
      localStorage.setItem('iotflow_demo_users', JSON.stringify(this.demoUsers));
    } catch (error) {
      console.error('Error saving demo users:', error);
    }
  }

  addDemoUser(credentials, password, user) {
    this.demoUsers.push({
      credentials,
      password,
      user
    });
    this.saveDemoUsers();
  }

  // Utility methods for multi-tenant support
  getCurrentUserFromStorage() {
    try {
      const userData = localStorage.getItem('iotflow_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  handleUnauthorized() {
    this.clearAuthData();
    window.location.href = '/login';
    toast.error('Session expired. Please login again.');
  }

  clearAuthData() {
    localStorage.removeItem('iotflow_token');
    localStorage.removeItem('iotflow_user');
    localStorage.removeItem('iotflow_devices_cache');
    console.log('Authentication data cleared');
  }

  handleForbidden() {
    toast.error('Access denied. You can only view your own devices and data.');
  }

  async makeAuthenticatedRequest(endpoint, options = {}) {
    const user = this.getCurrentUserFromStorage();
    if (!user) {
      this.handleUnauthorized();
      return null;
    }

    try {
      const response = await this.api(endpoint, {
        ...options,
        headers: {
          'X-User-ID': user.id,
          ...options.headers
        }
      });
      return response.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  setAuthToken(token) {
    if (token) {
      localStorage.setItem('iotflow_token', token);
    } else {
      localStorage.removeItem('iotflow_token');
    }
  }

  // ==================== MULTI-TENANT AUTHENTICATION ====================

  async login(emailOrUsername, password) {
    try {
      const response = await this.api.post('/auth/login', {
        email: emailOrUsername,
        password
      });

      // Store authentication data from Node.js backend
      const userData = response.data.user;
      const token = response.data.token;

      if (!userData || !token) {
        throw new Error('Invalid server response format');
      }

      localStorage.setItem('iotflow_user', JSON.stringify(userData));
      localStorage.setItem('iotflow_token', token);
      this.setAuthToken(token);

      // Clear any existing cache to force fresh device fetch
      localStorage.removeItem('iotflow_devices_cache');

      console.log('Backend login successful:', {
        userId: userData.id,
        username: userData.username,
      });

      return {
        success: true,
        data: {
          token: token,
          user: userData,
          message: 'Login successful'
        }
      };
    } catch (error) {
      console.log('Backend login failed, trying demo authentication:', error.message);

      // Find matching user - ensure case-insensitive matching
      const matchedUser = this.demoUsers.find(user =>
        user.credentials.some(cred =>
          cred.toLowerCase() === emailOrUsername.toLowerCase()
        ) && user.password === password
      );

      if (matchedUser) {
        // Update last login
        matchedUser.user.lastLogin = new Date().toISOString();
        this.saveDemoUsers();

        // Clear any existing cache to force fresh device fetch
        localStorage.removeItem('iotflow_devices_cache');

        return {
          success: true,
          data: {
            token: 'demo_token_' + matchedUser.user.id,
            user: matchedUser.user,
            message: 'Login successful (Demo Mode)'
          }
        };
      }

      // If no match found, throw authentication error
      throw new Error('Invalid credentials. Please check your email/username and password.');
    }
  }

  async register(userData) {
    try {
      const response = await this.api.post('/auth/register', {
        username: userData.username,
        email: userData.email,
        password: userData.password
      });

      // Backend returns { user, token }
      const { user, token } = response.data;

      console.log('Backend registration successful:', {
        userId: user.id,
        username: user.username,
      });

      return {
        success: true,
        data: {
          token,
          user,
          message: 'Registration successful'
        }
      };
    } catch (error) {
      console.log('Backend registration failed, using demo mode...', error.message);

      // Enhanced demo registration with backend structure
      const newUserId = Date.now();

      const newUser = {
        id: newUserId,
        username: userData.username,
        email: userData.email,
        role: 'user',
        tenant_id: newUserId, // Each new user gets their own tenant
        permissions: ['device_access', 'telemetry_read'],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      console.log('Created new demo user:', newUser);

      // Add the new user to demo users so they can log in later
      this.addDemoUser(
        [userData.email, userData.username],
        userData.password,
        newUser
      );

      console.log('Added user to demo users list');

      return {
        success: true,
        data: {
          token: 'demo_token_' + newUserId,
          user: newUser,
          message: 'Registration successful (Demo Mode)'
        }
      };
    }
  }

  async logout() {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    } finally {
      // Always clear local auth data
      this.clearAuthData();
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.api.get('/auth/profile');
      return response.data;
    } catch (error) {
      // Return current user from storage if backend fails
      const currentUser = this.getCurrentUserFromStorage();
      if (currentUser) {
        return currentUser;
      }
      throw error;
    }
  }

  async updateProfile(userData) {
    try {
      const response = await this.api.put('/auth/profile', userData);

      // Update local storage with new user data
      const updatedUser = response.data;
      localStorage.setItem('iotflow_user', JSON.stringify(updatedUser));

      return response.data;
    } catch (error) {
      console.log('Backend profile update failed:', error.message);
      throw error;
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.log('Backend password change failed:', error.message);
      throw error;
    }
  }

  // ==================== MULTI-TENANT DEVICE MANAGEMENT ====================

  async getDevices(params = {}) {
    try {
      const response = await this.api.get('/devices', { params });

      console.log('Backend devices response:', response.data);

      // Format the response to match what the frontend expects
      let devices = response.data.devices || response.data || [];

      // Transform backend devices to match frontend format
      if (Array.isArray(devices)) {
        devices = devices.map(device => ({
          id: device.id,
          deviceId: device.device_id || device.id,
          name: device.name,
          type: device.device_type || device.type,
          location: device.location,
          status: device.status,
          description: device.description,
          apiKey: device.api_key, // Re-add api_key
          lastSeen: device.last_seen || device.lastSeen || device.updated_at,
          createdAt: device.created_at || device.createdAt,
          updatedAt: device.updated_at || device.updatedAt,
          owner: device.user_id || device.owner,
          firmware_version: device.firmware_version,
          hardware_version: device.hardware_version
        }));
      }

      return {
        success: true,
        data: devices,
        total: response.data.total || devices.length,
        page: response.data.page || 1,
        totalPages: response.data.totalPages || 1
      };
    } catch (error) {
      console.error('Backend devices error:', error.response?.data || error.message);

      // Only fall back to demo if it's a network error or 500 error
      if (!error.response || error.response.status >= 500) {
        console.log('Backend devices failed, using demo data...', error.message);

        // Enhanced demo data with strict user isolation
        const currentUser = this.getCurrentUserFromStorage();
        if (!currentUser) {
          this.handleUnauthorized();
          return;
        }

        // User-specific device data with enhanced multi-tenant isolation
        const userDevicesMap = {
          1: [ // Admin user devices
            {
              id: 1,
              deviceId: 'ADMIN_TEMP_001',
              name: 'Server Room Temperature Monitor',
              type: 'Temperature',
              device_type: 'temperature_sensor',
              location: 'Data Center - Server Room A',
              status: 'active',
              api_key: 'demo_admin_key_temp_001', // Re-add api_key
              lastSeen: new Date(Date.now() - 300000).toISOString(),
              owner: 1,
              tenant_id: 1,
              createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
              description: 'Critical infrastructure temperature monitoring'
            },
            {
              id: 2,
              deviceId: 'ADMIN_PRESS_002',
              name: 'HVAC Pressure Monitoring System',
              type: 'Pressure',
              device_type: 'pressure_sensor',
              location: 'Building A - HVAC Control Room',
              status: 'active',
              api_key: 'demo_admin_key_press_002', // Re-add api_key
              lastSeen: new Date(Date.now() - 120000).toISOString(),
              owner: 1,
              tenant_id: 1,
              createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
              description: 'Building HVAC system pressure monitoring and control'
            }
          ],
          2: [ // John's personal devices
            {
              id: 3,
              deviceId: 'JOHN_TEMP_001',
              name: 'Living Room Climate Sensor',
              type: 'Temperature',
              device_type: 'temperature_humidity_sensor',
              location: 'Home - Living Room',
              status: 'active',
              api_key: 'demo_john_key_temp_001', // Re-add api_key
              lastSeen: new Date(Date.now() - 600000).toISOString(),
              owner: 2,
              tenant_id: 2,
              createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
              description: 'Smart home climate monitoring and comfort optimization'
            },
            {
              id: 4,
              deviceId: 'JOHN_LED_002',
              name: 'Smart RGB LED Controller',
              type: 'LED',
              device_type: 'smart_lighting',
              location: 'Home - Living Room',
              status: 'active',
              api_key: 'demo_john_key_led_002', // Re-add api_key
              lastSeen: new Date(Date.now() - 180000).toISOString(),
              owner: 2,
              tenant_id: 2,
              createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
              description: 'RGB LED strip with voice control and automation'
            }
          ],
          3: [ // Alice's garden automation devices
            {
              id: 7,
              deviceId: 'ALICE_TEMP_001',
              name: 'Greenhouse Climate Station',
              type: 'Temperature',
              device_type: 'environmental_sensor',
              location: 'Garden - Smart Greenhouse',
              status: 'active',
              api_key: 'demo_alice_key_temp_001', // Re-add api_key
              lastSeen: new Date(Date.now() - 240000).toISOString(),
              owner: 3,
              tenant_id: 3,
              createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
              description: 'Precision greenhouse climate control and monitoring'
            },
            {
              id: 8,
              deviceId: 'ALICE_PUMP_002',
              name: 'Smart Irrigation Pump',
              type: 'Pump',
              device_type: 'irrigation_pump',
              location: 'Garden - Irrigation Hub',
              status: 'active',
              api_key: 'demo_alice_key_pump_002', // Re-add api_key
              lastSeen: new Date(Date.now() - 300000).toISOString(),
              owner: 3,
              tenant_id: 3,
              createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
              description: 'Solar-powered smart irrigation with soil moisture integration'
            }
          ]
        };

        // Strict tenant isolation - only return current user's devices
        const userDevices = userDevicesMap[currentUser.id] || [];

        return {
          success: true,
          data: userDevices,
          total: userDevices.length,
          page: params.page || 1,
          limit: params.limit || 50
        };
      } else {
        // Re-throw client errors (400, 401, 403, etc.) to be handled by the UI
        throw error;
      }
    }
  }

  async getDevice(deviceId) {
    try {
      const response = await this.api.get(`/devices/${deviceId}`);

      // Transform backend response to match frontend format
      const device = response.data;
      const transformedDevice = {
        id: device.id,
        deviceId: device.id,
        name: device.name,
        type: device.device_type || device.type,
        location: device.location,
        status: device.status,
        description: device.description,
        apiKey: device.api_key, // Re-add api_key
        lastSeen: device.last_seen || device.lastSeen || device.updated_at,
        createdAt: device.created_at || device.createdAt,
        updatedAt: device.updated_at || device.updatedAt,
        owner: device.user_id || device.owner,
        firmware_version: device.firmware_version,
        hardware_version: device.hardware_version
      };

      return transformedDevice;
    } catch (error) {
      console.log('Backend get device failed:', error.message);
      throw error;
    }
  }

  async createDevice(deviceData) {
    try {
      const response = await this.api.post('/devices', {
        name: deviceData.name,
        description: deviceData.description,
        device_type: deviceData.type || deviceData.device_type,
        location: deviceData.location,
        status: deviceData.status || 'offline',
        firmware_version: deviceData.firmware_version,
        hardware_version: deviceData.hardware_version
      });

      console.log('Backend device creation successful:', response.data);

      // Backend returns the device object directly (not wrapped)
      const device = response.data;
      const transformedDevice = {
        id: device.id,
        deviceId: device.device_id || device.id,
        name: device.name,
        type: device.device_type || device.type,
        location: device.location,
        status: device.status,
        description: device.description,
        apiKey: device.api_key, // Re-add api_key
        lastSeen: device.last_seen || device.updated_at,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
        owner: device.user_id,
        firmware_version: device.firmware_version,
        hardware_version: device.hardware_version
      };

      return {
        success: true,
        data: transformedDevice
      };
    } catch (error) {
      console.error('Backend device creation error:', error.response?.data || error.message);

      // Only fall back to demo if it's a network error or 500 error
      if (!error.response || error.response.status >= 500) {
        console.log('Backend device creation failed, using demo...', error.message);

        // Enhanced demo registration matching backend structure
        const currentUser = this.getCurrentUserFromStorage();
        if (!currentUser) {
          this.handleUnauthorized();
          return;
        }

        const deviceId = Math.floor(Math.random() * 1000) + 100;

        const newDevice = {
          id: deviceId,
          deviceId: deviceId,
          name: deviceData.name,
          type: deviceData.type || deviceData.device_type,
          location: deviceData.location,
          description: deviceData.description || '',
          status: 'offline', // Device starts offline until first connection
          owner: currentUser.id,
          apiKey: `demo_key_${Date.now()}`, // Re-add api_key
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastSeen: null,
          firmware_version: deviceData.firmware_version,
          hardware_version: deviceData.hardware_version
        };

        return {
          success: true,
          data: newDevice
        };
      } else {
        // Re-throw client errors (400, 401, 403, etc.) to be handled by the UI
        throw error;
      }
    }
  }

  async updateDevice(deviceId, deviceData) {
    try {
      const response = await this.api.put(`/devices/${deviceId}`, {
        name: deviceData.name,
        description: deviceData.description,
        device_type: deviceData.type || deviceData.device_type,
        location: deviceData.location,
        status: deviceData.status,
        firmware_version: deviceData.firmware_version,
        hardware_version: deviceData.hardware_version
      });

      console.log('Backend device update successful:', response.data);

      // Transform backend response to match frontend format
      const device = response.data;
      const transformedDevice = {
        id: device.id,
        deviceId: device.id,
        name: device.name,
        type: device.device_type || device.type,
        location: device.location,
        status: device.status,
        description: device.description,
        apiKey: device.api_key, // Re-add api_key
        lastSeen: device.last_seen || device.lastSeen || device.updated_at,
        createdAt: device.created_at || device.createdAt,
        updatedAt: device.updated_at || device.updatedAt,
        owner: device.user_id || device.owner,
        firmware_version: device.firmware_version,
        hardware_version: device.hardware_version
      };

      return {
        success: true,
        data: transformedDevice
      };
    } catch (error) {
      console.log('Backend device update failed:', error.message);
      throw error;
    }
  }

  async deleteDevice(deviceId) {
    try {
      const response = await this.api.delete(`/devices/${deviceId}`);
      console.log('Backend device deletion successful');

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Backend device deletion failed:', error.message);
      throw error;
    }
  }

  async regenerateApiKey(deviceId) {
    const response = await this.api.post(`/devices/${deviceId}/regenerate-api-key`);
    return response.data;
  }

  // Telemetry Data
  async getTelemetryData(deviceId, params = {}) {
    const response = await this.api.get(`/telemetry/device/${deviceId}`, { params });
    return response.data;
  }

  async getAggregatedData(deviceId, aggregation, params = {}) {
    const response = await this.api.get(`/telemetry/${deviceId}/aggregate/${aggregation}`, { params });
    return response.data;
  }

  async exportTelemetryData(deviceId, format, params = {}) {
    const response = await this.api.get(`/telemetry/${deviceId}/export/${format}`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  }

  // MQTT Management
  async getMqttStatus() {
    const response = await this.api.get('/mqtt/status');
    return response.data;
  }

  async getMqttTopics() {
    const response = await this.api.get('/mqtt/topics');
    return response.data;
  }

  async getMqttMessages(topic, params = {}) {
    const response = await this.api.get(`/mqtt/messages/${topic}`, { params });
    return response.data;
  }

  // System Administration
  async getSystemHealth() {
    const response = await this.api.get('/admin/health');
    return response.data;
  }

  async getSystemStats() {
    const response = await this.api.get('/admin/stats');
    return response.data;
  }

  async getSystemLogs(params = {}) {
    const response = await this.api.get('/admin/logs', { params });
    return response.data;
  }

  async clearCache() {
    const response = await this.api.post('/admin/cache/clear');
    return response.data;
  }

  // Analytics
  async getAnalyticsData(type, params = {}) {
    const response = await this.api.get(`/analytics/${type}`, { params });
    return response.data;
  }

  async runCustomQuery(query) {
    const response = await this.api.post('/analytics/query', { query });
    return response.data;
  }

  // Device Control Commands
  async sendDeviceCommand(deviceId, command, params = {}) {
    try {
      const response = await this.api.post(`/devices/${deviceId}/control`, {
        command,
        params,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      // Demo implementation for device control
      // Simulate command execution with realistic response
      const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      return {
        success: true,
        data: {
          commandId,
          deviceId,
          command,
          params,
          status: 'executed',
          timestamp: new Date().toISOString(),
          executionTime: Math.floor(Math.random() * 500) + 100 // 100-600ms
        }
      };
    }
  }

  async getDeviceStatus(deviceId) {
    try {
      const response = await this.api.get(`/devices/${deviceId}/status`);
      return response.data;
    } catch (error) {
      // Demo device status based on device type
      // First get device type from device list
      const deviceResult = await this.getDevices();
      const device = deviceResult.data?.devices?.find(d => d.id === deviceId);
      const deviceType = device?.type || 'Other';

      const deviceStates = {
        'LED': {
          power: Math.random() > 0.5,
          brightness: Math.floor(Math.random() * 100),
          color: { r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255) },
          mode: ['solid', 'blink', 'fade'][Math.floor(Math.random() * 3)]
        },
        'Engine': {
          power: Math.random() > 0.7,
          speed: Math.floor(Math.random() * 3000) + 500,
          temperature: Math.floor(Math.random() * 50) + 40,
          load: Math.floor(Math.random() * 100),
          runtime: Math.floor(Math.random() * 10000)
        },
        'Door Lock': {
          locked: Math.random() > 0.3,
          batteryLevel: Math.floor(Math.random() * 40) + 60,
          lastAccess: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          accessCode: '****'
        },
        'Pump': {
          power: Math.random() > 0.6,
          flowRate: Math.floor(Math.random() * 50) + 10,
          pressure: Math.floor(Math.random() * 30) + 20,
          runtime: Math.floor(Math.random() * 1000)
        },
        'Fan': {
          power: Math.random() > 0.5,
          speed: Math.floor(Math.random() * 5) + 1,
          oscillating: Math.random() > 0.5,
          timer: Math.floor(Math.random() * 120)
        },
        'Valve': {
          open: Math.random() > 0.4,
          position: Math.floor(Math.random() * 100),
          pressure: Math.floor(Math.random() * 100) + 50,
          flowRate: Math.floor(Math.random() * 80) + 20
        },
        'Thermostat': {
          temperature: Math.floor(Math.random() * 10) + 20,
          targetTemperature: Math.floor(Math.random() * 10) + 22,
          mode: ['heat', 'cool', 'auto', 'off'][Math.floor(Math.random() * 4)],
          fanSpeed: ['low', 'medium', 'high', 'auto'][Math.floor(Math.random() * 4)]
        },
        'Switch': {
          power: Math.random() > 0.5,
          state: Math.random() > 0.5 ? 'on' : 'off'
        },
        'Dimmer': {
          power: Math.random() > 0.5,
          level: Math.floor(Math.random() * 100)
        },
        'Motor': {
          power: Math.random() > 0.6,
          speed: Math.floor(Math.random() * 100),
          direction: Math.random() > 0.5 ? 'forward' : 'reverse',
          load: Math.floor(Math.random() * 100)
        }
      };

      return {
        success: true,
        data: {
          deviceId,
          status: device?.status || 'active',
          lastUpdate: new Date().toISOString(),
          state: deviceStates[deviceType] || {}
        }
      };
    }
  }

  async getDeviceCommands(deviceId) {
    try {
      const response = await this.api.get(`/devices/${deviceId}/commands`);
      return response.data;
    } catch (error) {
      // Demo: Return available commands based on device type
      // First get device type from device list
      const deviceResult = await this.getDevices();
      const device = deviceResult.data?.devices?.find(d => d.id === deviceId);
      const deviceType = device?.type || 'Other';

      const commandsByType = {
        'LED': [
          { name: 'power', label: 'Power On/Off', type: 'toggle', params: ['state'] },
          { name: 'setBrightness', label: 'Set Brightness', type: 'slider', params: ['brightness'], min: 0, max: 100 },
          { name: 'setColor', label: 'Set Color', type: 'color', params: ['r', 'g', 'b'] },
          { name: 'setMode', label: 'Set Mode', type: 'select', params: ['mode'], options: ['solid', 'blink', 'fade'] }
        ],
        'Engine': [
          { name: 'start', label: 'Start Engine', type: 'button', params: [] },
          { name: 'stop', label: 'Stop Engine', type: 'button', params: [] },
          { name: 'setSpeed', label: 'Set Speed (RPM)', type: 'slider', params: ['speed'], min: 500, max: 3500 }
        ],
        'Door Lock': [
          { name: 'lock', label: 'Lock Door', type: 'button', params: [] },
          { name: 'unlock', label: 'Unlock Door', type: 'button', params: [] },
          { name: 'setAccessCode', label: 'Set Access Code', type: 'password', params: ['code'] }
        ],
        'Pump': [
          { name: 'start', label: 'Start Pump', type: 'button', params: [] },
          { name: 'stop', label: 'Stop Pump', type: 'button', params: [] },
          { name: 'setFlowRate', label: 'Set Flow Rate', type: 'slider', params: ['flowRate'], min: 10, max: 60 }
        ],
        'Fan': [
          { name: 'power', label: 'Power On/Off', type: 'toggle', params: ['state'] },
          { name: 'setSpeed', label: 'Set Speed', type: 'slider', params: ['speed'], min: 1, max: 5 },
          { name: 'toggleOscillation', label: 'Toggle Oscillation', type: 'toggle', params: ['oscillating'] },
          { name: 'setTimer', label: 'Set Timer (minutes)', type: 'slider', params: ['timer'], min: 0, max: 120 }
        ],
        'Valve': [
          { name: 'open', label: 'Open Valve', type: 'button', params: [] },
          { name: 'close', label: 'Close Valve', type: 'button', params: [] },
          { name: 'setPosition', label: 'Set Position (%)', type: 'slider', params: ['position'], min: 0, max: 100 }
        ],
        'Thermostat': [
          { name: 'setTemperature', label: 'Set Temperature', type: 'slider', params: ['temperature'], min: 10, max: 35 },
          { name: 'setMode', label: 'Set Mode', type: 'select', params: ['mode'], options: ['heat', 'cool', 'auto', 'off'] },
          { name: 'setFanSpeed', label: 'Set Fan Speed', type: 'select', params: ['fanSpeed'], options: ['low', 'medium', 'high', 'auto'] }
        ],
        'Switch': [
          { name: 'power', label: 'Power On/Off', type: 'toggle', params: ['state'] },
          { name: 'toggle', label: 'Toggle Switch', type: 'button', params: [] }
        ],
        'Dimmer': [
          { name: 'power', label: 'Power On/Off', type: 'toggle', params: ['state'] },
          { name: 'setLevel', label: 'Set Dimmer Level', type: 'slider', params: ['level'], min: 0, max: 100 }
        ],
        'Motor': [
          { name: 'start', label: 'Start Motor', type: 'button', params: [] },
          { name: 'stop', label: 'Stop Motor', type: 'button', params: [] },
          { name: 'setSpeed', label: 'Set Speed', type: 'slider', params: ['speed'], min: 0, max: 100 },
          { name: 'setDirection', label: 'Set Direction', type: 'select', params: ['direction'], options: ['forward', 'reverse'] }
        ]
      };

      return {
        success: true,
        data: {
          deviceId,
          commands: commandsByType[deviceType] || []
        }
      };
    }
  }

  async getCommandHistory(deviceId, params = {}) {
    try {
      const response = await this.api.get(`/devices/${deviceId}/commands/history`, { params });
      return response.data;
    } catch (error) {
      // Only show real backend data; do not return demo/fake data
      throw error;
    }
  }

  // Device Automation & Scheduling
  async createDeviceSchedule(deviceId, scheduleData) {
    try {
      const response = await this.api.post(`/devices/${deviceId}/schedules`, scheduleData);
      return response.data;
    } catch (error) {
      // Demo schedule creation
      return {
        success: true,
        data: {
          id: Date.now(),
          deviceId,
          name: scheduleData.name,
          command: scheduleData.command,
          params: scheduleData.params,
          schedule: scheduleData.schedule,
          enabled: true,
          createdAt: new Date().toISOString(),
          nextExecution: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
        }
      };
    }
  }

  async getDeviceSchedules(deviceId) {
    try {
      const response = await this.api.get(`/devices/${deviceId}/schedules`);
      return response.data;
    } catch (error) {
      // Demo schedules
      return {
        success: true,
        data: {
          schedules: [
            {
              id: 1,
              name: 'Morning Light On',
              command: 'power',
              params: { state: true },
              schedule: '0 6 * * *', // 6 AM daily
              enabled: true,
              nextExecution: new Date(Date.now() + 3600000).toISOString()
            }
          ]
        }
      };
    }
  }

  // ==================== FLASK BACKEND TELEMETRY INTEGRATION ====================

  /**
   * Get latest telemetry data for a specific device
   * Endpoint: GET /api/telemetry/device/{device_id}
   */
  async getLatestTelemetryForDevice(deviceId) {
    try {
      const response = await this.makeAuthenticatedRequest(`/telemetry/device/${deviceId}`, {
        method: 'GET',
        params: { limit: 1 }
      });
      return response;
    } catch (error) {
      return this.generateDemoLatestTelemetry(deviceId);
    }
  }

  /**
   * Get historical telemetry data for a device with time range and aggregation
   * Endpoint: GET /api/telemetry/device/{device_id}
   * Query params: start_time, end_time, limit, aggregation, interval, sensor_type
   */
  async getHistoricalTelemetryData(deviceId, params = {}) {
    try {
      const queryParams = {
        startTime: params.startTime || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endTime: params.endTime || new Date().toISOString(),
        limit: params.limit || 1000,
        aggregation: params.aggregation || 'none',
        interval: params.interval || 'raw',
        metric: params.sensorType
      };

      const response = await this.makeAuthenticatedRequest(`/telemetry/device/${deviceId}`, {
        method: 'GET',
        params: queryParams
      });
      return response;
    } catch (error) {
      return this.generateDemoHistoricalTelemetry(deviceId, params);
    }
  }

  /**
   * Get telemetry overview for all user's devices
   * Endpoint: GET /api/v1/telemetry/user/overview
   */
  async getUserTelemetryOverview(timeRange = '24h') {
    try {
      const response = await this.makeAuthenticatedRequest('/telemetry/user/overview', {
        method: 'GET',
        params: { time_range: timeRange }
      });
      return response;
    } catch (error) {
      return await this.generateDemoUserOverview(timeRange);
    }
  }

  /**
   * Submit telemetry data for a device (used by devices, not dashboard)
   * Endpoint: POST /api/v1/telemetry/{device_id}
   */
  async submitTelemetryData(deviceId, telemetryData, apiKey) {
    try {
      const response = await this.api.post(`/telemetry/${deviceId}`, telemetryData, {
        headers: {
          'X-API-Key': apiKey, // Use X-API-Key for device authentication
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      return this.generateDemoTelemetrySubmissionResponse(deviceId, telemetryData);
    }
  }

  /**
   * Get all available sensor types for the user
   */
  getSupportedSensorTypes() {
    return SYSTEM_CONFIG.supported_sensor_types;
  }

  /**
   * Get all available aggregation methods
   */
  getSupportedAggregations() {
    return SYSTEM_CONFIG.supported_aggregations;
  }

  /**
   * Get all available time intervals
   */
  getSupportedIntervals() {
    return SYSTEM_CONFIG.supported_intervals;
  }

  // ==================== DEMO DATA GENERATION (Flask Backend Format) ====================

  generateDemoLatestTelemetry(deviceId) {
    const currentUser = this.getCurrentUserFromStorage();
    if (!currentUser) {
      this.handleUnauthorized();
      return;
    }

    const device = this.getDeviceFromCache(deviceId);
    if (!device) {
      return { success: false, error: 'Device not found' };
    }

    const telemetryData = {
      device_id: deviceId,
      timestamp: new Date().toISOString(),
      iotdb_path: `root.iotflow.users.user_${currentUser.id}.device_${deviceId}`,
      user_id: currentUser.id,
      data: {}
    };

    // Generate sensor data based on device type
    switch (device.type) {
      case 'Temperature':
        telemetryData.data = {
          temperature: 20 + Math.random() * 15 + (currentUser.id * 2),
          humidity: 40 + Math.random() * 40,
          battery_level: device.battery_level || 85 + Math.random() * 15,
          signal_strength: -40 - Math.random() * 30
        };
        break;
      case 'Pressure':
        telemetryData.data = {
          pressure: 1000 + Math.random() * 50,
          battery_level: device.battery_level || 90 + Math.random() * 10,
          signal_strength: -35 - Math.random() * 25
        };
        break;
      case 'LED':
        telemetryData.data = {
          brightness: Math.floor(Math.random() * 100),
          power: Math.random() > 0.5,
          signal_strength: -30 - Math.random() * 20
        };
        break;
      default:
        telemetryData.data = {
          value: Math.random() * 100,
          signal_strength: -40 - Math.random() * 30
        };
    }

    return {
      success: true,
      data: telemetryData
    };
  }

  generateDemoHistoricalTelemetry(deviceId, params = {}) {
    const currentUser = this.getCurrentUserFromStorage();
    if (!currentUser) {
      this.handleUnauthorized();
      return;
    }

    const device = this.getDeviceFromCache(deviceId);
    if (!device) {
      return { success: false, error: 'Device not found' };
    }

    const startTime = new Date(params.startTime || Date.now() - 24 * 60 * 60 * 1000);
    const endTime = new Date(params.endTime || Date.now());
    const interval = this.parseInterval(params.interval || '5m');
    const limit = params.limit || 1000;

    const dataPoints = [];
    let currentTime = startTime.getTime();
    let count = 0;

    while (currentTime <= endTime.getTime() && count < limit) {
      const timestamp = new Date(currentTime).toISOString();
      const dataPoint = {
        timestamp,
        device_id: deviceId,
        user_id: currentUser.id,
        iotdb_path: `root.iotflow.users.user_${currentUser.id}.device_${deviceId}`
      };

      // Generate realistic sensor data with time-based patterns
      const hour = new Date(currentTime).getHours();
      switch (device.type) {
        case 'Temperature':
          dataPoint.temperature = 20 + Math.sin((hour - 6) * Math.PI / 12) * 8 + Math.random() * 2;
          dataPoint.humidity = 60 - Math.sin((hour - 6) * Math.PI / 12) * 20 + Math.random() * 10;
          break;
        case 'Pressure':
          dataPoint.pressure = 1013.25 + Math.sin(hour * Math.PI / 12) * 20 + Math.random() * 5;
          break;
        case 'LED':
          dataPoint.brightness = Math.floor(Math.random() * 100);
          dataPoint.power = Math.random() > 0.3;
          break;
        default:
          dataPoint.value = Math.random() * 100;
      }

      dataPoints.push(dataPoint);
      currentTime += interval;
      count++;
    }

    return {
      success: true,
      data: {
        device_id: deviceId,
        user_id: currentUser.id,
        telemetry: dataPoints,
        query_params: params,
        total_points: dataPoints.length,
        time_range: {
          start: startTime.toISOString(),
          end: endTime.toISOString()
        }
      }
    };
  }

  async generateDemoUserOverview(timeRange = '24h') {
    const currentUser = this.getCurrentUserFromStorage();
    if (!currentUser) {
      this.handleUnauthorized();
      return;
    }

    // Get user's devices
    const devicesResult = await this.getDevices();
    const devices = Array.isArray(devicesResult?.data) ? devicesResult.data :
      Array.isArray(devicesResult?.data?.devices) ? devicesResult.data.devices : [];

    const activeDevices = devices.filter(d => d.status === 'active').length;
    const totalDevices = devices.length;
    const totalMessages = devices.reduce((sum, device) => sum + (device.message_count_today || 0), 0);

    return {
      success: true,
      data: {
        user_id: currentUser.id,
        overview: {
          total_devices: totalDevices,
          active_devices: activeDevices,
          inactive_devices: totalDevices - activeDevices,
          total_messages_today: totalMessages,
          avg_messages_per_device: Math.round(totalMessages / Math.max(activeDevices, 1)),
          uptime_percentage: Math.round((activeDevices / Math.max(totalDevices, 1)) * 100),
          last_activity: new Date().toISOString()
        },
        time_range: timeRange,
        devices_summary: devices.map(device => ({
          device_id: device.id,
          name: device.name,
          type: device.type,
          status: device.status,
          message_count_today: device.message_count_today || 0,
          last_seen: device.lastSeen,
          iotdb_path: `root.iotflow.users.user_${currentUser.id}.device_${device.id}`
        }))
      }
    };
  }

  generateDemoTelemetrySubmissionResponse(deviceId, telemetryData) {
    return {
      success: true,
      data: {
        message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        device_id: deviceId,
        timestamp: new Date().toISOString(),
        status: 'accepted',
        iotdb_path: `root.iotflow.users.user_${this.getCurrentUserFromStorage()?.id}.device_${deviceId}`,
        processing_time_ms: Math.floor(Math.random() * 50) + 10,
        data_points: Object.keys(telemetryData).length
      }
    };
  }

  // ==================== CUSTOM DEVICE CONTROL API ====================

  /**
   * Send a custom control command to a device
   * @param {string} deviceId - The device ID
   * @param {string} command - The command string (e.g., 'turn_on', 'set_brightness')
   * @param {object} parameters - Key-value pairs of parameters
   * @returns {Promise} Response with control_id and status
   */
  async sendCustomDeviceControl(deviceId, command, parameters = {}) {
    try {
      const response = await axios.post(`http://localhost:5000/api/v1/devices/${deviceId}/control`, {
        command,
        parameters
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Device control error:', error.response?.data || error.message);

      // Demo fallback for development
      const controlId = `ctrl_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      return {
        success: true,
        data: {
          control_id: controlId,
          device_id: deviceId,
          command,
          parameters,
          status: 'pending',
          timestamp: new Date().toISOString(),
          message: `Command '${command}' queued for device ${deviceId}`
        }
      };
    }
  }

  /**
   * Check the status of a control command
   * @param {string} deviceId - The device ID
   * @param {string} controlId - The control command ID
   * @returns {Promise} Response with command status
   */
  async getControlCommandStatus(deviceId, controlId) {
    try {
      const response = await axios.get(`http://localhost:5000/api/v1/devices/${deviceId}/control/${controlId}/status`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Control status error:', error.response?.data || error.message);

      // Demo fallback with realistic status progression
      const statuses = ['pending', 'acknowledged', 'executing', 'completed', 'failed'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      return {
        success: true,
        data: {
          control_id: controlId,
          device_id: deviceId,
          status: randomStatus,
          timestamp: new Date().toISOString(),
          message: `Command status: ${randomStatus}`,
          execution_time: randomStatus === 'completed' ? Math.floor(Math.random() * 1000) + 100 : null
        }
      };
    }
  }

  /**
   * Get pending control commands for a device
   * @param {string} deviceId - The device ID
   * @returns {Promise} Response with pending commands list
   */
  async getPendingControlCommands(deviceId) {
    try {
      const response = await axios.get(`http://localhost:5000/api/v1/devices/${deviceId}/control/pending`);
      console.log(response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Only show real backend data; do not return demo/fake data
      throw error;
    }
  }

  // ==================== EXISTING DEVICE CONTROL METHODS ====================
}

const apiService = new ApiService();
export default apiService;
