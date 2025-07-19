const express = require('express');
const TelemetryController = require('../controllers/telemetryController');
const { verifyApiKey } = require('../middlewares/authMiddleware');

const router = express.Router();

// Telemetry data routes
router.post('/', verifyApiKey, TelemetryController.submitTelemetry);
router.get('/device/:device_id', verifyApiKey, TelemetryController.getTelemetryData);
router.get('/device/:device_id/aggregated', verifyApiKey, TelemetryController.getAggregatedData);
router.get('/device/:device_id/latest', verifyApiKey, TelemetryController.getLatestValues);

module.exports = router;
