const EventEmitter = require('events');
const Notification = require('../models/notification');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.wsConnections = new Map(); // userId -> WebSocket connection
  }

  // Register WebSocket connection for a user
  registerConnection(userId, ws) {
    this.wsConnections.set(userId, ws);
    console.log(`🔌 WebSocket registered for user ${userId}`);

    // Note: Removed automatic "Real-time notifications are now active" notification
    // to reduce notification noise for users
  }

  // Unregister WebSocket connection
  unregisterConnection(userId) {
    this.wsConnections.delete(userId);
    console.log(`🔌 WebSocket unregistered for user ${userId}`);
  }

  // Create and save notification to database, then send via WebSocket
  async createNotification(userId, notificationData) {
    try {
      // Save to database
      const notification = await Notification.create({
        user_id: userId,
        type: notificationData.type || 'info',
        title: notificationData.title || 'Notification',
        message: notificationData.message,
        device_id: notificationData.device_id || null,
        source: notificationData.source || 'system',
        metadata: notificationData.metadata || null,
      });

      console.log(`💾 Saved notification to database for user ${userId}: ${notification.title}`);

      // Send via WebSocket if user is connected
      this.sendWebSocketNotification(userId, notification);

      return notification;
    } catch (error) {
      console.error(`❌ Failed to create notification for user ${userId}:`, error);
      return null;
    }
  }

  // Send notification to specific user via WebSocket
  sendWebSocketNotification(userId, notification) {
    const ws = this.wsConnections.get(userId);
    if (ws && ws.readyState === 1) {
      // WebSocket.OPEN
      try {
        ws.send(
          JSON.stringify({
            type: 'notification',
            data: {
              id: notification.id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              device_id: notification.device_id,
              source: notification.source,
              is_read: notification.is_read,
              created_at: notification.created_at,
              user_id: userId,
            },
          })
        );
        console.log(`🔔 Sent WebSocket notification to user ${userId}: ${notification.title}`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to send WebSocket notification to user ${userId}:`, error);
        this.wsConnections.delete(userId); // Remove dead connection
        return false;
      }
    }
    console.log(
      `📡 User ${userId} not connected via WebSocket, notification saved to database only`
    );
    return false;
  }

  // Device-related notifications
  async notifyDeviceCreated(userId, device) {
    return await this.createNotification(userId, {
      type: 'success',
      title: 'Device Created',
      message: `Device "${device.name}" has been created successfully`,
      device_id: device.id,
      source: 'device_management',
      metadata: { action: 'create', device_type: device.device_type },
    });
  }

  async notifyDeviceDeleted(userId, deviceName, deviceId) {
    return await this.createNotification(userId, {
      type: 'info',
      title: 'Device Deleted',
      message: `Device "${deviceName}" has been deleted`,
      device_id: deviceId,
      source: 'device_management',
      metadata: { action: 'delete', device_name: deviceName },
    });
  }

  async notifyDeviceUpdated(userId, device) {
    return await this.createNotification(userId, {
      type: 'info',
      title: 'Device Updated',
      message: `Device "${device.name}" configuration has been updated`,
      device_id: device.id,
      source: 'device_management',
      metadata: { action: 'update', device_type: device.device_type },
    });
  }

  async notifyDeviceConnected(userId, device) {
    return await this.createNotification(userId, {
      type: 'success',
      title: 'Device Online',
      message: `Device "${device.name}" is now online`,
      device_id: device.id,
      source: 'device_status',
      metadata: { action: 'connect', device_type: device.device_type },
    });
  }

  async notifyDeviceDisconnected(userId, device) {
    return await this.createNotification(userId, {
      type: 'warning',
      title: 'Device Offline',
      message: `Device "${device.name}" has gone offline`,
      device_id: device.id,
      source: 'device_status',
      metadata: { action: 'disconnect', device_type: device.device_type },
    });
  }

  // Telemetry-related notifications
  async notifyDataReceived(userId, device, dataType, value) {
    // Only notify for significant events, not every data point
    if (this.isSignificantReading(dataType, value)) {
      return await this.createNotification(userId, {
        type: 'info',
        title: 'Significant Data Reading',
        message: `New ${dataType} reading: ${value} from "${device.name}"`,
        device_id: device.id,
        source: 'telemetry',
        metadata: { data_type: dataType, value: value },
      });
    }
    return null;
  }

  async notifyDataAnomaly(userId, device, dataType, value, threshold) {
    return await this.createNotification(userId, {
      type: 'warning',
      title: 'Data Anomaly Detected',
      message: `${dataType} reading (${value}) exceeds threshold (${threshold}) on "${device.name}"`,
      device_id: device.id,
      source: 'anomaly_detection',
      metadata: { data_type: dataType, value: value, threshold: threshold },
    });
  }

  async notifyDataError(userId, device, error) {
    return await this.createNotification(userId, {
      type: 'error',
      title: 'Data Processing Error',
      message: `Data processing error for "${device.name}": ${error}`,
      device_id: device.id,
      source: 'data_processing',
      metadata: { error: error },
    });
  }

  // Chart-related notifications
  async notifyChartCreated(userId, chartName) {
    return await this.createNotification(userId, {
      type: 'success',
      title: 'Chart Created',
      message: `Chart "${chartName}" has been created successfully`,
      device_id: null,
      source: 'chart_management',
      metadata: { action: 'create', chart_name: chartName },
    });
  }

  async notifyChartDeleted(userId, chartName) {
    return await this.createNotification(userId, {
      type: 'info',
      title: 'Chart Deleted',
      message: `Chart "${chartName}" has been deleted`,
      device_id: null,
      source: 'chart_management',
      metadata: { action: 'delete', chart_name: chartName },
    });
  }

  async notifyChartUpdated(userId, chartName) {
    return await this.createNotification(userId, {
      type: 'info',
      title: 'Chart Updated',
      message: `Chart "${chartName}" has been updated`,
      device_id: null,
      source: 'chart_management',
      metadata: { action: 'update', chart_name: chartName },
    });
  }

  // System notifications
  async notifySystemEvent(userId, title, message, type = 'info') {
    return await this.createNotification(userId, {
      type,
      title,
      message,
      device_id: null,
      source: 'system',
    });
  }

  // Authentication and security notifications
  async notifySuccessfulLogin(userId, metadata = {}) {
    return await this.createNotification(userId, {
      type: 'info',
      title: 'Successful Login',
      message: 'You have successfully logged into your account',
      device_id: null,
      source: 'authentication',
      metadata: { action: 'login', ...metadata },
    });
  }

  async notifyFailedLoginAttempt(userId, metadata = {}) {
    return await this.createNotification(userId, {
      type: 'warning',
      title: 'Failed Login Attempt',
      message: 'A failed login attempt was detected on your account',
      device_id: null,
      source: 'security',
      metadata: { action: 'failed_login', ...metadata },
    });
  }

  // Data export notifications
  async notifyDataExportStarted(userId, exportType, deviceIds = []) {
    return await this.createNotification(userId, {
      type: 'info',
      title: 'Data Export Started',
      message: `${exportType} export has been initiated`,
      device_id: deviceIds.length === 1 ? deviceIds[0] : null,
      source: 'data_export',
      metadata: { action: 'export_start', export_type: exportType, device_count: deviceIds.length },
    });
  }

  async notifyDataExportCompleted(userId, exportType, filename, deviceIds = []) {
    return await this.createNotification(userId, {
      type: 'success',
      title: 'Data Export Completed',
      message: `${exportType} export is ready for download`,
      device_id: deviceIds.length === 1 ? deviceIds[0] : null,
      source: 'data_export',
      metadata: {
        action: 'export_complete',
        export_type: exportType,
        filename,
        device_count: deviceIds.length,
      },
    });
  }

  async notifyDataExportFailed(userId, exportType, error, deviceIds = []) {
    return await this.createNotification(userId, {
      type: 'error',
      title: 'Data Export Failed',
      message: `${exportType} export failed: ${error}`,
      device_id: deviceIds.length === 1 ? deviceIds[0] : null,
      source: 'data_export',
      metadata: {
        action: 'export_failed',
        export_type: exportType,
        error,
        device_count: deviceIds.length,
      },
    });
  }

  // Device command completion notifications (for async commands)
  async notifyCommandCompleted(userId, device, command, success, message = '') {
    return await this.createNotification(userId, {
      type: success ? 'success' : 'error',
      title: success ? 'Command Completed' : 'Command Failed',
      message: success
        ? `Command "${command}" completed successfully on "${device.name}"${message ? ': ' + message : ''}`
        : `Command "${command}" failed on "${device.name}"${message ? ': ' + message : ''}`,
      device_id: device.id,
      source: 'device_control',
      metadata: { action: 'command_result', command, success, response_message: message },
    });
  }

  // Bulk operations notifications
  async notifyBulkOperation(userId, operation, itemCount, successCount, failCount = 0) {
    const success = failCount === 0;
    return await this.createNotification(userId, {
      type: success ? 'success' : 'warning',
      title: `Bulk ${operation} ${success ? 'Completed' : 'Partially Completed'}`,
      message: success
        ? `Successfully ${operation.toLowerCase()} ${successCount} items`
        : `${operation} completed: ${successCount} successful, ${failCount} failed out of ${itemCount} items`,
      device_id: null,
      source: 'bulk_operations',
      metadata: {
        action: 'bulk_operation',
        operation,
        total: itemCount,
        success: successCount,
        failed: failCount,
      },
    });
  }

  // System maintenance notifications
  async notifyMaintenanceScheduled(userId, maintenanceType, scheduledDate) {
    return await this.createNotification(userId, {
      type: 'info',
      title: 'Maintenance Scheduled',
      message: `${maintenanceType} maintenance is scheduled for ${scheduledDate}`,
      device_id: null,
      source: 'system_maintenance',
      metadata: {
        action: 'maintenance_scheduled',
        type: maintenanceType,
        scheduled_date: scheduledDate,
      },
    });
  }

  async notifyMaintenanceStarted(userId, maintenanceType) {
    return await this.createNotification(userId, {
      type: 'warning',
      title: 'Maintenance In Progress',
      message: `${maintenanceType} maintenance has started. Some features may be temporarily unavailable`,
      device_id: null,
      source: 'system_maintenance',
      metadata: { action: 'maintenance_started', type: maintenanceType },
    });
  }

  async notifyMaintenanceCompleted(userId, maintenanceType) {
    return await this.createNotification(userId, {
      type: 'success',
      title: 'Maintenance Completed',
      message: `${maintenanceType} maintenance has been completed. All services are now available`,
      device_id: null,
      source: 'system_maintenance',
      metadata: { action: 'maintenance_completed', type: maintenanceType },
    });
  }

  // Helper methods
  isSignificantReading(dataType, value) {
    // Define what constitutes a "significant" reading worth notifying about
    const significantThresholds = {
      temperature: { min: -10, max: 50 }, // Extreme temperatures
      humidity: { min: 10, max: 90 }, // Very dry or very humid
      pressure: { min: 950, max: 1050 }, // Unusual pressure
      battery_level: { min: 0, max: 20 }, // Low battery
    };

    const threshold = significantThresholds[dataType];
    if (!threshold) return false;

    return value <= threshold.min || value >= threshold.max;
  }

  // Get unread notification count for user
  async getUnreadCount(userId) {
    try {
      return await Notification.count({
        where: {
          user_id: userId,
          is_read: false,
        },
      });
    } catch (error) {
      console.error(`Error getting unread count for user ${userId}:`, error);
      return 0;
    }
  }

  // Broadcast to all connected users (admin notifications)
  async broadcastToAll(title, message, type = 'info') {
    let sentCount = 0;
    const userIds = Array.from(this.wsConnections.keys());

    for (const userId of userIds) {
      try {
        await this.createNotification(userId, {
          type,
          title,
          message,
          device_id: null,
          source: 'broadcast',
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to broadcast to user ${userId}:`, error);
      }
    }

    console.log(`📢 Broadcast notification sent to ${sentCount} users`);
    return sentCount;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
