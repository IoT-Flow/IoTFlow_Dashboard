# IoTFlow Dashboard - Deployment Guide

## 🚀 Quick Start

The IoTFlow Dashboard is now ready to run! Here's how to get started:

### 1. **Development Server**
```bash
cd /home/omar-bouattour/Desktop/Dhashboard_IoTFlow
npm start
```

The development server will start on an available port (likely 3001 since 3000 is occupied).

### 2. **Access the Dashboard**
- Open your browser and navigate to `http://localhost:3001` (or the port shown in terminal)
- Use the demo token: `demo-admin-token-2025`

## 📋 Features Overview

### 🔐 **Authentication System**
- Secure token-based authentication
- Demo credentials provided for immediate testing
- Role-based access control

### 📊 **Main Dashboard Pages**

#### 🏠 **Overview Page**
- System health indicators
- Real-time metrics dashboard
- Device status distribution charts
- Recent alerts and notifications
- Quick action buttons

#### 🔌 **Device Management**
- Complete device lifecycle management
- Device registration with comprehensive forms
- API key generation and rotation
- Bulk operations for multiple devices
- Status management (Active, Inactive, Maintenance, Error)
- Advanced filtering and search capabilities

#### 📈 **Telemetry Monitoring**
- Real-time data visualization with Chart.js
- Historical data analysis
- Multi-device comparison
- Custom time range selection
- Data export (CSV/JSON)
- Automated alerts and thresholds

#### 📡 **MQTT Monitoring**
- Real-time MQTT broker status
- Topic subscription monitoring
- Live message inspection
- Connection management
- Performance metrics visualization

#### 📊 **Advanced Analytics**
- Trend analysis and forecasting
- Custom IoTDB query builder
- Data correlation analysis
- Performance reporting
- Saved queries management

#### ⚙️ **System Administration**
- Service health monitoring
- Performance metrics tracking
- Cache management (Redis)
- System logs viewer
- Maintenance operations

## 🎨 **UI/UX Features**

### 📱 **Responsive Design**
- Mobile-first approach
- Touch-friendly interfaces
- Adaptive layouts for all screen sizes
- Breakpoints: 768px (tablet), 1024px (desktop)

### 🎨 **Modern Interface**
- Material-UI 5 design system
- Consistent color palette and typography
- Smooth animations and transitions
- Dark/light theme support ready

### ⚡ **Performance Optimized**
- Efficient real-time updates
- Data pagination for large datasets
- Chart data throttling
- Lazy loading capabilities

## 🔧 **Technology Stack**

### **Frontend**
- ⚛️ **React 18.2** - Modern React with hooks
- 🎨 **Material-UI 5.11** - Professional UI components
- 📊 **Chart.js 4.2** - Interactive charts
- 🔌 **Socket.io Client** - Real-time communication
- 🛣️ **React Router 6** - Client-side routing
- 📡 **Axios** - HTTP client

### **Real-time Features**
- 🔄 **WebSocket** - Live data streaming
- 📡 **Server-Sent Events** - System notifications
- ⏱️ **Auto-refresh** - Configurable intervals

## 📁 **Project Structure**

```
src/
├── components/          # Reusable UI components
│   └── Layout/         # Layout components (Sidebar, TopBar)
├── contexts/           # React Context providers
│   ├── AuthContext.js  # Authentication state
│   └── WebSocketContext.js # Real-time data
├── pages/              # Main application pages
│   ├── Overview.js     # Dashboard overview
│   ├── Devices.js      # Device management
│   ├── Telemetry.js    # Data visualization
│   ├── MQTT.js         # MQTT monitoring
│   ├── Analytics.js    # Advanced analytics
│   ├── Admin.js        # System administration
│   └── Login.js        # Authentication
├── services/           # API and external services
│   └── apiService.js   # HTTP API client
├── App.js              # Main application component
├── index.js            # Application entry point
└── index.css           # Global styles
```

## 🔑 **Demo Data & Authentication**

### **Demo Credentials**
- **Token**: `demo-admin-token-2025`
- **Role**: Administrator
- **Access**: Full system access

### **Mock Data Included**
- 5 sample IoT devices with different types
- Historical telemetry data
- MQTT broker simulation
- System health metrics
- Performance statistics

## 🌐 **API Integration**

The dashboard is designed to integrate with the IoTFlow backend:

### **Backend Requirements**
- **Flask** API server
- **IoTDB** for time-series data
- **Redis** for caching
- **MQTT** broker for real-time messaging

### **API Endpoints Expected**
```
/api/devices/*          # Device management
/api/telemetry/*        # Telemetry data
/api/mqtt/*             # MQTT monitoring
/api/admin/*            # System administration
/api/analytics/*        # Analytics and reporting
```

### **WebSocket Events**
```
telemetry_data         # Real-time telemetry
device_status         # Device status updates
mqtt_status           # MQTT broker events
system_alerts         # System notifications
```

## 🚀 **Production Deployment**

### **Build for Production**
```bash
npm run build
```

### **Environment Variables**
```env
REACT_APP_API_URL=https://your-backend.com/api
REACT_APP_WS_URL=wss://your-backend.com
REACT_APP_ENV=production
```

### **Docker Deployment**
```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📱 **Mobile Support**

The dashboard is fully responsive and optimized for:
- 📱 **Mobile phones** (320px+)
- 📱 **Tablets** (768px+)
- 💻 **Desktop** (1024px+)
- 🖥️ **Large screens** (1440px+)

## 🔍 **Key Features Demonstration**

### **Device Management**
1. Navigate to "Devices" page
2. Click "Add Device" to register new devices
3. Use bulk operations for multiple devices
4. View API keys and regenerate them
5. Filter and search devices

### **Real-time Monitoring**
1. Go to "Telemetry" page
2. Select devices and time ranges
3. Watch live data updates
4. Export data in CSV/JSON formats
5. Set up custom alerts

### **MQTT Monitoring**
1. Visit "MQTT" page
2. Monitor broker status and performance
3. Inspect live message traffic
4. View topic subscriptions
5. Track connection metrics

### **System Administration**
1. Access "Admin" page
2. Monitor system health
3. View service status
4. Manage Redis cache
5. Review system logs

## 🎯 **Next Steps**

1. **Backend Integration**: Connect to your IoTFlow backend
2. **Authentication**: Configure production authentication
3. **Customization**: Adapt styling and branding
4. **Features**: Add custom widgets and analytics
5. **Deployment**: Deploy to production environment

## 🆘 **Troubleshooting**

### **Common Issues**
- **Port conflicts**: Use `PORT=3001 npm start`
- **Dependencies**: Run `npm install` if modules missing
- **Build errors**: Check Node.js version (16+ required)

### **Performance Tips**
- Enable chart data throttling for high-frequency data
- Use pagination for large device lists
- Implement data caching for better responsiveness

---

**🎉 Your IoTFlow Dashboard is ready!**

Access it at `http://localhost:3001` and start exploring the comprehensive IoT management features.
