const { sequelize } = require('../src/utils/db');
const { hashPassword } = require('../src/utils/password');
require('../src/models'); // Import all models

// Import User model after loading all models
const User = require('../src/models/user');

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // Sync all models (but don't force recreate)
    await sequelize.sync({ force: false });
    console.log('✅ Database synced successfully');

    // Create additional tables that match your existing database structure
    await createAdditionalTables();

    // Create default admin user if it doesn't exist
    await createDefaultUser();

    // Create indexes for performance optimization
    await createIndexes();

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

async function createAdditionalTables() {
  console.log('📋 Creating additional tables...');

  // Determine SQL dialect
  const isPostgreSQL = sequelize.getDialect() === 'postgres';

  if (isPostgreSQL) {
    console.log('Using PostgreSQL syntax for table creation...');

    // Create device_control table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS device_control (
        id SERIAL PRIMARY KEY,
        device_id INTEGER NOT NULL,
        command VARCHAR(128) NOT NULL,
        parameters JSONB,
        status VARCHAR(32),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE
      )
    `);

    // Create notifications table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        device_id INTEGER,
        source VARCHAR(100) NOT NULL DEFAULT 'system',
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
  } else {
    console.log('Using SQLite syntax for table creation...');

    // Create device_control table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS device_control (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        command VARCHAR(128) NOT NULL,
        parameters JSON,
        status VARCHAR(32),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE
      )
    `);

    // Create notifications table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        device_id INTEGER,
        source VARCHAR(100) NOT NULL DEFAULT 'system',
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        read_at DATETIME,
        metadata JSON,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
  }

  console.log('✅ Additional tables created/verified');
}

async function createDefaultUser() {
  console.log('👤 Checking for default admin user...');

  const adminExists = await User.findOne({ where: { username: 'admin' } });
  if (!adminExists) {
    console.log('👤 Creating default admin user...');
    const hashedPassword = await hashPassword('admin123');

    await User.create({
      username: 'admin',
      email: 'admin@iotflow.local',
      password_hash: hashedPassword,
      is_active: true,
      is_admin: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log('✅ Default admin user created (username: admin, password: admin123)');
  } else {
    console.log('👤 Admin user already exists');
  }
}

async function createIndexes() {
  console.log('📊 Creating database indexes...');

  try {
    const isPostgreSQL = sequelize.getDialect() === 'postgres';

    if (isPostgreSQL) {
      console.log('Creating PostgreSQL indexes...');

      // User indexes (checking if column exists first)
      try {
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_username 
          ON users (username)
        `);
      } catch (e) {
        /* Column may not exist */
      }

      try {
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_email 
          ON users (email)
        `);
      } catch (e) {
        /* Column may not exist */
      }

      // Device indexes
      try {
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_devices_user_id 
          ON devices (user_id)
        `);
      } catch (e) {
        /* Table may not exist yet */
      }

      // Notification indexes
      try {
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS notifications_user_id 
          ON notifications (user_id)
        `);

        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS notifications_user_id_is_read 
          ON notifications (user_id, is_read)
        `);

        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS notifications_user_id_created_at 
          ON notifications (user_id, created_at)
        `);

        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS notifications_device_id 
          ON notifications (device_id)
        `);

        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS notifications_source 
          ON notifications (source)
        `);
      } catch (e) {
        /* Table may not exist yet */
      }
    } else {
      // SQLite indexes
      console.log('Creating SQLite indexes...');

      // User indexes
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_user_id 
        ON users (user_id)
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_username 
        ON users (username)
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_email 
        ON users (email)
      `);

      // Device indexes
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_devices_user_id 
        ON devices (user_id)
      `);

      // Other indexes as they were...
    }

    console.log('✅ Database indexes created/verified');
  } catch (error) {
    console.warn(
      "⚠️ Some indexes may have failed to create (this is normal if they already exist or tables don't exist yet)"
    );
    console.warn('Index creation error:', error.message);
  }
}

initDatabase();
