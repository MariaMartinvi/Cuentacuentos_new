import { useEffect, useState } from 'react';

/**
 * Hook personalizado para precargar imágenes críticas
 * Precarga las primeras N imágenes automáticamente para mejorar la percepción de velocidad
 */
export const useImagePreload = (imageUrls, count = 4) => {
  const [preloadedImages, setPreloadedImages] = useState(new Set());
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) {
      setIsPreloading(false);
      return;
    }

    const imagesToPreload = imageUrls.slice(0, count);
    console.log(`🚀 Precargando ${imagesToPreload.length} imágenes críticas...`);

    const preloadPromises = imagesToPreload.map((url, index) => {
      return new Promise((resolve, reject) => {
        if (!url) {
          resolve();
          return;
        }

        const img = new Image();
        
        img.onload = () => {
          console.log(`✅ Imagen ${index + 1}/${imagesToPreload.length} precargada`);
          setPreloadedImages(prev => new Set([...prev, url]));
          resolve();
        };
        
        img.onerror = (error) => {
          console.warn(`⚠️ Error precargando imagen ${index + 1}:`, error);
          resolve(); // No bloquear el resto de precargas
        };
        
        img.src = url;
      });
    });

    Promise.all(preloadPromises)
      .then(() => {
        console.log(`✨ Precarga de imágenes completada`);
        setIsPreloading(false);
      })
      .catch((error) => {
        console.error('Error en precarga de imágenes:', error);
        setIsPreloading(false);
      });

    // Cleanup
    return () => {
      setPreloadedImages(new Set());
    };
  }, [imageUrls, count]);

  return { 
    preloadedImages, 
    isPreloading,
    isPreloaded: (url) => preloadedImages.has(url)
  };
};

/**
 * Hook para precargar una sola imagen
 */
export const useSingleImagePreload = (imageUrl) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      setError(null);
    };
    
    img.onerror = (err) => {
      setError(err);
      setIsLoaded(false);
    };
    
    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  return { isLoaded, error };
};

/**
 * Hook para detectar imágenes en el viewport
 */
export const useImageInView = (ref, options = {}) => {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return isInView;
};

export default useImagePreload;

