# 🚀 IoTFlow Backend API

> **Production-Ready Backend API** - Enterprise-grade RESTful API for IoT device management, real-time telemetry, and user authentication.

![Version](https://img.shields.io/badge/Version-2.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Production Ready](https://img.shields.io/badge/Production-Ready-green.svg)

## 📋 Overview

The IoTFlow Backend is a comprehensive RESTful API providing:

- **User Authentication & Authorization** - JWT-based secure authentication
- **Device Management** - Complete CRUD operations for IoT devices
- **Real-time Telemetry** - WebSocket support for live data streaming
- **Chart & Dashboard APIs** - Custom visualization support
- **Notification System** - Real-time alerts and notifications
- **Rate Limiting & Security** - Production-ready security measures

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│               IoTFlow API               │
├─────────────────────────────────────────┤
│  Authentication │  Device Management    │
│  User Management │  Telemetry Data      │
│  Charts & Dashboards │ Notifications    │
├─────────────────────────────────────────┤
│          WebSocket Server              │
├─────────────────────────────────────────┤
│       SQLite/PostgreSQL Database       │
└─────────────────────────────────────────┘
```

## 📁 Project Structure

```
iotflow-backend/
├── src/
│   ├── controllers/         # Request handlers and business logic
│   │   ├── userController.js
│   │   ├── deviceController.js
│   │   ├── telemetryController.js
│   │   ├── chartController.js
│   │   ├── dashboardController.js
│   │   └── notificationController.js
│   ├── models/             # Database models and schemas
│   │   ├── user.js
│   │   ├── device.js
│   │   ├── telemetryData.js
│   │   ├── chart.js
│   │   └── notification.js
│   ├── routes/             # API route definitions
│   │   ├── userRoutes.js
│   │   ├── deviceRoutes.js
│   │   ├── telemetryRoutes.js
│   │   ├── chartRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── notificationRoutes.js
│   ├── middlewares/        # Custom middleware functions
│   │   └── authMiddleware.js
│   ├── services/           # Business logic services
│   │   └── notificationService.js
│   ├── utils/              # Utility functions and helpers
│   │   ├── db.js
│   │   └── iotdbClient.js
│   ├── app.js              # Express application setup
│   └── server.js           # Server entry point
├── scripts/                # Database initialization scripts
│   └── initDatabase.js
├── Dockerfile              # Production Docker configuration
├── .env.example            # Environment variables template
├── package.json            # Dependencies and scripts
└── README.md              # This documentation
```

1. **Clone the repository**

   ```
   git clone <repository-url>
   cd iotflow-backend
   ```

2. **Install dependencies**

   ```
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory and add your database connection string and any other necessary environment variables.

4. **Start the server**
   ```
   npm start
   ```

## API Endpoints

### Health Check

- **GET /health**: Check API health status

### Authentication & User Management

- **POST /api/auth/register**: Register a new user
- **POST /api/auth/login**: Login and receive JWT token
- **GET /api/auth/profile**: Get user profile (requires API key)
- **PUT /api/auth/profile**: Update user profile (requires API key)
- **POST /api/auth/refresh-api-key**: Refresh API key (requires API key)

#### Admin User Management

- **POST /api/users**: Create user (admin only)
- **GET /api/users/:id**: Get user by ID (admin only)
- **PUT /api/users/:id**: Update user by ID (admin only)
- **DELETE /api/users/:id**: Delete user by ID (admin only)

### Device Management

- **POST /api/devices**: Create device
- **GET /api/devices**: Get all devices
- **GET /api/devices/:id**: Get device by ID
- **PUT /api/devices/:id**: Update device by ID
- **DELETE /api/devices/:id**: Delete device by ID
- **GET /api/devices/:id/configuration**: Get device configuration
- **PUT /api/devices/:id/configuration**: Update device configuration

### Telemetry Data

- **POST /api/telemetry**: Submit telemetry data
- **GET /api/telemetry/device/:device_id**: Get telemetry data for device
- **GET /api/telemetry/device/:device_id/aggregated**: Get aggregated telemetry data for device

### Dashboard & Analytics

- **GET /api/dashboard/overview**: Get dashboard overview
- **GET /api/dashboard/activity**: Get device activity
- **GET /api/dashboard/alerts**: Get system alerts
- **GET /api/dashboard/health**: Get system health metrics

---

For detailed request/response formats, authentication, and examples, see `API_DOCUMENTATION.md`.

## License

This project is licensed under the MIT License.
