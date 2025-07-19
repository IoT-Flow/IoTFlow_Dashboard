const jwt = require('jsonwebtoken');
const User = require('../models/user');

const verifyAuth = async (req, res, next) => {
  try {
    let user = null;

    // Try API key authentication first
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
      user = await User.findOne({ where: { api_key: apiKey } });
      if (user) {
        req.user = user;
        return next();
      }
    }

    // Try JWT token authentication
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        user = await User.findByPk(decoded.id);
        if (user) {
          req.user = user;
          return next();
        }
      } catch (jwtError) {
        // Token is invalid, continue to check other methods
      }
    }

    // If neither authentication method worked
    return res.status(401).json({ message: 'Authentication required. Provide valid API key or JWT token.' });
  } catch (error) {
    return res.status(500).json({ message: 'Authentication error', error: error.message });
  }
};

const verifyApiKey = async (req, res, next) => {
  // Skip API key verification for user creation
  if (req.path === '/api/users' && req.method === 'POST') {
    return next();
  }

  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ message: 'API key required' });
  }

  try {
    const user = await User.findOne({ where: { api_key: apiKey } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid API key' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authentication error', error: error.message });
  }
};

const authMiddleware = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.is_admin) {
    next();
  } else {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }
};

module.exports = {
  verifyAuth,
  verifyApiKey,
  authMiddleware,
  adminMiddleware,
};