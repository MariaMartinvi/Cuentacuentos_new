// controllers/audioController.js
const googleTtsService = require('../utils/googleTtsService');

exports.generateAudio = async (req, res, next) => {
  try {
    const { text, voiceId, speechRate } = req.body;
    
    // Validate request
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Check text length to avoid extremely large requests
    if (text.length > 5000) {
      return res.status(400).json({ 
        error: 'Text too long. Maximum length is 5000 characters.' 
      });
    }
    
    // Generate audio using TTS service
    const audioData = await googleTtsService.synthesizeSpeech(
      text,
      voiceId || 'female',
      speechRate || 1.0
    );
    
    // Return audio data (base64 encoded)
    res.status(200).json({
      audioUrl: `data:audio/mp3;base64,${audioData}`,
      format: 'mp3',
      parameters: {
        voiceId,
        speechRate
      }
    });
  } catch (error) {
    next(error);
  }
};