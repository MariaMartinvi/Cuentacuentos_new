import { fetchStoryExamples } from './storyExamplesService';

const CACHE_KEY = 'story_examples_cache';

/**
 * Get stories from cache or fetch from Firebase if cache is missing
 */
export const getStoriesWithCache = async () => {
  try {
    // Try to get from cache first
    const cachedData = localStorage.getItem(CACHE_KEY);
    
    if (cachedData) {
      const { stories } = JSON.parse(cachedData);
      console.log('Using cached stories');
      return stories;
    }
    
    // If no cache, fetch from Firebase
    console.log('Fetching stories from Firebase');
    const stories = await fetchStoryExamples();
    
    // Update cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      stories,
      timestamp: Date.now() // Keep timestamp for future reference if needed
    }));
    
    return stories;
  } catch (error) {
    console.error('Error in getStoriesWithCache:', error);
    throw error;
  }
};

/**
 * Clear the stories cache
 */
export const clearStoriesCache = () => {
  localStorage.removeItem(CACHE_KEY);
};

/**
 * Force refresh the stories cache
 */
export const refreshStoriesCache = async () => {
  clearStoriesCache();
  return getStoriesWithCache();
}; 