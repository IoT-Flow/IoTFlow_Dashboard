const express = require('express');
const DeviceGroupController = require('../controllers/deviceGroupController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.post('/', verifyToken, DeviceGroupController.createGroup);
router.get('/', verifyToken, DeviceGroupController.getAllGroups);
router.get('/:id', verifyToken, DeviceGroupController.getGroup);
router.put('/:id', verifyToken, DeviceGroupController.updateGroup);
router.delete('/:id', verifyToken, DeviceGroupController.deleteGroup);

// Device management within groups
router.post('/:id/devices', verifyToken, DeviceGroupController.addDeviceToGroup);
router.delete('/:id/devices/:deviceId', verifyToken, DeviceGroupController.removeDeviceFromGroup);

module.exports = router;
