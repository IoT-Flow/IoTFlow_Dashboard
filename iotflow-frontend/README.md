# 🌐 IoTFlow Dashboard Frontend

> **Enterprise-Grade React Dashboard** - Modern, responsive, and production-ready frontend for comprehensive IoT device management and real-time monitoring.

![IoTFlow Dashboard](https://img.shields.io/badge/IoTFlow-Dashboard-blue) ![React](https://img.shields.io/badge/React-18.2.0-blue) ![Material-UI](https://img.shields.io/badge/Material--UI-5.11-blue) ![Production Ready](https://img.shields.io/badge/Production-Ready-green.svg)

## ✨ Features

### 🔐 **Authentication & Security**
- **JWT Authentication** - Secure token-based authentication system
- **Role-based Access Control** - Admin and user-level permissions
- **Session Management** - Automatic token refresh and secure logout
- **API Integration** - Seamless backend API communication

### 📱 **Device Management**
- **Device Registration** - Comprehensive device onboarding interface
- **Real-time Status** - Live device status monitoring and health checks
- **Device Control** - Send commands and receive responses
- **Bulk Operations** - Multi-device management capabilities
- **Device Grouping** - Organize devices by type, location, or custom criteria

### 📊 **Real-time Analytics**
- **Live Telemetry** - Real-time data visualization with WebSocket connectivity
- **Interactive Charts** - 15+ chart types with ECharts integration
- **Custom Dashboards** - Drag-and-drop dashboard builder
- **Historical Analysis** - Time-series data with flexible date ranges
- **Data Export** - CSV, JSON, and image export functionality
- **Alert System** - Real-time notifications and threshold alerts

### 🎨 **User Experience**
- **Material Design** - Clean, modern UI with Material-UI components
- **Responsive Layout** - Mobile-first design optimized for all devices
- **Dark/Light Theme** - Theme switching capabilities
- **Performance Optimized** - Lazy loading, code splitting, and caching

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
- **Interactive Charts**: ECharts powered time-series visualizations
- **Trend Analysis**: Statistical trends and anomaly detection
- **Custom Queries**: IoTDB query builder interface
- **Data Correlations**: Multi-device data comparison tools
- **Performance Reports**: Comprehensive analytics and reporting

## 🛠️ Technology Stack

### Frontend
- **React 18.2** - Modern React with hooks and functional components
- **Material-UI 5.11** - Professional UI component library
- **Apache ECharts 5.4** - Professional-grade interactive and responsive charts
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

