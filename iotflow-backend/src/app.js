const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const chartRoutes = require('./routes/chartRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const deviceGroupRoutes = require('./routes/deviceGroupRoutes');
const adminV1Routes = require('./routes/adminV1Routes');
const { verifyApiKey } = require('./middlewares/authMiddleware');

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'X-File-Name',
      'X-User-ID',
      'x-user-id',
      'DNT',
      'User-Agent',
      'If-Modified-Since',
      'Range'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-Request-ID']
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.includes('/charts')) {
    console.log(`📊 Chart API: ${req.method} ${req.path}`);
    console.log('📊 Headers:', JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('📊 Body:', JSON.stringify(req.body, null, 2));
    }
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/groups', deviceGroupRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/notifications', notificationRoutes);

// Admin V1 API routes (dedicated admin namespace)
app.use('/api/v1/admin', adminV1Routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
