const https = require('https');
const fs = require('fs');
const path = require('path');

// URLs to test
const URLS_TO_TEST = [
  'https://audiogretel.com',
  'https://audiogretel.com/herramientas/generador-audiocuentos',
  'https://audiogretel.com/como-generar-audiocuentos-ia',
  'https://audiogretel.com/ejemplos'
];

// Performance testing APIs
const PERFORMANCE_APIS = {
  pagespeed: (url) => `https://www.googleapis.com/pagespeed/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo`,
  gtmetrix: 'https://gtmetrix.com/api/0.1/test'
};

/**
 * Test URL with PageSpeed Insights API
 */
async function testWithPageSpeed(url) {
  return new Promise((resolve, reject) => {
    const apiUrl = PERFORMANCE_APIS.pagespeed(url);
    
    https.get(apiUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.error) {
            reject(new Error(`PageSpeed API Error: ${result.error.message}`));
            return;
          }
          
          const lighthouse = result.lighthouseResult;
          const categories = lighthouse.categories;
          
          resolve({
            url,
            scores: {
              performance: Math.round(categories.performance.score * 100),
              accessibility: Math.round(categories.accessibility.score * 100),
              bestPractices: Math.round(categories['best-practices'].score * 100),
              seo: Math.round(categories.seo.score * 100)
            },
            metrics: {
              fcp: lighthouse.audits['first-contentful-paint'].numericValue,
              lcp: lighthouse.audits['largest-contentful-paint'].numericValue,
              cls: lighthouse.audits['cumulative-layout-shift'].numericValue,
              tbt: lighthouse.audits['total-blocking-time'].numericValue,
              si: lighthouse.audits['speed-index'].numericValue
            },
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          reject(new Error(`Error parsing PageSpeed response: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Generate performance report
 */
function generateReport(results) {
  const timestamp = new Date().toISOString().split('T')[0];
  
  let report = `# 📊 Reporte de Performance - AudioGretel\n`;
  report += `**Fecha:** ${timestamp}\n\n`;
  
  // Summary table
  report += `## 📈 Resumen de Puntuaciones\n\n`;
  report += `| URL | Performance | Accessibility | Best Practices | SEO |\n`;
  report += `|-----|-------------|---------------|----------------|-----|\n`;
  
  results.forEach(result => {
    const urlShort = result.url.replace('https://audiogretel.com', '').replace(/^$/, '/');
    report += `| ${urlShort} | ${result.scores.performance}% | ${result.scores.accessibility}% | ${result.scores.bestPractices}% | ${result.scores.seo}% |\n`;
  });
  
  report += `\n## 🚀 Métricas Detalladas\n\n`;
  
  results.forEach(result => {
    const urlShort = result.url.replace('https://audiogretel.com', '').replace(/^$/, 'Homepage');
    report += `### ${urlShort}\n\n`;
    report += `- **First Contentful Paint:** ${Math.round(result.metrics.fcp)}ms\n`;
    report += `- **Largest Contentful Paint:** ${Math.round(result.metrics.lcp)}ms\n`;
    report += `- **Cumulative Layout Shift:** ${result.metrics.cls.toFixed(3)}\n`;
    report += `- **Total Blocking Time:** ${Math.round(result.metrics.tbt)}ms\n`;
    report += `- **Speed Index:** ${Math.round(result.metrics.si)}ms\n\n`;
  });
  
  // Recommendations
  report += `## 💡 Recomendaciones\n\n`;
  
  const avgPerformance = results.reduce((acc, r) => acc + r.scores.performance, 0) / results.length;
  const avgLCP = results.reduce((acc, r) => acc + r.metrics.lcp, 0) / results.length;
  const avgFCP = results.reduce((acc, r) => acc + r.metrics.fcp, 0) / results.length;
  
  if (avgPerformance < 85) {
    report += `- ⚠️ **Performance Score Bajo (${Math.round(avgPerformance)}%)**: Considera optimizar imágenes y JavaScript\n`;
  }
  
  if (avgLCP > 2500) {
    report += `- ⚠️ **LCP Alto (${Math.round(avgLCP)}ms)**: Optimiza el elemento más grande de la página\n`;
  }
  
  if (avgFCP > 1800) {
    report += `- ⚠️ **FCP Alto (${Math.round(avgFCP)}ms)**: Mejora el tiempo de primer renderizado\n`;
  }
  
  if (avgPerformance >= 85 && avgLCP <= 2500 && avgFCP <= 1800) {
    report += `- ✅ **Excelente Performance**: Todas las métricas están en rangos óptimos\n`;
  }
  
  report += `\n---\n*Generado automáticamente por performance-check.js*`;
  
  return report;
}

/**
 * Main function
 */
async function runPerformanceCheck() {
  console.log('🚀 Iniciando análisis de performance...\n');
  
  const results = [];
  
  for (const url of URLS_TO_TEST) {
    try {
      console.log(`📊 Analizando: ${url}`);
      const result = await testWithPageSpeed(url);
      results.push(result);
      
      console.log(`✅ Completado - Performance: ${result.scores.performance}%, SEO: ${result.scores.seo}%`);
      
      // Wait 2 seconds between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`❌ Error analizando ${url}: ${error.message}`);
    }
  }
  
  if (results.length > 0) {
    // Generate and save report
    const report = generateReport(results);
    const reportPath = path.join(__dirname, '..', 'performance-report.md');
    fs.writeFileSync(reportPath, report);
    
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);
    console.log(`📊 URLs analizadas: ${results.length}/${URLS_TO_TEST.length}`);
    
    // Show summary
    const avgScores = {
      performance: Math.round(results.reduce((acc, r) => acc + r.scores.performance, 0) / results.length),
      seo: Math.round(results.reduce((acc, r) => acc + r.scores.seo, 0) / results.length)
    };
    
    console.log(`🎯 Puntuación promedio - Performance: ${avgScores.performance}%, SEO: ${avgScores.seo}%`);
  } else {
    console.log('❌ No se pudo analizar ninguna URL');
  }
}

// Execute if called directly
if (require.main === module) {
  runPerformanceCheck()
    .then(() => {
      console.log('\n✅ Análisis completado');
    })
    .catch(error => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { runPerformanceCheck }; 