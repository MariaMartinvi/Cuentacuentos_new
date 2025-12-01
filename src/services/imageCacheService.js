/**
 * Image Cache Service using IndexedDB for better performance and larger storage
 * This service caches image URLs and metadata to reduce Firebase Storage requests
 */

const DB_NAME = 'AudiogretelImageCache';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Initialize IndexedDB
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('path', 'path', { unique: false });
      }
    };
  });
};

/**
 * Get cached image data
 */
export const getCachedImage = async (imageId) => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(imageId);
      
      request.onsuccess = () => {
        const result = request.result;
        
        // Check if cache is still valid
        if (result && (Date.now() - result.timestamp) < CACHE_DURATION) {
          console.log(`[ImageCache] Cache hit for: ${imageId}`);
          resolve(result.url);
        } else {
          if (result) {
            console.log(`[ImageCache] Cache expired for: ${imageId}`);
          } else {
            console.log(`[ImageCache] Cache miss for: ${imageId}`);
          }
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error(`[ImageCache] Error reading cache for ${imageId}:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[ImageCache] Error accessing IndexedDB:', error);
    // Fallback to no cache
    return null;
  }
};

/**
 * Cache image data
 */
export const cacheImage = async (imageId, imagePath, imageUrl) => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      const data = {
        id: imageId,
        path: imagePath,
        url: imageUrl,
        timestamp: Date.now()
      };
      
      const request = objectStore.put(data);
      
      request.onsuccess = () => {
        console.log(`[ImageCache] Cached image: ${imageId}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error(`[ImageCache] Error caching image ${imageId}:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[ImageCache] Error accessing IndexedDB:', error);
    // Don't fail the operation if caching fails
    return;
  }
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = async () => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('timestamp');
      const range = IDBKeyRange.upperBound(Date.now() - CACHE_DURATION);
      
      const request = index.openCursor(range);
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          console.log(`[ImageCache] Cleared ${deletedCount} expired entries`);
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => {
        console.error('[ImageCache] Error clearing expired cache:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[ImageCache] Error accessing IndexedDB:', error);
    return 0;
  }
};

/**
 * Clear all cached images
 */
export const clearAllImageCache = async () => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();
      
      request.onsuccess = () => {
        console.log('[ImageCache] All cache cleared');
        resolve();
      };
      
      request.onerror = () => {
        console.error('[ImageCache] Error clearing cache:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[ImageCache] Error accessing IndexedDB:', error);
    return;
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const countRequest = objectStore.count();
      
      countRequest.onsuccess = () => {
        const total = countRequest.result;
        
        // Count expired entries
        const index = objectStore.index('timestamp');
        const range = IDBKeyRange.upperBound(Date.now() - CACHE_DURATION);
        const expiredRequest = index.count(range);
        
        expiredRequest.onsuccess = () => {
          const expired = expiredRequest.result;
          const valid = total - expired;
          
          resolve({
            total,
            valid,
            expired,
            cacheDuration: CACHE_DURATION
          });
        };
        
        expiredRequest.onerror = () => {
          reject(expiredRequest.error);
        };
      };
      
      countRequest.onerror = () => {
        reject(countRequest.error);
      };
    });
  } catch (error) {
    console.error('[ImageCache] Error getting cache stats:', error);
    return {
      total: 0,
      valid: 0,
      expired: 0,
      cacheDuration: CACHE_DURATION
    };
  }
};

/**
 * Preload images into cache
 */
export const preloadImages = async (imageUrls) => {
  const promises = imageUrls.map(({ id, path, url }) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        cacheImage(id, path, url).then(() => resolve(true));
      };
      img.onerror = () => {
        console.error(`[ImageCache] Failed to preload image: ${url}`);
        resolve(false);
      };
      img.src = url;
    });
  });
  
  const results = await Promise.all(promises);
  const successCount = results.filter(r => r).length;
  console.log(`[ImageCache] Preloaded ${successCount}/${imageUrls.length} images`);
  
  return successCount;
};
