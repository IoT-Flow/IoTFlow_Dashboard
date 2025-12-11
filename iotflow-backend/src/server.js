const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const dotenv = require('dotenv');
const app = require('./app');
const { sequelize } = require('./utils/db');
const notificationService = require('./services/notificationService');
const jwt = require('jsonwebtoken');

// Import models to ensure they are registered
require('./models');

dotenv.config();

const PORT = 3001;

// Initialize database and WebSocket server
const startServer = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synced successfully');

    // Create HTTP server
    const server = http.createServer(app);

    // Create WebSocket server
    const wss = new WebSocket.Server({
      server,
      path: '/ws',
    });

    // WebSocket connection handling
    wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection established');

      ws.on('message', async message => {
        try {
          const data = JSON.parse(message.toString());

          if (data.type === 'auth' && data.token) {
            let userId;

            // Check if it's a demo token
            if (data.token.startsWith('demo_token_')) {
              // Extract user ID from demo token
              userId = parseInt(data.token.replace('demo_token_', ''));
              console.log(`[Demo Mode] WebSocket authenticated for user ${userId}`);
            } else {
              // Authenticate user with JWT token
              try {
                const decoded = jwt.verify(
                  data.token,
                  process.env.JWT_SECRET || 'iotflow_secret_key'
                );
                userId = decoded.id;
                console.log(`[JWT Auth] WebSocket authenticated for user ${userId}`);
              } catch (jwtError) {
                console.error('[Auth] Invalid or expired token:', data.token);
                console.error('[Auth] JWT error:', jwtError.message);
                throw jwtError;
              }
            }

            // Register this WebSocket for the user
            notificationService.registerConnection(userId, ws);

            ws.userId = userId;
            ws.send(
              JSON.stringify({
                type: 'auth_success',
                message: 'WebSocket authenticated successfully',
              })
            );
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Authentication failed',
            })
          );
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          notificationService.unregisterConnection(ws.userId);
          console.log(`WebSocket disconnected for user ${ws.userId}`);
        }
      });

      ws.on('error', error => {
        console.error('WebSocket error:', error);
      });
    });

    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`WebSocket server is running on ws://localhost:${PORT}/ws`);
      console.log(`API Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
