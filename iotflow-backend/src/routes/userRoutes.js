const express = require('express');
const UserController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Authentication routes (public)
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// User management routes (require authentication)
router.get('/profile', verifyToken, UserController.getProfile);
router.put('/profile', verifyToken, UserController.updateProfile);
router.post('/refresh-api-key', verifyToken, UserController.refreshApiKey);

// ============================================================================
// ADMIN USER MANAGEMENT ROUTES REMOVED - USE /api/v1/admin/* INSTEAD
// ============================================================================
// The following routes have been removed to eliminate duplication with Admin V1 API.
// All admin operations should use the dedicated /api/v1/admin namespace.
//
// REMOVED ROUTES (now available only via /api/v1/admin):
// - GET    /api/users                → Use GET    /api/v1/admin/users
// - GET    /api/users/:id            → Use GET    /api/v1/admin/users/:id
// - POST   /api/users                → Use POST   /api/v1/admin/users
// - PUT    /api/users/:id            → Use PUT    /api/v1/admin/users/:id
// - DELETE /api/users/:id            → Use DELETE /api/v1/admin/users/:id
// - GET    /api/users/:id/devices    → Use GET    /api/v1/admin/users/:id/devices
// ============================================================================

module.exports = router;
