const User = require('./user');
const Device = require('./device');
const DeviceConfiguration = require('./deviceConfiguration');
const Chart = require('./chart');
const Notification = require('./notification');
const Group = require('./group');
const DeviceGroupAssociation = require('./deviceGroupAssociation');

// Define associations
User.hasMany(Device, { foreignKey: 'user_id', as: 'devices' });
Device.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Group, { foreignKey: 'user_id', as: 'groups' });
Group.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Many-to-Many: Device <-> Group through DeviceGroupAssociation
Device.belongsToMany(Group, {
  through: DeviceGroupAssociation,
  foreignKey: 'device_id',
  otherKey: 'group_id',
  as: 'groups',
});

Group.belongsToMany(Device, {
  through: DeviceGroupAssociation,
  foreignKey: 'group_id',
  otherKey: 'device_id',
  as: 'devices',
});

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Device.hasMany(Notification, { foreignKey: 'device_id', as: 'notifications' });
Notification.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });

Device.hasMany(DeviceConfiguration, { foreignKey: 'device_id', as: 'configurations' });
DeviceConfiguration.belongsTo(Device, { foreignKey: 'device_id', as: 'device' });

User.hasMany(Chart, { foreignKey: 'user_id', as: 'charts' });
Chart.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  User,
  Device,
  DeviceConfiguration,
  Chart,
  Notification,
  Group,
  DeviceGroupAssociation,
};
