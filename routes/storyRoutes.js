// routes/storyRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateStory, generateAudio } = require('../controllers/storyController');

// Generate story (requires authentication)
router.post('/generate', auth, async (req, res, next) => {
  try {
    // Check if user can generate more stories
    if (!req.user.canGenerateStory()) {
      return res.status(403).json({
        message: 'You have reached your story limit. Please subscribe to generate more stories.',
        requiresSubscription: true
      });
    }

    // Generate the story
    const story = await generateStory(req, res, next);

    // Update user's story count
    req.user.storiesGenerated += 1;
    req.user.monthlyStoriesGenerated += 1;
    await req.user.save();

    res.json(story);
  } catch (error) {
    next(error);
  }
});

// Generate audio for a story
router.post('/:storyId/audio', generateAudio);

module.exports = router;