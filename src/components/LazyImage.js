import React, { useState, useEffect, useRef } from 'react';

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  onLoad,
  onError,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg==');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    let observer;
    let didCancel = false;

    const loadImage = async () => {
      if (!src) return;

      try {
        // Load the actual image
        const img = new Image();
        img.src = src;
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            if (!didCancel) {
              setImageSrc(src);
              setIsLoading(false);
              setError(false);
              if (onLoad) onLoad();
              resolve();
            }
          };
          img.onerror = () => {
            if (!didCancel) {
              console.error(`Failed to load image: ${src}`);
              setError(true);
              setIsLoading(false);
              if (onError) onError();
              reject(new Error(`Failed to load image: ${src}`));
            }
          };
        });
      } catch (error) {
        if (!didCancel) {
          console.error(`Error loading image ${src}:`, error);
          setError(true);
          setIsLoading(false);
          if (onError) onError();
        }
      }
    };

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.01
        }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      loadImage();
    }

    return () => {
      didCancel = true;
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, onLoad, onError]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoading ? 'loading' : 'loaded'} ${error ? 'error' : ''}`}
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