const express = require('express');
const DeviceController = require('../controllers/deviceController');
const DeviceGroupController = require('../controllers/deviceGroupController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware'); // Changed to verifyToken for user-based auth

const router = express.Router();

// ============================================================================
// ADMIN DEVICE ROUTE REMOVED - USE /api/v1/admin/devices INSTEAD
// ============================================================================
// The following route has been removed to eliminate duplication with Admin V1 API:
// - GET /api/devices/admin/devices → Use GET /api/v1/admin/devices
// ============================================================================

// Device CRUD routes - Protected by user authentication
router.post('/', verifyToken, DeviceController.createDevice);
router.get('/', verifyToken, DeviceController.getAllDevices);
router.get('/:id', verifyToken, DeviceController.getDevice);
router.get('/:id/groups', verifyToken, DeviceGroupController.getDeviceGroups);
router.put('/:id', verifyToken, DeviceController.updateDevice);
router.delete('/:id', verifyToken, DeviceController.deleteDevice);

// Device configuration management
router.get('/:id/configuration', verifyToken, DeviceController.getDeviceConfiguration);
router.put('/:id/configuration', verifyToken, DeviceController.updateDeviceConfiguration);

// Real-time device status (from Redis)
router.get('/status/summary', verifyToken, DeviceController.getDevicesStatusSummary);
router.get('/:id/status/realtime', verifyToken, DeviceController.getDeviceRealtimeStatus);

// Device control endpoints removed - were using in-memory storage (not production-ready)
// These used global.deviceControls which is lost on restart
// Should be re-implemented with proper database tables and MQTT/WebSocket integration
// router.post('/:id/control', verifyToken, DeviceController.sendDeviceControl);
// router.get('/:id/control/:controlId/status', verifyToken, DeviceController.getControlStatus);
// router.get('/:id/control/pending', verifyToken, DeviceController.getPendingControls);

module.exports = router;
