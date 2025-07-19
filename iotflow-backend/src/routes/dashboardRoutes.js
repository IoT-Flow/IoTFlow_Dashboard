const express = require('express');
const DashboardController = require('../controllers/dashboardController');
const { verifyApiKey } = require('../middlewares/authMiddleware');

const router = express.Router();

// Dashboard routes
router.get('/overview', verifyApiKey, DashboardController.getOverview);
router.get('/activity', verifyApiKey, DashboardController.getDeviceActivity);
router.get('/alerts', verifyApiKey, DashboardController.getAlerts);
router.get('/health', verifyApiKey, DashboardController.getSystemHealth);

module.exports = router;
