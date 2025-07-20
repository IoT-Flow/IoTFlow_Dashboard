const express = require('express');
const dotenv = require('dotenv');
const app = require('./app');
const { sequelize } = require('./utils/db');

// Import models to ensure they are registered
require('./models');

dotenv.config();

const PORT = 3001;

// Initialize database
const startServer = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synced successfully');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();