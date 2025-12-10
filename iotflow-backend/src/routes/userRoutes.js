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

// Admin-only: User management routes (must be before /:id routes)
router.get('/', verifyToken, UserController.getAllUsers); // Will check admin in controller
router.get('/:id/devices', verifyToken, UserController.getUserDevices); // Will check admin in controller

// Specific role/status update endpoints removed - consolidated into generic PUT /:id
// The generic updateUser now handles role and status updates with proper safeguards
// router.put('/:id/role', verifyToken, UserController.updateUserRole);
// router.put('/:id/status', verifyToken, UserController.updateUserStatus);

// Admin routes (existing CRUD operations)
router.post('/', verifyToken, isAdmin, UserController.createUser);
router.get('/:id', verifyToken, isAdmin, UserController.getUser);
router.put('/:id', verifyToken, isAdmin, UserController.updateUser); // Now handles role/status updates
router.delete('/:id', verifyToken, isAdmin, UserController.deleteUser)

module.exports = router;
