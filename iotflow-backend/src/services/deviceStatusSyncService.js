/**
 * Device Status Sync Service
 *
 * Periodically syncs device online/offline status from Redis to PostgreSQL.
 * This ensures the database reflects the real-time status for reporting
 * and when Redis is unavailable.
 */

const Device = require('../models/device');
const redisService = require('./redisService');

const SYNC_INTERVAL = 30000; // 30 seconds

class DeviceStatusSyncService {
  constructor() {
    this.syncInterval = null;
    this.isRunning = false;
  }

  /**
   * Start the periodic sync job
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Device status sync already running');
      return;
    }

    console.log('🔄 Starting device status sync service');
    this.isRunning = true;

    // Run immediately on start
    this.syncAllDevices();

    // Then run periodically
    this.syncInterval = setInterval(() => {
      this.syncAllDevices();
    }, SYNC_INTERVAL);
  }

  /**
   * Stop the periodic sync job
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Device status sync service stopped');
  }

  /**
   * Sync all devices from Redis to database
   */
  async syncAllDevices() {
    if (!redisService.isConnected) {
      console.log('⚠️ Redis not connected, skipping device status sync');
      return;
    }

    try {
      // Get all devices
      const devices = await Device.findAll({
        attributes: ['id', 'status'],
      });

      if (devices.length === 0) {
        return;
      }

      const deviceIds = devices.map(d => d.id);
      const redisStatuses = await redisService.getDeviceStatuses(deviceIds);

      let onlineCount = 0;
      let offlineCount = 0;
      let changedCount = 0;

      // Update each device if status changed
      for (const device of devices) {
        const redisStatus = redisStatuses.get(device.id);
        const newStatus = redisStatus?.is_online ? 'online' : 'offline';

        if (device.status !== newStatus) {
          await device.update({
            status: newStatus,
            updated_at: new Date(),
          });
          changedCount++;
        }

        if (newStatus === 'online') {
          onlineCount++;
        } else {
          offlineCount++;
        }
      }

      if (changedCount > 0) {
        console.log(
          `🔄 Synced device statuses: ${onlineCount} online, ${offlineCount} offline (${changedCount} changed)`
        );
      }
    } catch (error) {
      console.error('❌ Error syncing device statuses:', error);
    }
  }

  /**
   * Force sync a specific device
   * @param {number} deviceId
   */
  async syncDevice(deviceId) {
    return redisService.syncDeviceStatusToDb(deviceId);
  }
}

// Singleton instance
const deviceStatusSyncService = new DeviceStatusSyncService();

module.exports = deviceStatusSyncService;
