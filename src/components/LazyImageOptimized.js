import React, { useState, useEffect, useRef } from 'react';

/**
 * Componente de imagen con carga lazy mejorada y optimizada
 * - Carga progresiva (placeholder -> imagen completa)
 * - Intersección observer para carga automática
 * - Manejo de errores robusto
 * - Soporte para múltiples reintentos
 * - Cache de imágenes en memoria
 * - Preloading inteligente
 */

// Cache en memoria para imágenes ya cargadas
const imageCache = new Map();

const LazyImageOptimized = ({ 
  src, 
  alt, 
  className = '', 
  onLoad,
  onError,
  placeholder,
  priority = false, // Si es true, carga inmediatamente sin lazy loading
  retries = 2, // Número de reintentos en caso de error
  ...props 
}) => {
  // Placeholder por defecto con un SVG ligero y blur
  const defaultPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmNWY1ZjUiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMGUwZTAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==';
  
  const [imageSrc, setImageSrc] = useState(placeholder || defaultPlaceholder);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef(null);
  const [isVisible, setIsVisible] = useState(priority); // Si es priority, es visible desde el inicio

  useEffect(() => {
    let observer;
    let didCancel = false;

    const loadImage = async () => {
      if (!src) return;

      // Verificar si la imagen ya está en cache
      if (imageCache.has(src)) {
        console.log(`📦 Imagen cargada desde cache: ${src}`);
        setImageSrc(src);
        setIsLoading(false);
        setError(false);
        if (onLoad) onLoad();
        return;
      }

      try {
        // Precargar la imagen en segundo plano
        const img = new Image();
        img.src = src;
        
        // Añadir timestamp para evitar problemas de cache del navegador
        if (!src.includes('?')) {
          img.src = `${src}?t=${Date.now()}`;
        }
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            if (!didCancel) {
              // Guardar en cache
              imageCache.set(src, true);
              
              setImageSrc(src);
              setIsLoading(false);
              setError(false);
              if (onLoad) onLoad();
              resolve();
            }
          };
          
          img.onerror = () => {
            if (!didCancel) {
              console.error(`❌ Error cargando imagen: ${src}`);
              
              // Intentar reintentar si hay reintentos disponibles
              if (retryCount < retries) {
                console.log(`🔄 Reintentando carga de imagen (${retryCount + 1}/${retries})...`);
                setTimeout(() => {
                  setRetryCount(prev => prev + 1);
                }, 1000 * (retryCount + 1)); // Esperar más tiempo en cada reintento
              } else {
                setError(true);
                setIsLoading(false);
                if (onError) onError();
              }
              
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

    // Si es una imagen prioritaria o ya es visible, cargar inmediatamente
    if (priority || isVisible) {
      loadImage();
      return;
    }

    // Si el navegador soporta IntersectionObserver, usar lazy loading
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              console.log(`👁️ Imagen visible, iniciando carga: ${src}`);
              setIsVisible(true);
              loadImage();
              observer.unobserve(entry.target);
            }
          });
        },
        {
          // Cargar imágenes un poco antes de que sean visibles (100px antes)
          rootMargin: '100px 0px',
          threshold: 0.01
        }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }
    } else {
      // Fallback para navegadores sin soporte de IntersectionObserver
      loadImage();
    }

    return () => {
      didCancel = true;
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, onLoad, onError, priority, retryCount, retries, isVisible]);

  return (
    <div 
      ref={imgRef}
      className={`lazy-image-container ${className}`}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <img
        src={imageSrc}
        alt={alt}
        className={`lazy-image ${isLoading ? 'loading' : 'loaded'} ${error ? 'error' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.3s ease-in-out',
          opacity: isLoading ? 0.6 : 1,
          filter: isLoading ? 'blur(5px)' : 'none'
        }}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => {
          if (isLoading) {
            setIsLoading(false);
            setError(false);
            if (onLoad) onLoad();
          }
        }}
        onError={() => {
          // Solo marcar error si ya no hay más reintentos
          if (retryCount >= retries) {
            setError(true);
            setIsLoading(false);
            if (onError) onError();
          }
        }}
        {...props}
      />
      
      {/* Indicador de carga */}
      {isLoading && !error && (
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.5
          }}
        >
          <div className="spinner" />
        </div>
      )}
      
      {/* Indicador de error */}
      {error && (
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#999'
          }}
        >
          <span style={{ fontSize: '2rem' }}>📷</span>
          <p style={{ fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
            No se pudo cargar
          </p>
        </div>
      )}
    </div>
  );
};

export default LazyImageOptimized;

