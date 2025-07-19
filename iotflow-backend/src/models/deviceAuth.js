const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');

class DeviceAuth extends Model { }

DeviceAuth.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'devices',
      key: 'id',
    },
  },
  api_key_hash: {
    type: DataTypes.STRING(128),
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  expires_at: {
    type: DataTypes.DATE,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  last_used: {
    type: DataTypes.DATE,
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  sequelize,
  modelName: 'DeviceAuth',
  tableName: 'device_auth',
  timestamps: false,
});

module.exports = DeviceAuth;
