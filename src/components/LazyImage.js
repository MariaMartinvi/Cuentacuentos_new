import React, { useState, useEffect, useRef } from 'react';

const LazyImage = ({ src, alt, className, placeholder = '/images/default-story.jpg' }) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
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
              resolve();
            }
          };
          img.onerror = () => {
            if (!didCancel) {
              console.error(`Failed to load image: ${src}`);
              setError(true);
              setIsLoading(false);
              reject(new Error(`Failed to load image: ${src}`));
            }
          };
        });
      } catch (error) {
        if (!didCancel) {
          console.error(`Error loading image ${src}:`, error);
          setError(true);
          setIsLoading(false);
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
  }, [src]);

  return (
    <div className="story-card-image-container">
      {isLoading && !error && (
        <div className="story-card-skeleton">
          <div className="skeleton-image" />
        </div>
      )}
      <div className={`story-card-error ${error ? 'visible' : ''}`} />
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`story-card-image ${isLoading ? 'loading' : 'loaded'} ${error ? 'error' : ''} ${className || ''}`}
        onLoad={() => {
          if (isLoading) {
            setIsLoading(false);
            setError(false);
          }
        }}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
};

export default LazyImage; 