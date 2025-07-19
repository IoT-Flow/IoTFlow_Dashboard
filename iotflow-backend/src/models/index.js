const User = require('./user');
const Device = require('./device');
const DeviceAuth = require('./deviceAuth');
const DeviceConfiguration = require('./deviceConfiguration');
const TelemetryData = require('./telemetryData');

// Define associations
User.hasMany(Device, { foreignKey: 'user_id', as: 'devices' });
Device.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Device.hasMany(DeviceAuth, { foreignKey: 'device_id', as: 'auth' });
DeviceAuth.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });

Device.hasMany(DeviceConfiguration, { foreignKey: 'device_id', as: 'configurations' });
DeviceConfiguration.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });

Device.hasMany(TelemetryData, { foreignKey: 'device_id', as: 'telemetry' });
TelemetryData.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });

module.exports = {
  User,
  Device,
  DeviceAuth,
  DeviceConfiguration,
  TelemetryData
};
