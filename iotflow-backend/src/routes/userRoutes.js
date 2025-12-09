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
router.put('/:id/role', verifyToken, UserController.updateUserRole); // Will check admin in controller
router.put('/:id/status', verifyToken, UserController.updateUserStatus); // Will check admin in controller

// Admin routes (existing CRUD operations)
router.post('/', verifyToken, isAdmin, UserController.createUser);
router.get('/:id', verifyToken, isAdmin, UserController.getUser);
router.put('/:id', verifyToken, isAdmin, UserController.updateUser);
router.delete('/:id', verifyToken, isAdmin, UserController.deleteUser)

module.exports = router;
