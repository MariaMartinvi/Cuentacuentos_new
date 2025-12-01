/**
 * Servicio de optimización de imágenes para mejorar el rendimiento
 * - Compresión de imágenes
 * - Conversión a WebP
 * - Redimensionamiento automático
 * - Generación de thumbnails
 */

/**
 * Comprime una imagen a un tamaño más pequeño
 * @param {File|Blob} file - Archivo de imagen a comprimir
 * @param {number} maxWidth - Ancho máximo de la imagen
 * @param {number} maxHeight - Alto máximo de la imagen
 * @param {number} quality - Calidad de compresión (0-1)
 * @returns {Promise<Blob>} - Imagen comprimida
 */
export const compressImage = async (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones manteniendo la proporción
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`Imagen comprimida: ${(file.size / 1024).toFixed(2)}KB -> ${(blob.size / 1024).toFixed(2)}KB`);
              resolve(blob);
            } else {
              reject(new Error('Error al comprimir la imagen'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
  });
};

/**
 * Convierte una imagen a formato WebP
 * @param {File|Blob} file - Archivo de imagen
 * @param {number} quality - Calidad de conversión (0-1)
 * @returns {Promise<Blob>} - Imagen en formato WebP
 */
export const convertToWebP = async (file, quality = 0.85) => {
  // Verificar si el navegador soporta WebP
  const supportsWebP = await checkWebPSupport();
  
  if (!supportsWebP) {
    console.log('WebP no soportado, devolviendo imagen original');
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`Convertido a WebP: ${(file.size / 1024).toFixed(2)}KB -> ${(blob.size / 1024).toFixed(2)}KB`);
              resolve(blob);
            } else {
              reject(new Error('Error al convertir a WebP'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
  });
};

/**
 * Genera un thumbnail (miniatura) de una imagen
 * @param {File|Blob} file - Archivo de imagen
 * @param {number} size - Tamaño del thumbnail (ancho y alto)
 * @returns {Promise<Blob>} - Thumbnail generado
 */
export const generateThumbnail = async (file, size = 200) => {
  return compressImage(file, size, size, 0.7);
};

/**
 * Verifica si el navegador soporta WebP
 * @returns {Promise<boolean>}
 */
export const checkWebPSupport = () => {
  return new Promise((resolve) => {
    const webP = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    const img = new Image();
    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    img.src = webP;
  });
};

/**
 * Genera un placeholder borroso (blur hash) para una imagen
 * @param {string} imageUrl - URL de la imagen
 * @returns {Promise<string>} - Data URL del placeholder
 */
export const generateBlurPlaceholder = async (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Crear una versión muy pequeña (10x10) de la imagen
      canvas.width = 10;
      canvas.height = 10;
      
      ctx.drawImage(img, 0, 0, 10, 10);
      
      // Aplicar blur
      ctx.filter = 'blur(5px)';
      ctx.drawImage(canvas, 0, 0);
      
      const placeholderUrl = canvas.toDataURL('image/jpeg', 0.1);
      resolve(placeholderUrl);
    };
    
    img.onerror = () => {
      // Si falla, devolver un placeholder genérico
      resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+');
    };
  });
};

/**
 * Optimiza una imagen URL de Firebase Storage
 * Añade parámetros de transformación si están disponibles
 * @param {string} imageUrl - URL de la imagen
 * @param {Object} options - Opciones de optimización
 * @returns {string} - URL optimizada
 */
export const optimizeFirebaseImageUrl = (imageUrl, options = {}) => {
  const {
    width = 800,
    height = 600,
    quality = 85,
    format = 'auto'
  } = options;

  // Firebase Storage no tiene transformación de imágenes nativa
  // pero podemos añadir parámetros personalizados para procesamiento
  // si tienes un Cloud Function configurada
  
  // Por ahora, devolvemos la URL original con un parámetro de caché
  // para aprovechar el caché del navegador
  const url = new URL(imageUrl);
  url.searchParams.set('alt', 'media');
  
  return url.toString();
};

/**
 * Procesa una imagen para optimizarla antes de subirla a Firebase
 * @param {File} file - Archivo de imagen original
 * @returns {Promise<Object>} - Objeto con la imagen optimizada y thumbnail
 */
export const processImageForUpload = async (file) => {
  console.log(`Procesando imagen: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
  
  try {
    // 1. Comprimir la imagen principal
    const compressedImage = await compressImage(file, 800, 600, 0.85);
    
    // 2. Generar thumbnail
    const thumbnail = await generateThumbnail(file, 200);
    
    // 3. Intentar convertir a WebP (si es soportado)
    let webpImage = null;
    const supportsWebP = await checkWebPSupport();
    if (supportsWebP) {
      webpImage = await convertToWebP(file, 0.85);
    }
    
    console.log('Imagen procesada exitosamente:', {
      originalSize: `${(file.size / 1024).toFixed(2)}KB`,
      compressedSize: `${(compressedImage.size / 1024).toFixed(2)}KB`,
      thumbnailSize: `${(thumbnail.size / 1024).toFixed(2)}KB`,
      webpSize: webpImage ? `${(webpImage.size / 1024).toFixed(2)}KB` : 'N/A'
    });
    
    return {
      original: file,
      compressed: compressedImage,
      thumbnail: thumbnail,
      webp: webpImage
    };
  } catch (error) {
    console.error('Error procesando imagen:', error);
    throw error;
  }
};

/**
 * Obtiene el tamaño de una imagen sin descargarla completamente
 * @param {string} imageUrl - URL de la imagen
 * @returns {Promise<Object>} - Dimensiones de la imagen {width, height}
 */
export const getImageDimensions = async (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = imageUrl;
  });
};

/**
 * Calcula el peso estimado de una imagen antes de descargarla
 * @param {string} imageUrl - URL de la imagen
 * @returns {Promise<number>} - Tamaño en bytes
 */
export const estimateImageSize = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : 0;
  } catch (error) {
    console.error('Error estimando tamaño de imagen:', error);
    return 0;
  }
};

