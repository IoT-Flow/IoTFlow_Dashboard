const express = require('express');
const AdminV1Controller = require('../controllers/adminV1Controller');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken, isAdmin);

// User management endpoints
router.get('/users', AdminV1Controller.getAllUsers);
router.get('/users/:id', AdminV1Controller.getUser);
router.post('/users', AdminV1Controller.createUser);
router.put('/users/:id', AdminV1Controller.updateUser);
router.delete('/users/:id', AdminV1Controller.deleteUser);
router.get('/users/:id/devices', AdminV1Controller.getUserDevices);

// Device management endpoints
router.get('/devices', AdminV1Controller.getAllDevices);
router.get('/devices/:id', AdminV1Controller.getDevice);
router.delete('/devices/:id', AdminV1Controller.deleteDevice);

// Statistics endpoint
router.get('/stats', AdminV1Controller.getStats);

module.exports = router;
