// controllers/storyController.js
const openaiService = require('../utils/openaiService');
const { constructPrompt, extractTitle } = require('../utils/helpers');
const User = require('../models/User');
const Story = require('../models/Story');
console.log("OpenAI API Key:", process.env.OPENAI_API_KEY ? "Configurada (primeros caracteres: " + process.env.OPENAI_API_KEY.substring(0, 5) + "...)" : "No configurada");

exports.generateStory = async (req, res, next) => {
  try {
    const { email, ...storyParams } = req.body;
    
    // Validate request body
    if (!storyParams.topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email });
    }

    // Check and reset monthly count if needed
    user.checkAndResetMonthlyCount();

    // Check if user can generate more stories
    const canGenerateStory = await checkStoryGenerationLimit(user);
    if (!canGenerateStory) {
      return res.status(403).json({ 
        error: 'Story limit reached',
        message: user.subscriptionStatus === 'active' 
          ? 'You have reached your monthly story generation limit of 30 stories.'
          : 'You have reached your free story limit. Please subscribe to generate more stories.',
        subscriptionRequired: user.subscriptionStatus !== 'active',
        storiesRemaining: await getStoriesRemaining(user)
      });
    }

    // Generate story text via OpenAI
    const prompt = constructPrompt(storyParams);
    const storyContent = await openaiService.generateCompletion(prompt, storyParams);
    
    // Extract or generate a title
    const title = extractTitle(storyContent, storyParams.topic);
    
    // Create new story document
    const story = new Story({
      title,
      content: storyContent,
      user: user._id
    });
    await story.save();
    
    // Update user's story counts
    user.storiesGenerated += 1;
    if (user.subscriptionStatus === 'active') {
      user.monthlyStoriesGenerated += 1;
    }
    await user.save();
    
    // Return the generated story
    return {
      title,
      content: storyContent,
      parameters: storyParams,
      timestamp: new Date().toISOString(),
      storiesRemaining: await getStoriesRemaining(user)
    };
  } catch (error) {
    next(error);
  }
};

exports.generateAudio = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const { email } = req.body;

    if (!storyId || !email) {
      return res.status(400).json({ error: 'Story ID and email are required' });
    }

    // Find the story
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Check if user can generate more audio for this story
    if (!story.canGenerateAudio()) {
      return res.status(403).json({ 
        error: 'Audio limit reached',
        message: 'Create a new story to generate another audio.'
      });
    }

    // Increment audio generations
    const canIncrement = story.incrementAudioGenerations();
    if (!canIncrement) {
      return res.status(403).json({ 
        error: 'Audio limit reached',
        message: 'Create a new story to generate another audio.'
      });
    }

    await story.save();

    // Generate audio (implement your audio generation logic here)
    // const audioUrl = await generateAudio(story.content);
    
    return {
      success: true,
      message: 'Audio generated successfully',
      audioGenerations: story.audioGenerations
    };
  } catch (error) {
    next(error);
  }
};

async function checkStoryGenerationLimit(user) {
  // Check and reset monthly count if needed
  user.checkAndResetMonthlyCount();

  // Free users get 2 stories total
  if (user.subscriptionStatus === 'free') {
    return user.storiesGenerated < 2;
  }

  // Subscribed users get 30 stories per month
  if (user.subscriptionStatus === 'active') {
    // Check if subscription is still valid
    if (user.subscriptionEndDate && user.subscriptionEndDate < new Date()) {
      user.subscriptionStatus = 'cancelled';
      await user.save();
      return user.storiesGenerated < 2; // Fall back to free tier
    }
    return user.monthlyStoriesGenerated < 30; // 30 stories per month limit
  }

  // Cancelled subscriptions fall back to free tier
  return user.storiesGenerated < 2;
}

async function getStoriesRemaining(user) {
  // Check and reset monthly count if needed
  user.checkAndResetMonthlyCount();

  if (user.subscriptionStatus === 'free') {
    return Math.max(0, 2 - user.storiesGenerated);
  }
  
  if (user.subscriptionStatus === 'active') {
    if (user.subscriptionEndDate && user.subscriptionEndDate < new Date()) {
      return Math.max(0, 2 - user.storiesGenerated);
    }
    return Math.max(0, 30 - user.monthlyStoriesGenerated);
  }

  return Math.max(0, 2 - user.storiesGenerated);
}

exports.getStoryById = async (req, res, next) => {
  // Implementation for retrieving saved stories
  // This would require a database connection
  res.status(501).json({ message: 'Not implemented yet' });
};