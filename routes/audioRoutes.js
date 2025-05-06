// routes/audioRoutes.js
const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');

// Generate audio from text
router.post('/generate', audioController.generateAudio);

module.exports = router;