const express = require('express');
const router = express.Router();
const { register, login, refreshToken } = require('../controllers/authController');

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Refresh token
router.post('/refresh-token', refreshToken);

module.exports = router; 