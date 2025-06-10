const https = require('https');
const { URL } = require('url');

// Configuración
const SITE_URL = 'https://audiogretel.com';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

// URLs de envío de sitemap
const SEARCH_ENGINES = [
  {
    name: 'Google',
    url: `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
  },
  {
    name: 'Bing',
    url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
  }
];

/**
 * Envía una solicitud HTTP GET a una URL
 */
function submitToSearchEngine(engine) {
  return new Promise((resolve, reject) => {
    const url = new URL(engine.url);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            engine: engine.name,
            status: 'success',
            statusCode: res.statusCode,
            message: `Sitemap enviado exitosamente a ${engine.name}`
          });
        } else {
          reject({
            engine: engine.name,
            status: 'error',
            statusCode: res.statusCode,
            message: `Error al enviar sitemap a ${engine.name}: ${res.statusCode}`
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        engine: engine.name,
        status: 'error',
        message: `Error de conexión con ${engine.name}: ${error.message}`
      });
    });

    req.setTimeout(10000, () => {
      req.abort();
      reject({
        engine: engine.name,
        status: 'timeout',
        message: `Timeout al conectar con ${engine.name}`
      });
    });

    req.end();
  });
}

/**
 * Función principal para enviar sitemap a todos los motores de búsqueda
 */
async function submitSitemap() {
  console.log('🚀 Iniciando envío de sitemap...');
  console.log(`📍 Sitemap URL: ${SITEMAP_URL}`);
  console.log('');

  const results = [];

  for (const engine of SEARCH_ENGINES) {
    try {
      console.log(`📤 Enviando sitemap a ${engine.name}...`);
      const result = await submitToSearchEngine(engine);
      results.push(result);
      console.log(`✅ ${result.message}`);
    } catch (error) {
      results.push(error);
      console.log(`❌ ${error.message}`);
    }
    
    // Pausa de 1 segundo entre requests para ser respetuosos
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('');
  console.log('📊 Resumen de envíos:');
  console.log('====================');
  
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`${icon} ${result.engine}: ${result.status.toUpperCase()}`);
  });

  console.log('');
  console.log('💡 Consejos adicionales:');
  console.log('- Verifica tu sitemap en: https://www.xml-sitemaps.com/validate-xml-sitemap.html');
  console.log('- Monitorea la indexación en Google Search Console');
  console.log('- Actualiza el sitemap cuando agregues nuevas páginas');
  
  return results;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  submitSitemap()
    .then(results => {
      const successCount = results.filter(r => r.status === 'success').length;
      const totalCount = results.length;
      
      console.log(`\n🎯 Completado: ${successCount}/${totalCount} envíos exitosos`);
      process.exit(successCount === totalCount ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { submitSitemap }; 