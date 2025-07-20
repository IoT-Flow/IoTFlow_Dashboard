const express = require('express');
const DeviceController = require('../controllers/deviceController');
const { verifyToken } = require('../middlewares/authMiddleware'); // Changed to verifyToken for user-based auth

const router = express.Router();

// Device CRUD routes - Protected by user authentication
router.post('/', verifyToken, DeviceController.createDevice);
router.get('/', verifyToken, DeviceController.getAllDevices);
router.get('/:id', verifyToken, DeviceController.getDevice);
router.put('/:id', verifyToken, DeviceController.updateDevice);
router.delete('/:id', verifyToken, DeviceController.deleteDevice);

// Device configuration management
router.get('/:id/configuration', verifyToken, DeviceController.getDeviceConfiguration);
router.put('/:id/configuration', verifyToken, DeviceController.updateDeviceConfiguration);

module.exports = router;