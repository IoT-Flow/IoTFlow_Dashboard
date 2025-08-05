const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all notifications for user
router.get('/', NotificationController.getNotifications);

// Get unread notification count
router.get('/unread-count', NotificationController.getUnreadCount);

// Get notification statistics
router.get('/stats', NotificationController.getNotificationStats);

// Mark notification as read
router.put('/:id/read', NotificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', NotificationController.markAllAsRead);

// Delete specific notification
router.delete('/:id', NotificationController.deleteNotification);

// Delete all notifications for user
router.delete('/', NotificationController.deleteAllNotifications);

module.exports = router;
