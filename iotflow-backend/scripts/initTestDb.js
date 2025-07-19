// Script to initialize and sync the test database
const { sequelize } = require('../src/utils/db');
const User = require('../src/models/user');

(async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Test database synced!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to sync test DB:', err);
    process.exit(1);
  }
})();
