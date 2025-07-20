const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Device = require('../models/device');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const verifyApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ message: 'API key is required' });
  }

  try {
    const device = await Device.findOne({ where: { api_key: apiKey } });
    if (!device) {
      return res.status(403).json({ message: 'Invalid API key' });
    }
    req.device = device;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'API key authentication failed', error: error.message });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.is_admin) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Admins only' });
};

module.exports = {
  verifyToken,
  verifyApiKey,
  isAdmin,
};