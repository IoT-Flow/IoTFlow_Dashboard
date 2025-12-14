/**
 * Redis Service for Device Status Tracking
 *
 * Tracks device online/offline status using Redis with TTL.
 * - Device becomes online when telemetry is received
 * - Device becomes offline after 60 seconds of no telemetry (TTL expiry)
 * - Syncs status to PostgreSQL database
 */

const redis = require('redis');
const Device = require('../models/device');

const DEVICE_STATUS_TTL = 60; // 60 seconds timeout

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url:
          process.env.REDIS_URL ||
          `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
        password: process.env.REDIS_PASSWORD || undefined,
      });

      this.client.on('error', err => {
        console.error('❌ Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis Client Ready');
        this.isConnected = true;
      });

      await this.client.connect();
      this.isConnected = true;
      return this.client;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      this.client = null;
    }
  }

  /**
   * Update device status in Redis with TTL
   * @param {number} deviceId - Device ID
   * @param {string} status - Status ('online' or 'offline')
   */
  async updateDeviceStatus(deviceId, status) {
    if (!this.client || !this.isConnected) {
      console.warn('⚠️ Redis not connected, cannot update device status');
      return false;
    }

    try {
      const statusKey = `device:status:${deviceId}`;
      const lastSeenKey = `device:lastseen:${deviceId}`;
      const now = new Date().toISOString();

      if (status === 'online') {
        // Set status with TTL - will auto-expire after 60 seconds
        await this.client.setEx(statusKey, DEVICE_STATUS_TTL, status);
      } else {
        // For offline, just delete the key
        await this.client.del(statusKey);
      }

      // Always update last seen timestamp
      await this.client.set(lastSeenKey, now);

      return true;
    } catch (error) {
      console.error(`❌ Error updating device ${deviceId} status:`, error);
      return false;
    }
  }

  /**
   * Mark device as online (called when telemetry is received)
   * Refreshes the TTL each time telemetry is received
   * @param {number} deviceId - Device ID
   */
  async markDeviceOnline(deviceId) {
    return this.updateDeviceStatus(deviceId, 'online');
  }

  /**
   * Get device status from Redis
   * @param {number} deviceId - Device ID
   * @returns {Promise<string|null>} - 'online' or null (offline/expired)
   */
  async getDeviceStatus(deviceId) {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const statusKey = `device:status:${deviceId}`;
      return await this.client.get(statusKey);
    } catch (error) {
      console.error(`❌ Error getting device ${deviceId} status:`, error);
      return null;
    }
  }

  /**
   * Check if device is online
   * @param {number} deviceId - Device ID
   * @returns {Promise<boolean>}
   */
  async isDeviceOnline(deviceId) {
    const status = await this.getDeviceStatus(deviceId);
    return status === 'online';
  }

  /**
   * Get device last seen timestamp from Redis
   * @param {number} deviceId - Device ID
   * @returns {Promise<string|null>} - ISO timestamp or null
   */
  async getDeviceLastSeen(deviceId) {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const lastSeenKey = `device:lastseen:${deviceId}`;
      return await this.client.get(lastSeenKey);
    } catch (error) {
      console.error(`❌ Error getting device ${deviceId} last seen:`, error);
      return null;
    }
  }

  /**
   * Get status for multiple devices in batch
   * @param {number[]} deviceIds - Array of device IDs
   * @returns {Promise<Map>} - Map of deviceId -> {status, is_online, last_seen}
   */
  async getDeviceStatuses(deviceIds) {
    if (!this.client || !this.isConnected) {
      console.warn('⚠️ Redis not connected, cannot get device statuses');
      return new Map();
    }

    const statusMap = new Map();

    try {
      // Use pipeline for efficient batch operations
      const pipeline = this.client.multi();

      deviceIds.forEach(deviceId => {
        pipeline.get(`device:status:${deviceId}`);
      });

      const results = await pipeline.exec();

      for (let i = 0; i < deviceIds.length; i++) {
        const deviceId = deviceIds[i];
        const status = results[i];

        statusMap.set(deviceId, {
          status: status || 'offline',
          is_online: status === 'online',
          last_seen: null, // Can be fetched separately if needed
        });
      }

      return statusMap;
    } catch (error) {
      console.error('❌ Error getting device statuses in batch:', error);
      return new Map();
    }
  }

  /**
   * Sync device status from Redis to PostgreSQL database
   * @param {number} deviceId - Device ID
   */
  async syncDeviceStatusToDb(deviceId) {
    try {
      const isOnline = await this.isDeviceOnline(deviceId);
      const lastSeen = await this.getDeviceLastSeen(deviceId);
      const status = isOnline ? 'online' : 'offline';

      const device = await Device.findByPk(deviceId);
      if (!device) {
        console.warn(`⚠️ Device ${deviceId} not found in database`);
        return false;
      }

      const updateData = {
        status,
        updated_at: new Date(),
      };

      if (lastSeen) {
        updateData.last_seen = new Date(lastSeen);
      }

      await device.update(updateData);
      console.log(`✅ Synced device ${deviceId} status to DB: ${status}`);
      return true;
    } catch (error) {
      console.error(`❌ Error syncing device ${deviceId} status to DB:`, error);
      return false;
    }
  }

  /**
   * Sync all devices for a user from Redis to database
   * @param {number} userId - User ID
   */
  async syncAllDeviceStatuses(userId) {
    try {
      const devices = await Device.findAll({
        where: { user_id: userId },
        attributes: ['id'],
      });

      const results = await Promise.all(
        devices.map(device => this.syncDeviceStatusToDb(device.id))
      );

      const synced = results.filter(Boolean).length;
      console.log(`✅ Synced ${synced}/${devices.length} devices for user ${userId}`);
      return synced;
    } catch (error) {
      console.error(`❌ Error syncing all device statuses for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Get all online device IDs (for monitoring)
   * @returns {Promise<number[]>}
   */
  async getAllOnlineDeviceIds() {
    if (!this.client || !this.isConnected) {
      return [];
    }

    try {
      const keys = await this.client.keys('device:status:*');
      return keys.map(key => parseInt(key.split(':')[2]));
    } catch (error) {
      console.error('❌ Error getting all online device IDs:', error);
      return [];
    }
  }
}

// Singleton instance
const redisService = new RedisService();

module.exports = redisService;
