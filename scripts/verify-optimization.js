/**
 * Script de verificación de optimizaciones de imágenes
 * 
 * Verifica que todos los archivos necesarios existen y están correctamente configurados
 * 
 * Uso: node scripts/verify-optimization.js
 */

const fs = require('fs');
const path = require('path');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  checks.passed++;
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  checks.failed++;
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  checks.warnings++;
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function header(message) {
  console.log('');
  log('═'.repeat(60), colors.blue);
  log(message, colors.bright + colors.blue);
  log('═'.repeat(60), colors.blue);
}

function checkFileExists(filePath, description) {
  const fullPath = path.resolve(filePath);
  if (fs.existsSync(fullPath)) {
    success(`${description} existe`);
    return true;
  } else {
    error(`${description} NO encontrado: ${filePath}`);
    return false;
  }
}

function checkFileContains(filePath, searchString, description) {
  try {
    const content = fs.readFileSync(path.resolve(filePath), 'utf8');
    if (content.includes(searchString)) {
      success(`${description}`);
      return true;
    } else {
      error(`${description} - búsqueda fallida`);
      return false;
    }
  } catch (err) {
    error(`Error leyendo ${filePath}: ${err.message}`);
    return false;
  }
}

function main() {
  log('\n🚀 VERIFICACIÓN DE OPTIMIZACIONES DE IMÁGENES\n', colors.bright + colors.cyan);

  // 1. Verificar archivos nuevos
  header('1. ARCHIVOS NUEVOS');
  
  checkFileExists(
    'src/services/imageCacheService.js',
    'Servicio de caché de imágenes'
  );
  
  checkFileExists(
    'scripts/optimize-images.js',
    'Script de optimización de imágenes'
  );
  
  checkFileExists(
    'OPTIMIZACION_IMAGENES.md',
    'Documentación técnica'
  );
  
  checkFileExists(
    'GUIA_RAPIDA_OPTIMIZACION.md',
    'Guía rápida'
  );

  checkFileExists(
    'RESUMEN_CAMBIOS.md',
    'Resumen de cambios'
  );

  // 2. Verificar modificaciones en archivos existentes
  header('2. MODIFICACIONES EN ARCHIVOS EXISTENTES');

  checkFileContains(
    'src/components/LazyImage.js',
    'priority',
    'LazyImage.js - soporte para prop priority'
  );

  checkFileContains(
    'src/components/LazyImage.js',
    'rootMargin: \'100px 0px\'',
    'LazyImage.js - rootMargin optimizado'
  );

  checkFileContains(
    'src/components/StoryCard.js',
    'getCachedImage',
    'StoryCard.js - integración con caché IndexedDB'
  );

  checkFileContains(
    'src/components/StoryCard.js',
    'cacheImage',
    'StoryCard.js - función de caché'
  );

  checkFileContains(
    'src/components/StoryExamplesSection.js',
    'priority={index < 3}',
    'StoryExamplesSection.js - priorización de primeras imágenes'
  );

  checkFileContains(
    'src/components/StoryCard.css',
    'lazy-image--loading',
    'StoryCard.css - estilos de lazy loading'
  );

  checkFileContains(
    'public/_headers',
    'Cache-Control',
    '_headers - configuración de caché HTTP'
  );

  // 3. Verificar package.json scripts
  header('3. SCRIPTS NPM');

  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.resolve('package.json'), 'utf8')
    );

    if (packageJson.scripts && packageJson.scripts['optimize-images']) {
      success('Script "optimize-images" configurado');
    } else {
      warning('Script "optimize-images" no encontrado en package.json');
    }

    if (packageJson.scripts && packageJson.scripts['cache-stats']) {
      success('Script "cache-stats" configurado');
    } else {
      warning('Script "cache-stats" no encontrado en package.json');
    }
  } catch (err) {
    error(`Error leyendo package.json: ${err.message}`);
  }

  // 4. Verificar estructura del código
  header('4. INTEGRIDAD DEL CÓDIGO');

  // Verificar importaciones
  checkFileContains(
    'src/components/StoryCard.js',
    'import { getCachedImage',
    'StoryCard.js - importaciones correctas'
  );

  // Verificar exports
  checkFileContains(
    'src/services/imageCacheService.js',
    'export const getCachedImage',
    'imageCacheService.js - export getCachedImage'
  );

  checkFileContains(
    'src/services/imageCacheService.js',
    'export const cacheImage',
    'imageCacheService.js - export cacheImage'
  );

  checkFileContains(
    'src/services/imageCacheService.js',
    'export const clearAllImageCache',
    'imageCacheService.js - export clearAllImageCache'
  );

  // 5. Verificar configuración IndexedDB
  header('5. CONFIGURACIÓN INDEXEDDB');

  checkFileContains(
    'src/services/imageCacheService.js',
    'DB_NAME',
    'Nombre de base de datos configurado'
  );

  checkFileContains(
    'src/services/imageCacheService.js',
    'const CACHE_DURATION = 7',
    'Duración de caché configurada (7 días)'
  );

  // 6. Verificar documentación
  header('6. DOCUMENTACIÓN');

  if (fs.existsSync('OPTIMIZACION_IMAGENES.md')) {
    const docSize = fs.statSync('OPTIMIZACION_IMAGENES.md').size;
    if (docSize > 5000) {
      success(`Documentación técnica completa (${(docSize / 1024).toFixed(2)} KB)`);
    } else {
      warning('Documentación técnica parece incompleta');
    }
  }

  if (fs.existsSync('GUIA_RAPIDA_OPTIMIZACION.md')) {
    const guideSize = fs.statSync('GUIA_RAPIDA_OPTIMIZACION.md').size;
    if (guideSize > 3000) {
      success(`Guía rápida completa (${(guideSize / 1024).toFixed(2)} KB)`);
    } else {
      warning('Guía rápida parece incompleta');
    }
  }

  // Resumen final
  console.log('');
  log('═'.repeat(60), colors.blue);
  log('📊 RESUMEN DE VERIFICACIÓN', colors.bright + colors.blue);
  log('═'.repeat(60), colors.blue);
  
  log(`✅ Checks exitosos: ${checks.passed}`, colors.green);
  if (checks.warnings > 0) {
    log(`⚠️  Advertencias: ${checks.warnings}`, colors.yellow);
  }
  if (checks.failed > 0) {
    log(`❌ Checks fallidos: ${checks.failed}`, colors.red);
  }
  
  console.log('');

  if (checks.failed === 0) {
    log('🎉 ¡VERIFICACIÓN EXITOSA!', colors.bright + colors.green);
    log('Todas las optimizaciones están correctamente implementadas.', colors.green);
    console.log('');
    log('📋 Próximos pasos:', colors.bright);
    log('1. Prueba la aplicación: npm start');
    log('2. Verifica el caché en DevTools → Application → IndexedDB');
    log('3. Mide el rendimiento: npm run lighthouse');
    log('4. (Opcional) Optimiza imágenes: npm run optimize-images');
    console.log('');
  } else {
    log('⚠️  VERIFICACIÓN CON ERRORES', colors.bright + colors.red);
    log('Algunos archivos o configuraciones faltan.', colors.red);
    log('Por favor, revisa los errores arriba y corrige.', colors.red);
    console.log('');
  }

  // Información adicional
  if (checks.warnings > 0 && checks.failed === 0) {
    log('💡 Tip: Las advertencias no afectan la funcionalidad principal.', colors.cyan);
    console.log('');
  }

  process.exit(checks.failed > 0 ? 1 : 0);
}

// Ejecutar verificación
if (require.main === module) {
  try {
    main();
  } catch (error) {
    log(`\n❌ Error fatal durante la verificación: ${error.message}`, colors.red);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { main };

