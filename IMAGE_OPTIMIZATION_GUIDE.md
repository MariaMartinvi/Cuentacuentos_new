# Guía de Optimización de Imágenes

Esta guía explica cómo optimizar las imágenes en la aplicación Audiogretel para mejorar el rendimiento y reducir los tiempos de carga.

## Problema Identificado

Las imágenes actuales tienen un tamaño de ~200KB, lo cual causa:
- Tiempos de carga lentos
- Necesidad de refrescar la página para ver las imágenes
- Mala experiencia de usuario en conexiones lentas
- Mayor consumo de datos

## Soluciones Implementadas

### 1. Componente LazyImage Mejorado ✅

**Ubicación:** `src/components/LazyImage.js`

**Características:**
- **Progressive Loading:** Muestra un placeholder SVG con efecto blur mientras carga
- **Lazy Loading:** Usa IntersectionObserver para cargar imágenes solo cuando entran al viewport
- **Transiciones suaves:** Efecto de fade-in al cargar
- **Optimización de URL:** Agrega parámetros de optimización a URLs de Firebase

**Uso:**
```jsx
import LazyImage from './components/LazyImage';

<LazyImage 
  src="/path/to/image.jpg"
  alt="Descripción"
  size="medium" // small, medium, large
/>
```

### 2. Sistema de Caché con IndexedDB ✅

**Ubicación:** `src/services/imageCacheService.js`

**Características:**
- Almacenamiento de URLs de imágenes en IndexedDB (mayor capacidad que localStorage)
- Cache de 7 días por defecto
- Limpieza automática de cache expirado
- Estadísticas de caché

**Funciones disponibles:**
```javascript
import { 
  getCachedImage, 
  cacheImage, 
  clearExpiredCache,
  getCacheStats 
} from './services/imageCacheService';

// Obtener imagen del caché
const url = await getCachedImage('image-id');

// Guardar en caché
await cacheImage('image-id', 'path/to/image.jpg', 'https://...');

// Ver estadísticas
const stats = await getCacheStats();
console.log(`Cached: ${stats.valid}, Expired: ${stats.expired}`);
```

### 3. Service Worker para Caching ✅

**Ubicación:** `public/service-worker.js`

**Características:**
- Estrategia stale-while-revalidate para imágenes de Firebase Storage
- Cache-first para recursos estáticos
- Precarga de recursos críticos
- Soporte offline

**Estado:** Activado automáticamente en producción

### 4. Preload de Imágenes Críticas ✅

**Ubicación:** `src/components/ImagePreloader.js`

**Uso:**
```jsx
import ImagePreloader from './components/ImagePreloader';

// En tu componente principal o App.js
<ImagePreloader 
  images={[
    { src: '/logo.png', priority: 'high' },
    { src: '/hero-image.jpg', priority: 'high' }
  ]} 
/>
```

### 5. Script de Optimización de Imágenes ✅

**Ubicación:** `scripts/optimize-images.js`

Este script descarga imágenes de Firebase Storage, las optimiza y las vuelve a subir.

**Instalación de dependencias:**
```bash
npm install sharp --save-dev
```

**Configuración:**
1. Configura tu variable de entorno:
   ```bash
   export FIREBASE_STORAGE_BUCKET="your-bucket-name.appspot.com"
   ```

2. O usa credenciales de Firebase Admin SDK

**Ejecución:**
```bash
node scripts/optimize-images.js
```

**Lo que hace:**
- Redimensiona imágenes a máximo 800x600px
- Comprime JPEGs con calidad 85%
- Genera versiones WebP (formato moderno, 30% más pequeño)
- Agrega headers de caché optimizados
- Muestra reporte de reducción de tamaño

## Mejores Prácticas para Nuevas Imágenes

### 1. Antes de Subir Imágenes

**Herramientas recomendadas:**
- **Online:** [TinyPNG](https://tinypng.com/), [Squoosh](https://squoosh.app/)
- **Desktop:** [ImageOptim](https://imageoptim.com/) (Mac), [FileOptimizer](https://nikkhokkho.sourceforge.io/static.php?page=FileOptimizer) (Windows)

**Tamaños objetivo:**
- Thumbnails/Avatares: 150x150px, <20KB
- Cards de historias: 400x300px, <50KB
- Imágenes hero: 1200x800px, <100KB
- Fondos: 1920x1080px, <150KB

### 2. Formatos Recomendados

1. **WebP:** Mejor compresión, soportado en navegadores modernos
2. **JPEG:** Para fotografías y imágenes complejas
3. **PNG:** Solo para imágenes con transparencia
4. **SVG:** Para logos e iconos

### 3. Responsive Images

Usa `srcset` para diferentes tamaños de pantalla:

```jsx
<img 
  srcset="
    image-small.jpg 400w,
    image-medium.jpg 800w,
    image-large.jpg 1200w
  "
  sizes="(max-width: 600px) 400px, (max-width: 900px) 800px, 1200px"
  src="image-medium.jpg"
  alt="Descripción"
/>
```

## Monitoreo de Performance

### Chrome DevTools

1. **Network Tab:**
   - Filtra por "Img"
   - Verifica tamaños de descarga
   - Comprueba tiempos de carga

2. **Lighthouse:**
   ```bash
   npm run lighthouse
   ```
   - Revisa puntuación de Performance
   - Sigue recomendaciones de optimización de imágenes

3. **Application > Cache Storage:**
   - Verifica que las imágenes se están cacheando
   - Revisa Service Worker status

### Métricas Objetivo

- **LCP (Largest Contentful Paint):** <2.5s
- **FID (First Input Delay):** <100ms
- **CLS (Cumulative Layout Shift):** <0.1
- **Tamaño de imagen promedio:** <50KB
- **Total de imágenes por página:** <2MB

## Troubleshooting

### Las imágenes no se cargan

1. Verifica la consola del navegador
2. Comprueba que Firebase Storage tiene CORS configurado:
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

3. Verifica las reglas de Firebase Storage:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /images/{imageId} {
         allow read;
       }
     }
   }
   ```

### El caché no funciona

1. Abre DevTools > Application > Storage
2. Verifica IndexedDB > AudiogretelImageCache
3. Limpia el caché manualmente:
   ```javascript
   import { clearAllImageCache } from './services/imageCacheService';
   await clearAllImageCache();
   ```

### Service Worker no se activa

1. En DevTools > Application > Service Workers
2. Click en "Unregister" y recarga
3. Verifica que `/service-worker.js` es accesible
4. En desarrollo, marca "Update on reload"

## Próximos Pasos

### Optimizaciones Adicionales (Opcional)

1. **CDN de Imágenes:**
   - Considera usar Cloudinary o imgix
   - Transformaciones automáticas en la URL
   - Mejor performance global

2. **Formato AVIF:**
   - Mejor compresión que WebP (~50% más pequeño)
   - Soporte creciente en navegadores

3. **Lazy Loading Nativo:**
   - Ya implementado con `loading="lazy"`
   - Compatible con todos los navegadores modernos

4. **Image Sprite Sheets:**
   - Para múltiples iconos pequeños
   - Reduce el número de requests HTTP

## Referencias

- [Web.dev - Optimize Images](https://web.dev/fast/#optimize-your-images)
- [MDN - Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Firebase Storage CORS](https://firebase.google.com/docs/storage/web/download-files#cors_configuration)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Última actualización:** $(date)
**Mantenido por:** Equipo Audiogretel

