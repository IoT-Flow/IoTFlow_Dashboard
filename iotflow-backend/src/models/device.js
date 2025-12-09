const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');
const crypto = require('crypto');

class Device extends Model {}

Device.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    device_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    api_key: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      defaultValue: () => crypto.randomBytes(32).toString('hex'),
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'offline',
    },
    location: {
      type: DataTypes.STRING(200),
    },
    firmware_version: {
      type: DataTypes.STRING(20),
    },
    hardware_version: {
      type: DataTypes.STRING(20),
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    last_seen: {
      type: DataTypes.DATE,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Device',
    tableName: 'devices',
    timestamps: false,
  }
);

module.exports = Device;
