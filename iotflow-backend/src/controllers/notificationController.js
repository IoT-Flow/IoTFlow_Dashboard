const Notification = require('../models/notification');
const Device = require('../models/device');
const { Op } = require('sequelize');

class NotificationController {
  // Get all notifications for the authenticated user
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 50,
        unread_only = false,
        type = null,
        source = null
      } = req.query;

      const offset = (page - 1) * limit;

      const whereClause = { user_id: userId };

      if (unread_only === 'true') {
        whereClause.is_read = false;
      }

      if (type) {
        whereClause.type = type;
      }

      if (source) {
        whereClause.source = source;
      }

      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Device,
            as: 'device',
            attributes: ['id', 'name', 'device_type', 'status'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.status(200).json({
        success: true,
        data: {
          notifications,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }
  }

  // Get unread notification count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await Notification.count({
        where: {
          user_id: userId,
          is_read: false
        }
      });

      res.status(200).json({
        success: true,
        data: {
          unread_count: count
        }
      });

    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count',
        error: error.message
      });
    }
  }

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const notification = await Notification.findOne({
        where: {
          id,
          user_id: userId
        }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      await notification.update({
        is_read: true,
        read_at: new Date()
      });

      res.status(200).json({
        success: true,
        data: notification
      });

    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await Notification.update(
        {
          is_read: true,
          read_at: new Date()
        },
        {
          where: {
            user_id: userId,
            is_read: false
          }
        }
      );

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
      });

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  }

  // Delete a notification
  async deleteNotification(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const deleted = await Notification.destroy({
        where: {
          id,
          user_id: userId
        }
      });

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  }

  // Delete all notifications for user
  async deleteAllNotifications(req, res) {
    try {
      const userId = req.user.id;

      await Notification.destroy({
        where: {
          user_id: userId
        }
      });

      res.status(200).json({
        success: true,
        message: 'All notifications deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting all notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete all notifications',
        error: error.message
      });
    }
  }

  // Get notification statistics
  async getNotificationStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await Notification.findAll({
        where: { user_id: userId },
        attributes: [
          'type',
          [Notification.sequelize.fn('COUNT', Notification.sequelize.col('id')), 'count']
        ],
        group: ['type']
      });

      const totalCount = await Notification.count({
        where: { user_id: userId }
      });

      const unreadCount = await Notification.count({
        where: {
          user_id: userId,
          is_read: false
        }
      });

      res.status(200).json({
        success: true,
        data: {
          total: totalCount,
          unread: unreadCount,
          by_type: stats.reduce((acc, stat) => {
            acc[stat.type] = parseInt(stat.dataValues.count);
            return acc;
          }, {})
        }
      });

    } catch (error) {
      console.error('Error fetching notification stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification statistics',
        error: error.message
      });
    }
  }
}

module.exports = new NotificationController();
