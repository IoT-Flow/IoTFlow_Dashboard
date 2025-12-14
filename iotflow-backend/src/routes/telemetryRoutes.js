const express = require('express');
const TelemetryController = require('../controllers/telemetryController');
const { verifyApiKey, verifyToken } = require('../middlewares/authMiddleware'); // Use API key for device-sent data

const router = express.Router();

// Health check for IoTDB connectivity (must be before parameterized routes)
router.get('/health', TelemetryController.healthCheck);

// Today's message count (used by dashboard)
router.get('/today/count', verifyToken, TelemetryController.getTodayMessageCount);

// Test notification endpoint removed - was security risk (development only)
// router.post('/test-notification', verifyToken, isAdmin, TelemetryController.generateTestNotification);

// Aggregated data route (must be before generic device_id route)
router.get('/device/:device_id/aggregated', TelemetryController.getAggregatedData);

// Telemetry data routes
router.post('/', verifyApiKey, TelemetryController.submitTelemetry); // Device submits telemetry
router.get('/:device_id', TelemetryController.getTelemetryData); // User views telemetry

module.exports = router;
