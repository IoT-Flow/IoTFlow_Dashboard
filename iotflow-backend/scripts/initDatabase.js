const { sequelize } = require('../src/utils/db');
require('../src/models'); // Import all models

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // Sync all models
    await sequelize.sync({ force: false });
    console.log('✅ Database synced successfully');

    // Create chart-related tables if they don't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS chart_devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chart_id TEXT NOT NULL,
        device_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chart_id) REFERENCES charts(id)
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS chart_measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chart_id TEXT NOT NULL,
        measurement_name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chart_id) REFERENCES charts(id)
      )
    `);

    console.log('✅ Chart tables created/verified');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection verified');

    console.log('🎉 Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
