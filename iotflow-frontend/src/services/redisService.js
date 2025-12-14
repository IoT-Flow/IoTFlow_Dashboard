const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
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

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  /**
   * Check if a device is online based on Redis status tracker
   * @param {number} deviceId - Device ID
   * @returns {Promise<boolean>} - True if device is online
   */
  async isDeviceOnline(deviceId) {
    if (!this.client || !this.isConnected) {
      console.warn('⚠️ Redis not connected, cannot check device status');
      return false;
    }

    try {
      const statusKey = `device:status:${deviceId}`;
      const status = await this.client.get(statusKey);
      return status === 'online';
    } catch (error) {
      console.error(`❌ Error checking device ${deviceId} status:`, error);
      return false;
    }
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
      const lastSeen = await this.client.get(lastSeenKey);
      return lastSeen;
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
        pipeline.get(`device:lastseen:${deviceId}`);
      });

      const results = await pipeline.exec();

      // Parse results (they come in pairs: status, lastSeen, status, lastSeen, ...)
      for (let i = 0; i < deviceIds.length; i++) {
        const deviceId = deviceIds[i];
        const statusIndex = i * 2;
        const lastSeenIndex = statusIndex + 1;

        const status = results[statusIndex];
        const lastSeen = results[lastSeenIndex];

        statusMap.set(deviceId, {
          status: status || 'offline',
          is_online: status === 'online',
          last_seen: lastSeen || null,
        });
      }

      return statusMap;
    } catch (error) {
      console.error('❌ Error getting device statuses in batch:', error);
      return new Map();
    }
  }
}

// Singleton instance
const redisService = new RedisService();

module.exports = redisService;
