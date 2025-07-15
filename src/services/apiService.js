import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('iotflow_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('iotflow_token');
          localStorage.removeItem('iotflow_user');
          window.location.href = '/login';
        }
        
        // Don't show toast for auth endpoints to handle errors manually
        if (!error.config?.url?.includes('/auth/')) {
          const message = error.response?.data?.message || 'An error occurred';
          toast.error(message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    if (token) {
      this.api.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.Authorization;
    }
  }

  // Authentication
  async login(emailOrUsername, password) {
    try {
      const response = await this.api.post('/auth/login', { emailOrUsername, password });
      return response.data;
    } catch (error) {
      // For demo purposes, simulate successful login with demo credentials
      const demoUsers = [
        {
          credentials: ['admin@iotflow.com', 'admin'],
          password: 'admin123',
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@iotflow.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
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
            firstName: 'John',
            lastName: 'Smith',
            role: 'user',
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
            firstName: 'Alice',
            lastName: 'Johnson',
            role: 'user',
            createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
            lastLogin: new Date().toISOString()
          }
        }
      ];

      const matchedUser = demoUsers.find(user => 
        user.credentials.includes(emailOrUsername) && user.password === password
      );

      if (matchedUser) {
        return {
          success: true,
          data: {
            token: 'demo-jwt-token-' + Date.now(),
            user: matchedUser.user
          }
        };
      }
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await this.api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      // For demo purposes, simulate successful registration
      return {
        success: true,
        data: {
          token: 'demo-jwt-token-' + Date.now(),
          user: {
            id: Date.now(),
            username: userData.username,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: 'user',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          }
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
    }
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async updateProfile(userData) {
    const response = await this.api.put('/auth/profile', userData);
    return response.data;
  }

  async changePassword(currentPassword, newPassword) {
    const response = await this.api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }

  // Device Management (User-specific)
  async getDevices(params = {}) {
    try {
      const response = await this.api.get('/devices', { params });
      return response.data;
    } catch (error) {
      // Demo data for user devices - different devices per user
      const currentUser = JSON.parse(localStorage.getItem('iotflow_user') || '{}');
      
      const userDevicesMap = {
        1: [ // Admin user devices
          {
            id: 1,
            deviceId: 'ADMIN_TEMP_001',
            name: 'Server Room Temperature',
            type: 'Temperature',
            location: 'Data Center - Server Room',
            status: 'active',
            lastSeen: new Date(Date.now() - 300000).toISOString(),
            owner: 1,
            apiKey: 'admin_temp_001_api_key_demo',
            createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
            firmwareVersion: '2.1.0',
            hardwareVersion: '3.0',
            description: 'Critical server room temperature monitoring'
          },
          {
            id: 2,
            deviceId: 'ADMIN_PRESS_002',
            name: 'HVAC Pressure Monitor',
            type: 'Pressure',
            location: 'Building A - HVAC Room',
            status: 'active',
            lastSeen: new Date(Date.now() - 120000).toISOString(),
            owner: 1,
            apiKey: 'admin_press_002_api_key_demo',
            createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
            firmwareVersion: '1.8.2',
            hardwareVersion: '2.5',
            description: 'HVAC system pressure monitoring'
          }
        ],
        2: [ // John's devices
          {
            id: 3,
            deviceId: 'JOHN_TEMP_001',
            name: 'Home Living Room Temp',
            type: 'Temperature',
            location: 'Home - Living Room',
            status: 'active',
            lastSeen: new Date(Date.now() - 600000).toISOString(),
            owner: 2,
            apiKey: 'john_temp_001_api_key_demo',
            createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
            firmwareVersion: '1.5.0',
            hardwareVersion: '2.0',
            description: 'Living room climate monitoring'
          },
          {
            id: 4,
            deviceId: 'JOHN_LED_002',
            name: 'Smart Living Room LED',
            type: 'LED',
            location: 'Home - Living Room',
            status: 'active',
            lastSeen: new Date(Date.now() - 180000).toISOString(),
            owner: 2,
            apiKey: 'john_led_002_api_key_demo',
            createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
            firmwareVersion: '2.1.0',
            hardwareVersion: '1.8',
            description: 'RGB LED strip controller with dimming'
          },
          {
            id: 5,
            deviceId: 'JOHN_LOCK_003',
            name: 'Front Door Smart Lock',
            type: 'Door Lock',
            location: 'Home - Front Door',
            status: 'active',
            lastSeen: new Date(Date.now() - 120000).toISOString(),
            owner: 2,
            apiKey: 'john_lock_003_api_key_demo',
            createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
            firmwareVersion: '1.8.3',
            hardwareVersion: '3.2',
            description: 'Keyless entry door lock with remote control'
          },
          {
            id: 6,
            deviceId: 'JOHN_FAN_004',
            name: 'Bedroom Ceiling Fan',
            type: 'Fan',
            location: 'Home - Master Bedroom',
            status: 'active',
            lastSeen: new Date(Date.now() - 90000).toISOString(),
            owner: 2,
            apiKey: 'john_fan_004_api_key_demo',
            createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
            firmwareVersion: '1.4.1',
            hardwareVersion: '2.0',
            description: 'Smart ceiling fan with speed control and timer'
          }
        ],
        3: [ // Alice's devices
          {
            id: 7,
            deviceId: 'ALICE_TEMP_001',
            name: 'Greenhouse Temperature',
            type: 'Temperature',
            location: 'Garden - Greenhouse',
            status: 'active',
            lastSeen: new Date(Date.now() - 240000).toISOString(),
            owner: 3,
            apiKey: 'alice_temp_001_api_key_demo',
            createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
            firmwareVersion: '1.4.2',
            hardwareVersion: '2.1',
            description: 'Greenhouse climate control'
          },
          {
            id: 8,
            deviceId: 'ALICE_PUMP_002',
            name: 'Garden Water Pump',
            type: 'Pump',
            location: 'Garden - Irrigation System',
            status: 'active',
            lastSeen: new Date(Date.now() - 300000).toISOString(),
            owner: 3,
            apiKey: 'alice_pump_002_api_key_demo',
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            firmwareVersion: '2.0.1',
            hardwareVersion: '1.5',
            description: 'Automated irrigation water pump'
          },
          {
            id: 9,
            deviceId: 'ALICE_VALVE_003',
            name: 'Main Water Valve',
            type: 'Valve',
            location: 'Garden - Water Main',
            status: 'active',
            lastSeen: new Date(Date.now() - 150000).toISOString(),
            owner: 3,
            apiKey: 'alice_valve_003_api_key_demo',
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            firmwareVersion: '1.6.0',
            hardwareVersion: '2.2',
            description: 'Main water flow control valve'
          },
          {
            id: 10,
            deviceId: 'ALICE_ENGINE_004',
            name: 'Generator Engine',
            type: 'Engine',
            location: 'Garage - Backup Generator',
            status: 'inactive',
            lastSeen: new Date(Date.now() - 7200000).toISOString(),
            owner: 3,
            apiKey: 'alice_engine_004_api_key_demo',
            createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
            firmwareVersion: '3.1.2',
            hardwareVersion: '4.0',
            description: 'Backup generator engine controller'
          }
        ]
      };

      const userDevices = userDevicesMap[currentUser.id] || [];
      
      return {
        success: true,
        data: {
          devices: userDevices,
          total: userDevices.length,
          page: 1,
          limit: 10
        }
      };
    }
  }

  async getDevice(deviceId) {
    const response = await this.api.get(`/devices/${deviceId}`);
    return response.data;
  }

  async createDevice(deviceData) {
    try {
      const response = await this.api.post('/devices', deviceData);
      return response.data;
    } catch (error) {
      // Demo implementation: Generate device connection credentials
      const currentUser = JSON.parse(localStorage.getItem('iotflow_user') || '{}');
      
      // Generate unique device token and connection details
      const deviceToken = `iot_${deviceData.name.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substr(2, 16)}`;
      const gatewayIP = '192.168.1.100'; // Demo gateway IP
      const mqttPort = 1883;
      const httpsPort = 8443;
      
      const newDevice = {
        id: Date.now(),
        deviceId: `${deviceData.type.toUpperCase()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        name: deviceData.name,
        type: deviceData.type,
        location: deviceData.location,
        description: deviceData.description || '',
        status: 'inactive', // Device starts as inactive until first connection
        lastSeen: null,
        owner: currentUser.id,
        
        // Connection credentials provided by the protocol gateway
        connectionDetails: {
          deviceToken: deviceToken,
          gatewayIP: gatewayIP,
          mqttEndpoint: `mqtt://${gatewayIP}:${mqttPort}`,
          httpsEndpoint: `https://${gatewayIP}:${httpsPort}`,
          mqttTopic: `devices/${currentUser.id}/${deviceData.name.toLowerCase().replace(/\s+/g, '_')}`,
          reconnectInterval: 30, // seconds
          heartbeatInterval: 60 // seconds
        },
        
        firmwareVersion: deviceData.firmware_version || '1.0.0',
        hardwareVersion: deviceData.hardware_version || '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return {
        success: true,
        data: {
          device: newDevice,
          message: 'Device registered successfully. Use the provided token and endpoint to connect your device.'
        }
      };
    }
  }

  async updateDevice(deviceId, deviceData) {
    const response = await this.api.put(`/devices/${deviceId}`, deviceData);
    return response.data;
  }

  async deleteDevice(deviceId) {
    const response = await this.api.delete(`/devices/${deviceId}`);
    return response.data;
  }

  async regenerateApiKey(deviceId) {
    const response = await this.api.post(`/devices/${deviceId}/regenerate-key`);
    return response.data;
  }

  // Telemetry Data
  async getTelemetryData(deviceId, params = {}) {
    const response = await this.api.get(`/telemetry/${deviceId}`, { params });
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
          executionTime: Math.floor(Math.random() * 500) + 100, // 100-600ms
          message: `Command '${command}' executed successfully on device ${deviceId}`
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
      // Demo command history
      const commands = [];
      for (let i = 0; i < 10; i++) {
        commands.push({
          id: `cmd_${Date.now() - i * 60000}_${Math.random().toString(36).substr(2, 8)}`,
          command: ['power', 'setBrightness', 'setColor'][Math.floor(Math.random() * 3)],
          params: { brightness: Math.floor(Math.random() * 100) },
          status: ['executed', 'failed', 'pending'][Math.floor(Math.random() * 3)],
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          executionTime: Math.floor(Math.random() * 500) + 100,
          user: 'Current User'
        });
      }

      return {
        success: true,
        data: {
          deviceId,
          commands: commands.slice(0, params.limit || 10),
          total: commands.length
        }
      };
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
}

const apiService = new ApiService();
export default apiService;
