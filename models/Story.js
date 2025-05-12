const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  audioGenerations: {
    type: Number,
    default: 0,
    max: 2
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check if audio can be generated
storySchema.methods.canGenerateAudio = function() {
  return this.audioGenerations < 2;
};

// Method to increment audio generations
storySchema.methods.incrementAudioGenerations = function() {
  if (this.canGenerateAudio()) {
    this.audioGenerations += 1;
    return true;
  }
  return false;
};

module.exports = mongoose.model('Story', storySchema); 