import { useEffect } from 'react';
import { preloadImages } from '../services/imageCacheService';

/**
 * Component to preload critical images in the background
 * This improves perceived performance by loading images before they're needed
 */
const ImagePreloader = ({ images = [] }) => {
  useEffect(() => {
    if (images.length === 0) return;
    
    const preloadCriticalImages = async () => {
      console.log(`[ImagePreloader] Preloading ${images.length} critical images...`);
      
      try {
        const preloadPromises = images.map(({ src, priority = 'low' }) => {
          return new Promise((resolve) => {
            const img = new Image();
            
            // Set fetchpriority for browsers that support it
            if (priority === 'high') {
              img.fetchpriority = 'high';
            } else if (priority === 'low') {
              img.fetchpriority = 'low';
            }
            
            img.onload = () => {
              console.log(`[ImagePreloader] ✓ Preloaded: ${src}`);
              resolve(true);
            };
            
            img.onerror = () => {
              console.warn(`[ImagePreloader] ✗ Failed to preload: ${src}`);
              resolve(false);
            };
            
            img.src = src;
          });
        });
        
        const results = await Promise.all(preloadPromises);
        const successCount = results.filter(r => r).length;
        console.log(`[ImagePreloader] Preloaded ${successCount}/${images.length} images`);
      } catch (error) {
        console.error('[ImagePreloader] Error preloading images:', error);
      }
    };
    
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => preloadCriticalImages());
    } else {
      setTimeout(() => preloadCriticalImages(), 1000);
    }
  }, [images]);
  
  return null; // This component doesn't render anything
};

export default ImagePreloader;

/**
 * Hook for preloading images
 */
export const useImagePreloader = (images) => {
  useEffect(() => {
    if (!images || images.length === 0) return;
    
    const preloadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });
    };
    
    const preload = async () => {
      const results = await Promise.all(images.map(src => preloadImage(src)));
      const successCount = results.filter(r => r).length;
      console.log(`[useImagePreloader] Preloaded ${successCount}/${images.length} images`);
    };
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => preload());
    } else {
      setTimeout(() => preload(), 1000);
    }
  }, [images]);
};

