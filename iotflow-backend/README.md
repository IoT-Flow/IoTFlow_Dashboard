# IoTFlow Backend

## Overview
The IoTFlow Backend is a RESTful API designed for managing users and devices in an IoT environment. This application provides endpoints for user management, device management, and authentication.

## Project Structure
```
iotflow-backend
├── src
│   ├── controllers          # Contains the logic for handling requests
│   │   ├── deviceController.js
│   │   └── userController.js
│   ├── models               # Defines the data models for users and devices
│   │   ├── device.js
│   │   └── user.js
│   ├── routes               # Defines the API routes
│   │   ├── deviceRoutes.js
│   │   └── userRoutes.js
│   ├── middlewares          # Contains middleware functions for authentication
│   │   └── authMiddleware.js
│   ├── utils                # Utility functions for database operations
│   │   └── db.js
│   ├── app.js               # Initializes the Express application
│   └── server.js            # Entry point for starting the server
├── package.json             # NPM configuration file
├── .env                     # Environment variables
└── README.md                # Project documentation
```

## Setup Instructions
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