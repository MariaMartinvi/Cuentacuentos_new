const CACHE_KEYS = {
  TEXT: 'story_text_cache',
  AUDIO: 'story_audio_cache',
  IMAGE: 'story_image_cache'
};

/**
 * Get a resource from cache or fetch it if not cached
 */
const getResourceWithCache = async (cacheKey, resourceId, fetchFn) => {
  try {
    // Try to get from cache first
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const cache = JSON.parse(cachedData);
      if (cache[resourceId]) {
        console.log(`Using cached ${cacheKey} for ${resourceId}`);
        return cache[resourceId];
      }
    }
    
    // If not in cache, fetch the resource
    console.log(`Fetching ${cacheKey} for ${resourceId}`);
    const resource = await fetchFn();
    
    // Update cache
    const cache = cachedData ? JSON.parse(cachedData) : {};
    cache[resourceId] = resource;
    localStorage.setItem(cacheKey, JSON.stringify(cache));
    
    return resource;
  } catch (error) {
    console.error(`Error in getResourceWithCache for ${resourceId}:`, error);
    throw error;
  }
};

/**
 * Get story text content from cache or fetch it
 */
export const getStoryTextWithCache = async (storyId, textPath, fetchFn) => {
  return getResourceWithCache(CACHE_KEYS.TEXT, storyId, fetchFn);
};

/**
 * Get story audio URL from cache or fetch it
 */
export const getStoryAudioWithCache = async (storyId, audioPath, fetchFn) => {
  return getResourceWithCache(CACHE_KEYS.AUDIO, storyId, fetchFn);
};

/**
 * Get story image URL from cache or fetch it
 */
export const getStoryImageWithCache = async (storyId, imagePath, fetchFn) => {
  return getResourceWithCache(CACHE_KEYS.IMAGE, storyId, fetchFn);
};

/**
 * Clear all resource caches
 */
export const clearResourceCaches = () => {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

/**
 * Clear specific resource cache
 */
export const clearResourceCache = (cacheKey) => {
  if (CACHE_KEYS[cacheKey]) {
    localStorage.removeItem(CACHE_KEYS[cacheKey]);
  }
}; 