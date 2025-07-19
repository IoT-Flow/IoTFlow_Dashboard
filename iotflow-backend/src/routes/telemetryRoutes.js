const express = require('express');
const TelemetryController = require('../controllers/telemetryController');
const { verifyAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

// Telemetry data routes
router.post('/', verifyAuth, TelemetryController.submitTelemetry);
router.get('/device/:device_id', verifyAuth, TelemetryController.getTelemetryData);
router.get('/device/:device_id/aggregated', verifyAuth, TelemetryController.getAggregatedData);
router.get('/device/:device_id/latest', verifyAuth, TelemetryController.getLatestValues);

module.exports = router;
