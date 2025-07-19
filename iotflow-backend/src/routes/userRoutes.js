const express = require('express');
const UserController = require('../controllers/userController');
const { verifyApiKey } = require('../middlewares/authMiddleware');

const router = express.Router();

// Authentication routes (public)
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// User management routes (require API key)
router.get('/profile', verifyApiKey, UserController.getProfile);
router.put('/profile', verifyApiKey, UserController.updateProfile);
router.post('/refresh-api-key', verifyApiKey, UserController.refreshApiKey);

// Admin routes (existing CRUD operations)
router.post('/', UserController.createUser);
router.get('/:id', verifyApiKey, UserController.getUser);
router.put('/:id', verifyApiKey, UserController.updateUser);
router.delete('/:id', verifyApiKey, UserController.deleteUser);

module.exports = router;