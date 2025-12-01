/**
 * Script para optimizar imágenes antes de subirlas a Firebase Storage
 * 
 * Uso:
 *   npm install sharp --save-dev
 *   node scripts/optimize-images.js <input-directory> <output-directory>
 * 
 * Ejemplo:
 *   node scripts/optimize-images.js ./images ./images-optimized
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Configuración
const CONFIG = {
  // Tamaños para diferentes usos
  sizes: {
    thumbnail: { width: 300, height: 225, quality: 75 },
    medium: { width: 800, height: 600, quality: 80 },
    large: { width: 1200, height: 900, quality: 85 }
  },
  
  // Formatos de salida
  formats: ['webp', 'jpg'], // WebP + JPG como fallback
  
  // Extensiones de entrada soportadas
  inputFormats: ['.jpg', '.jpeg', '.png', '.webp']
};

/**
 * Optimizar una imagen individual
 */
async function optimizeImage(inputPath, outputDir, sizeConfig, format) {
  try {
    const filename = path.basename(inputPath, path.extname(inputPath));
    const outputFilename = `${filename}-${sizeConfig.width}w.${format}`;
    const outputPath = path.join(outputDir, outputFilename);

    // Configurar Sharp según el formato
    let sharpInstance = sharp(inputPath)
      .resize(sizeConfig.width, sizeConfig.height, {
        fit: 'inside',
        withoutEnlargement: true
      });

    // Aplicar formato específico
    if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality: sizeConfig.quality });
    } else if (format === 'jpg' || format === 'jpeg') {
      sharpInstance = sharpInstance.jpeg({ 
        quality: sizeConfig.quality,
        progressive: true,
        mozjpeg: true
      });
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png({ 
        quality: sizeConfig.quality,
        compressionLevel: 9
      });
    }

    // Guardar imagen optimizada
    await sharpInstance.toFile(outputPath);

    // Obtener estadísticas
    const inputStats = await fs.stat(inputPath);
    const outputStats = await fs.stat(outputPath);
    const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(2);

    return {
      success: true,
      inputPath,
      outputPath,
      inputSize: inputStats.size,
      outputSize: outputStats.size,
      savings,
      format
    };
  } catch (error) {
    return {
      success: false,
      inputPath,
      error: error.message
    };
  }
}

/**
 * Procesar un directorio de imágenes
 */
async function processDirectory(inputDir, outputDir) {
  console.log('🚀 Iniciando optimización de imágenes...\n');
  console.log(`📁 Directorio de entrada: ${inputDir}`);
  console.log(`📁 Directorio de salida: ${outputDir}\n`);

  // Crear directorio de salida si no existe
  await fs.mkdir(outputDir, { recursive: true });

  // Leer archivos del directorio
  const files = await fs.readdir(inputDir);
  const imageFiles = files.filter(file => 
    CONFIG.inputFormats.includes(path.extname(file).toLowerCase())
  );

  console.log(`🖼️  Encontradas ${imageFiles.length} imágenes para optimizar\n`);

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    totalInputSize: 0,
    totalOutputSize: 0
  };

  // Procesar cada imagen
  for (const file of imageFiles) {
    const inputPath = path.join(inputDir, file);
    console.log(`\n📸 Procesando: ${file}`);
    console.log('─'.repeat(60));

    // Generar todas las variantes (tamaños y formatos)
    for (const [sizeName, sizeConfig] of Object.entries(CONFIG.sizes)) {
      for (const format of CONFIG.formats) {
        const result = await optimizeImage(inputPath, outputDir, sizeConfig, format);
        results.total++;

        if (result.success) {
          results.success++;
          results.totalInputSize += result.inputSize;
          results.totalOutputSize += result.outputSize;

          console.log(
            `✅ ${sizeName} (${format}): ` +
            `${(result.inputSize / 1024).toFixed(2)} KB → ` +
            `${(result.outputSize / 1024).toFixed(2)} KB ` +
            `(${result.savings}% reducción)`
          );
        } else {
          results.failed++;
          console.error(`❌ ${sizeName} (${format}): ${result.error}`);
        }
      }
    }
  }

  // Resumen final
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMEN DE OPTIMIZACIÓN');
  console.log('═'.repeat(60));
  console.log(`📸 Total de imágenes procesadas: ${imageFiles.length}`);
  console.log(`✅ Variantes exitosas: ${results.success}`);
  console.log(`❌ Variantes fallidas: ${results.failed}`);
  console.log(`📦 Tamaño total entrada: ${(results.totalInputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📦 Tamaño total salida: ${(results.totalOutputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`💾 Ahorro total: ${((1 - results.totalOutputSize / results.totalInputSize) * 100).toFixed(2)}%`);
  console.log('═'.repeat(60));
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Error: Se requieren dos argumentos');
    console.log('\nUso:');
    console.log('  node scripts/optimize-images.js <input-directory> <output-directory>');
    console.log('\nEjemplo:');
    console.log('  node scripts/optimize-images.js ./images ./images-optimized');
    process.exit(1);
  }

  const inputDir = path.resolve(args[0]);
  const outputDir = path.resolve(args[1]);

  // Verificar que el directorio de entrada existe
  try {
    await fs.access(inputDir);
  } catch (error) {
    console.error(`❌ Error: El directorio de entrada no existe: ${inputDir}`);
    process.exit(1);
  }

  try {
    await processDirectory(inputDir, outputDir);
    console.log('\n✅ ¡Optimización completada con éxito!');
  } catch (error) {
    console.error('\n❌ Error durante la optimización:', error);
    process.exit(1);
  }
}

// Ejecutar script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { optimizeImage, processDirectory };
