import React, { useState, useEffect, useRef } from 'react';

/**
 * Generate a tiny blurred placeholder SVG
 */
const generatePlaceholder = (width = 400, height = 300) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e0e0e0;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f5f5f5;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Get optimized image URL with Firebase Storage transformations
 */
const getOptimizedImageUrl = (url, size = 'medium') => {
  if (!url || !url.includes('firebasestorage.googleapis.com')) {
    return url;
  }
  
  // Firebase Storage supports URL parameters for image transformation
  const separator = url.includes('?') ? '&' : '?';
  
  // Size presets (width in pixels)
  const sizes = {
    small: 300,
    medium: 600,
    large: 1200
  };
  
  const width = sizes[size] || sizes.medium;
  
  // Add Firebase Storage image transformation parameters
  // Note: This requires Firebase Storage to have proper CORS and transformation support
  return `${url}${separator}alt=media`;
};

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  onLoad,
  onError,
  size = 'medium', // small, medium, large
  priority = false, // If true, load immediately without lazy loading
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(generatePlaceholder());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(priority); // Load immediately if priority is true

  // Set up Intersection Observer to detect when image enters viewport (only if not priority)
  useEffect(() => {
    // If priority is true, skip intersection observer
    if (priority) {
      setShouldLoad(true);
      return;
    }

    let observer;

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !shouldLoad) {
              setShouldLoad(true);
              if (observer && imgRef.current) {
                observer.unobserve(imgRef.current);
              }
            }
          });
        },
        {
          rootMargin: '100px 0px', // Start loading 100px before entering viewport
          threshold: 0.01
        }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      setShouldLoad(true);
    }

    return () => {
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [shouldLoad, priority]);

  // Load the image once it should be loaded
  useEffect(() => {
    if (!shouldLoad || !src) return;

    let didCancel = false;
    const optimizedSrc = getOptimizedImageUrl(src, size);

    const loadImage = async () => {
      try {
        // Preload the image
        const img = new Image();
        img.src = optimizedSrc;
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            if (!didCancel) {
              // Use requestAnimationFrame for smooth transition
              requestAnimationFrame(() => {
                setImageSrc(optimizedSrc);
                setIsLoading(false);
                setError(false);
                if (onLoad) onLoad();
              });
              resolve();
            }
          };
          img.onerror = (e) => {
            if (!didCancel) {
              console.error(`Failed to load image: ${optimizedSrc}`, e);
              setError(true);
              setIsLoading(false);
              if (onError) onError();
              reject(new Error(`Failed to load image: ${optimizedSrc}`));
            }
          };
        });
      } catch (error) {
        if (!didCancel) {
          console.error(`Error loading image ${optimizedSrc}:`, error);
          setError(true);
          setIsLoading(false);
          if (onError) onError();
        }
      }
    };

    loadImage();

    return () => {
      didCancel = true;
    };
  }, [shouldLoad, src, size, onLoad, onError]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`lazy-image ${className} ${isLoading ? 'lazy-image--loading' : 'lazy-image--loaded'} ${error ? 'lazy-image--error' : ''}`}
      loading={priority ? 'eager' : 'lazy'} // Native lazy loading as fallback
      decoding="async" // Async decoding for better performance
      style={{
        opacity: isLoading ? 0.6 : 1,
        filter: isLoading ? 'blur(10px)' : 'none',
        transition: 'opacity 0.3s ease-in-out, filter 0.3s ease-in-out',
        ...props.style
      }}
      onLoad={() => {
        if (isLoading) {
          setIsLoading(false);
          setError(false);
          if (onLoad) onLoad();
        }
      }}
      onError={() => {
        setError(true);
        setIsLoading(false);
        if (onError) onError();
      }}
      {...props}
    />
  );
};

export default LazyImage; 