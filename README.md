# 🚀 IoTFlow Dashboard

> **Enterprise IoT Management Platform** - A comprehensive, production-ready solution for managing IoT devices, monitoring telemetry data, and controlling smart systems in real-time.

![IoTFlow Dashboard](https://img.shields.io/badge/Version-2.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18.2+-blue.svg)
![Production Ready](https://img.shields.io/badge/Production-Ready-green.svg)

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [🐳 Deployment](#-deployment)
- [📚 API Documentation](#-api-documentation)
- [🔧 Configuration](#-configuration)
- [🔒 Security](#-security)
- [🧪 Testing](#-testing)
- [📖 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## ✨ Features

### 📊 **Real-time Dashboard**

- **Live Telemetry Monitoring** - Real-time data visualization with WebSocket connectivity
- **Interactive Charts** - 15+ chart types including gauges, heatmaps, and specialized IoT widgets
- **Multi-tenant Support** - User-based device and data isolation
- **Responsive Design** - Mobile-first, enterprise-grade Material-UI interface

### 🎛️ **Device Management**

- **Device Registration & Control** - Add, configure, and manage IoT devices
- **Status Monitoring** - Real-time device health and connectivity status
- **Command Execution** - Send commands and receive responses from devices
- **Device Grouping** - Organize devices by type, location, or custom criteria

### 📈 **Analytics & Visualization**

- **Custom Chart Builder** - Drag-and-drop chart creation with multiple data sources
- **Historical Data Analysis** - Time-series data with flexible time ranges
- **Export Capabilities** - Export data and visualizations in multiple formats
- **Alerting System** - Real-time notifications and threshold-based alerts

### 🔒 **Security & Authentication**

- **JWT-based Authentication** - Secure token-based user authentication
- **Role-based Access Control** - Admin and user roles with granular permissions
- **API Rate Limiting** - Protection against abuse and DoS attacks
- **Data Encryption** - Secure data transmission and storage

### 🚀 **Performance & Scalability**

- **WebSocket Integration** - Real-time bidirectional communication
- **Optimized Data Handling** - Efficient data processing and caching
- **Production-Ready** - Clean code, error handling, and monitoring
- **IoTDB Integration** - High-performance time-series database support
- **WebSocket Integration** - Real-time bidirectional communication
- **Optimized Data Handling** - Efficient data processing and caching
- **Containerized Deployment** - Docker support for easy deployment
- **IoTDB Integration** - High-performance time-series database support

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React.js      │    │   Node.js       │    │   SQLite/IoTDB  │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│   (Port 3000)   │    │   (Port 3001)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │              ┌─────────────────┐               │
         │              │   WebSocket     │               │
         └──────────────►│   Server        │◄──────────────┘
                        │   (Port 3001)   │
                        └─────────────────┘
```

### **Technology Stack**

**Frontend:**

- React 18.2+ with hooks and functional components
- Material-UI 5.11+ for consistent design system
- ECharts & Recharts for data visualization
- WebSocket client for real-time communication
- React Router for single-page application routing

**Backend:**

- Node.js 18+ with Express.js framework
- SQLite for development, IoTDB for production
- WebSocket server for real-time communication
- JWT for authentication and authorization
- bcrypt for secure password hashing

**Infrastructure:**

- Docker & Docker Compose for containerization
- Nginx for production web server
- Environment-based configuration management
- Automated deployment scripts

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18+ and npm
- Git
- Docker (optional, but recommended for production)

### **Option 1: Production Deployment**

```bash
# 1. Clone the repository
git clone <repository-url>
cd Dashboard_IoTFlow

# 2. Setup environment variables
cp iotflow-backend/.env.example iotflow-backend/.env
cp iotflow-frontend/.env.example iotflow-frontend/.env

# 3. Edit .env files with your production values
# Important: Change JWT_SECRET, SESSION_SECRET, and database credentials

# 4. Install and build
npm run install:all
npm run build:all

# 5. Start production servers
npm run start:prod
```

### **Option 2: Docker Deployment (Recommended)**

```bash
# 1. Clone and configure
git clone <repository-url>
cd Dashboard_IoTFlow

# 2. Configure environment
cp iotflow-backend/.env.example iotflow-backend/.env
cp iotflow-frontend/.env.example iotflow-frontend/.env

# 3. Deploy with Docker
docker-compose up -d
```

### **Option 3: Development Setup**

```bash
# 1. Install dependencies
npm run install:all

# 2. Setup development environment
npm run dev
```

**Access the application:**

- 🌐 **Dashboard**: http://localhost:3000
- 🔧 **API**: http://localhost:3001/api
- 📡 **WebSocket**: ws://localhost:3001/ws

### **Default Credentials**

- **Username:** `admin`
- **Password:** `admin123`

> ⚠️ **Important**: Change default credentials immediately after first login!

## ⚙️ Environment Configuration

### **Backend Environment Variables**

Copy `iotflow-backend/.env.example` to `iotflow-backend/.env` and configure:

```bash
# Security (MUST CHANGE IN PRODUCTION)
JWT_SECRET=your_super_secure_jwt_secret
SESSION_SECRET=your_session_secret

# Database
DB_PATH=./src/database.sqlite
# DATABASE_URL=postgresql://user:pass@host:port/db  # For PostgreSQL

# Server
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-domain.com
```

### **Frontend Environment Variables**

Copy `iotflow-frontend/.env.example` to `iotflow-frontend/.env` and configure:

```bash
# API Configuration
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_WS_URL=wss://your-api-domain.com/ws

# Application
REACT_APP_ENVIRONMENT=production
```

cd iotflow-backend
npm run dev # Start with nodemon
npm test # Run tests
npm run lint # Check code quality

# Frontend development

cd iotflow-frontend
npm start # Start development server
npm test # Run tests
npm run build # Create production build

```

### **Code Structure**

```

Dashboard_IoTFlow/
├── iotflow-backend/ # Node.js backend
│ ├── src/
│ │ ├── controllers/ # API controllers
│ │ ├── models/ # Database models
│ │ ├── routes/ # Express routes
│ │ ├── middlewares/ # Custom middleware
│ │ └── services/ # Business logic
│ ├── tests/ # Backend tests
│ └── package.json
├── iotflow-frontend/ # React frontend
│ ├── src/
│ │ ├── components/ # React components
│ │ ├── contexts/ # React contexts
│ │ ├── pages/ # Page components
│ │ └── services/ # API services
│ ├── public/ # Static assets
│ └── package.json
├── docker-compose.yml # Container orchestration
├── deploy.sh # Production deployment
└── dev-setup.sh # Development setup

````

## 🐳 Deployment

### **Production Deployment**

```bash
# Quick deployment
npm run deploy

# Or step by step:
npm run install:all
npm run build:all
npm run start:prod
````

### **Docker Deployment**

```bash
# Using Docker Compose (Recommended)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### **Manual Deployment**

```bash
# 1. Build applications
npm run build:all

# 2. Configure environment
# Edit .env files with production values

# 3. Initialize database
cd iotflow-backend && npm run init-db

# 4. Start services
npm run start:prod
```

## 🔒 Security

### **Important Security Steps**

1. **Change Default Secrets**: Update `JWT_SECRET` and `SESSION_SECRET` in `.env`
2. **Update CORS Origins**: Set `CORS_ORIGIN` to your production domain
3. **Use HTTPS**: Configure SSL certificates for production
4. **Database Security**: Use PostgreSQL with proper credentials for production
5. **Rate Limiting**: Configured and enabled by default

### **Default Credentials**

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Change immediately after first login!**

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT.md)** - Comprehensive deployment checklist
- **[Backend API](iotflow-backend/README.md)** - Backend API documentation
- **[Frontend](iotflow-frontend/README.md)** - Frontend component documentation
- **[Device Features](DEVICE_CONTROL_FEATURES.md)** - Device control capabilities

## 🔧 Configuration

### **Feature Flags**

Configure features via environment variables:

```bash
# Enable/disable features
REACT_APP_ENABLE_REAL_TIME=true
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_DEVICE_CONTROL=true
REACT_APP_ENABLE_NOTIFICATIONS=true

# Performance settings
REACT_APP_MAX_TELEMETRY_POINTS=1000
REACT_APP_REFRESH_INTERVAL=30000
REACT_APP_CHART_ANIMATION_DURATION=750
```

### **Database Configuration**

```bash
# SQLite (Development)
DATABASE_URL=sqlite:./src/database.sqlite

# IoTDB (Production)
IOTDB_HOST=localhost
IOTDB_PORT=6667
IOTDB_USERNAME=root
IOTDB_PASSWORD=root
```

## 🧪 Testing

```bash
# Backend tests
cd iotflow-backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Frontend tests
cd iotflow-frontend
npm test                    # Run React tests
npm run test:e2e           # End-to-end tests
```

### **Test Coverage**

- Unit tests for all API endpoints
- Component testing for React components
- Integration tests for WebSocket functionality
- End-to-end tests for critical user flows

## 📖 Documentation

- **[API Documentation](./iotflow-backend/API_DOCUMENTATION.md)** - Complete API reference
- **[Device Control Features](./DEVICE_CONTROL_FEATURES.md)** - Device management guide
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Development Guide](./docs/DEVELOPMENT.md)** - Development workflow and guidelines

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Guidelines**

- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support & Troubleshooting

### **Common Issues**

**Port Already in Use:**

```bash
# Find and kill processes using ports 3000/3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**WebSocket Connection Issues:**

- Check firewall settings
- Verify CORS configuration
- Ensure backend is running before frontend

**Database Issues:**

```bash
# Reset database
cd iotflow-backend
rm src/database.sqlite
npm run init-db
```

### **Getting Help**

- 📧 **Email**: support@iotflow.com
- 💬 **Discord**: [IoTFlow Community](https://discord.gg/iotflow)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

<div align="center">

**Made with ❤️ by the IoTFlow Team**

[![GitHub stars](https://img.shields.io/github/stars/your-repo/iotflow-dashboard.svg?style=social&label=Star)](https://github.com/your-repo/iotflow-dashboard)
[![Follow on Twitter](https://img.shields.io/twitter/follow/iotflow.svg?style=social)](https://twitter.com/iotflow)

</div>
