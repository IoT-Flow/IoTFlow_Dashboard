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

## 🛠️ Quick Start (Cross-Platform)

### Prerequisites
- **Node.js** 16.0+ ([Download](https://nodejs.org/))
- **Git** latest version
- **Chrome/Firefox** for optimal experience

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd Dashboard_IoTFlow

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm start
```

### Environment Setup
Create `.env.local` file:
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_DEBUG=true
```

> 📋 For detailed cross-platform setup instructions, see [SETUP.md](./SETUP.md)

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

