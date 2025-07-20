const express = require('express');
const TelemetryController = require('../controllers/telemetryController');
const { verifyApiKey } = require('../middlewares/authMiddleware'); // Use API key for device-sent data

const router = express.Router();

// Telemetry data routes
router.post('/', verifyApiKey, TelemetryController.submitTelemetry); // Device submits telemetry
router.get('/device/:device_id', TelemetryController.getTelemetryData); // User views telemetry
router.get('/device/:device_id/aggregated', TelemetryController.getAggregatedData); // User views aggregated data

module.exports = router;
