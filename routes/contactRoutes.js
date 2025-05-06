const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Route for sending contact messages
router.post('/', contactController.sendContactMessage);

module.exports = router; 