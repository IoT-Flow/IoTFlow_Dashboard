const express = require('express');
const UserController = require('../controllers/userController');
const { verifyAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

// Authentication routes (public)
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// User management routes (require authentication)
router.get('/profile', verifyAuth, UserController.getProfile);
router.put('/profile', verifyAuth, UserController.updateProfile);
router.post('/refresh-api-key', verifyAuth, UserController.refreshApiKey);

// Admin routes (existing CRUD operations)
router.post('/', UserController.createUser);
router.get('/:id', verifyAuth, UserController.getUser);
router.put('/:id', verifyAuth, UserController.updateUser);
router.delete('/:id', verifyAuth, UserController.deleteUser);

module.exports = router;