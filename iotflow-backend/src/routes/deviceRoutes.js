const express = require('express');
const DeviceController = require('../controllers/deviceController');
const { verifyApiKey } = require('../middlewares/authMiddleware');

const router = express.Router();

// Device CRUD routes (API key authentication)
router.post('/', verifyApiKey, DeviceController.createDevice);
router.get('/', verifyApiKey, DeviceController.getAllDevices);
router.get('/:id', verifyApiKey, DeviceController.getDevice);
router.put('/:id', verifyApiKey, DeviceController.updateDevice);
router.delete('/:id', verifyApiKey, DeviceController.deleteDevice);

// Device status management
router.patch('/:id/status', verifyApiKey, DeviceController.updateDeviceStatus);

// Device configuration management
router.get('/:id/configurations', verifyApiKey, DeviceController.getDeviceConfigurations);
router.put('/:id/configurations', verifyApiKey, DeviceController.updateDeviceConfiguration);

module.exports = router;