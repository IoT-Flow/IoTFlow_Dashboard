# IoTFlow Dashboard

A modern, responsive web dashboard for IoTFlow - an enterprise IoT connectivity platform that manages IoT devices, telemetry data, and real-time monitoring.

![IoTFlow Dashboard](https://img.shields.io/badge/IoTFlow-Dashboard-blue) ![React](https://img.shields.io/badge/React-18.2.0-blue) ![Material-UI](https://img.shields.io/badge/Material--UI-5.11-blue)

## 🚀 Features

### 🔐 Authentication & Security
- **Admin Authentication**: Secure token-based authentication system
- **API Key Management**: Device-specific API keys for secure device operations
- **Role-based Access**: Admin vs Device-level permissions
- **Rate Limiting**: Visual indicators for rate limit status and warnings

### 📱 Device Management
- **Device Registration**: Comprehensive form for device onboarding
- **Device Dashboard**: Sortable, filterable table with status indicators
- **Device Details**: Complete device information panels with API key management
- **Bulk Operations**: Multi-select operations for bulk status updates
- **Status Management**: Active, inactive, maintenance, and error states
- **API Key Rotation**: Secure key regeneration interface

### 📊 Real-time Telemetry Monitoring
- **Live Data Widgets**: Real-time temperature, humidity, pressure, battery levels
- **Historical Charts**: Interactive time-series graphs with zoom and export
- **Custom Dashboards**: Device-specific customizable widget layouts
- **Data Export**: CSV and JSON export functionality
- **Alert System**: Threshold-based alerts and notifications
- **Data Aggregation**: Hourly, daily, weekly data summaries

### 📡 MQTT Monitoring & Management
- **Broker Status**: Real-time connection status and performance metrics
- **Topic Monitoring**: Live topic subscription viewer with message rates
- **Message Inspector**: Real-time MQTT message viewer with filtering
- **Connection Management**: Device MQTT credentials and connection info
- **Performance Metrics**: Message throughput, error rates, latency tracking

### ⚙️ System Administration
- **Health Dashboard**: Service status indicators for IoTDB, Redis, MQTT
- **Performance Monitoring**: API response times, error rates, throughput
- **Cache Management**: Redis cache status and clear operations
- **System Statistics**: Device counts, telemetry volume, storage usage
- **Log Viewer**: Real-time log streaming with filtering capabilities

### 📈 Advanced Analytics
- **Interactive Charts**: Chart.js powered time-series visualizations
- **Trend Analysis**: Statistical trends and anomaly detection
- **Custom Queries**: IoTDB query builder interface
- **Data Correlations**: Multi-device data comparison tools
- **Performance Reports**: Comprehensive analytics and reporting

## 🛠️ Technology Stack

### Frontend
- **React 18.2** - Modern React with hooks and functional components
- **Material-UI 5.11** - Professional UI component library
- **Chart.js 4.2** - Interactive and responsive charts
- **Socket.io Client** - Real-time WebSocket communication
- **React Router 6** - Client-side routing and navigation
- **Axios** - HTTP client for API communication

### State Management
- **React Context API** - Authentication and WebSocket state management
- **React Hooks** - Local component state management

### Real-time Features
- **WebSocket** - Live telemetry data streaming
- **Server-Sent Events** - System notifications and alerts
- **Auto-refresh** - Configurable data refresh intervals

## 📦 Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn package manager
- IoTFlow backend server (Flask + IoTDB + Redis + MQTT)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd iotflow-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your backend configuration:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_WS_URL=ws://localhost:5000
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Access the dashboard**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Build

```bash
# Build for production
npm run build

# Serve the build (optional)
npm install -g serve
serve -s build -l 3000
```

## 🔑 Authentication

The dashboard uses token-based authentication. For demo purposes, use:

**Demo Token**: `demo-admin-token-2025`

In production, obtain your admin token from the IoTFlow backend administrator.

## 📱 Dashboard Pages

### 🏠 Overview
- System health indicators
- Real-time metrics dashboard
- Active device count and status
- Recent alerts and notifications
- Quick action buttons

### 🔌 Devices
- Complete device management interface
- Device registration and editing
- API key management and rotation
- Bulk operations for device management
- Device status monitoring and control

### 📊 Telemetry
- Real-time data visualization
- Historical data analysis
- Custom time range selection
- Data export functionality
- Multi-device comparison tools

### 📡 MQTT
- MQTT broker monitoring
- Topic and subscription management
- Real-time message inspection
- Connection status tracking
- Performance metrics visualization

### 📈 Analytics
- Advanced data analysis tools
- Custom query builder
- Trend analysis and forecasting
- Data correlation analysis
- Report generation and export

### ⚙️ Admin
- System health monitoring
- Service management tools
- Cache management interface
- System logs and diagnostics
- Maintenance operations

## 🎨 UI/UX Features

### 📱 Responsive Design
- **Mobile-first approach** with breakpoints at 768px and 1024px
- **Touch-friendly interfaces** optimized for mobile devices
- **Adaptive layouts** that work seamlessly across all screen sizes

### 🌙 Modern Interface
- **Material Design** principles with custom theming
- **Consistent color palette** and typography
- **Smooth animations** and transitions
- **Intuitive navigation** with clear visual hierarchy

### ⚡ Performance Optimized
- **Efficient re-rendering** for real-time updates
- **Data pagination** for large device lists
- **Chart data throttling** for high-frequency telemetry
- **Lazy loading** for improved initial load times

## 🔌 API Integration

The dashboard integrates with the IoTFlow backend through RESTful APIs and WebSocket connections:

### REST API Endpoints
```javascript
// Device Management
GET    /api/devices              // Get all devices
POST   /api/devices              // Create new device
PUT    /api/devices/:id          // Update device
DELETE /api/devices/:id          // Delete device
POST   /api/devices/:id/regenerate-key // Regenerate API key

// Telemetry Data
GET    /api/telemetry/:deviceId  // Get device telemetry
GET    /api/telemetry/:deviceId/aggregate/:type // Get aggregated data
GET    /api/telemetry/:deviceId/export/:format  // Export data

// MQTT Management
GET    /api/mqtt/status          // Get MQTT broker status
GET    /api/mqtt/topics          // Get active topics
GET    /api/mqtt/messages/:topic // Get topic messages

// System Administration
GET    /api/admin/health         // Get system health
GET    /api/admin/stats          // Get system statistics
GET    /api/admin/logs           // Get system logs
POST   /api/admin/cache/clear    // Clear cache
```

### WebSocket Events
```javascript
// Real-time data streaming
'telemetry_data'    // Device telemetry updates
'device_status'     // Device status changes
'mqtt_status'       // MQTT broker updates
'system_alerts'     // System notifications
```

## 🛡️ Security Features

- **Token-based authentication** with secure storage
- **API request interceptors** with automatic token refresh
- **Rate limiting indicators** to prevent API abuse
- **Secure API key management** with regeneration capabilities
- **Input validation** and sanitization
- **HTTPS ready** for production deployments

## 🚀 Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t iotflow-dashboard .

# Run container
docker run -p 3000:3000 -e REACT_APP_API_URL=https://your-backend-url iotflow-dashboard
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 📖 Component Documentation

### Authentication Context
```javascript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();
  // Component logic
}
```

### WebSocket Context
```javascript
import { useWebSocket } from './contexts/WebSocketContext';

function MyComponent() {
  const { connected, telemetryData, subscribeToDevice } = useWebSocket();
  // Component logic
}
```

### API Service
```javascript
import apiService from './services/apiService';

// Get devices
const devices = await apiService.getDevices();

// Create device
const newDevice = await apiService.createDevice(deviceData);
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@iotflow.com
- 📖 Documentation: [docs.iotflow.com](https://docs.iotflow.com)
- 🐛 Bug Reports: [GitHub Issues](https://github.com/iotflow/dashboard/issues)

## 🎯 Roadmap

- [ ] **Multi-tenant Support** - Organization and user management
- [ ] **Advanced Alerting** - Complex rule-based alerting system
- [ ] **Mobile App** - Native mobile application
- [ ] **Machine Learning** - Predictive analytics and anomaly detection
- [ ] **Custom Widgets** - Drag-and-drop dashboard builder
- [ ] **API Rate Limiting** - Enhanced rate limiting and throttling
- [ ] **Audit Logging** - Comprehensive action logging and auditing

---

**IoTFlow Dashboard** - Professional IoT Platform Management
Built with ❤️ using React and Material-UI
# IoTFlow-dashboard
