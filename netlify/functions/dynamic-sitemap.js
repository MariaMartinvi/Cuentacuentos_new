const { generateSitemapXml } = require('../../src/components/DynamicSitemap');

/**
 * Netlify function to generate a dynamic sitemap
 * This will be accessible at /.netlify/functions/dynamic-sitemap
 */
exports.handler = async function(event, context) {
  try {
    // In a real implementation, you would fetch dynamic content URLs from your database
    // For example, fetch all published stories and their last updated dates
    
    // This is an example - replace with actual data fetching logic
    const dynamicUrls = [
      // Example of a dynamically generated story page
      { 
        path: '/story/example-story-1', 
        lastmod: '2023-06-15', 
        changefreq: 'monthly', 
        priority: '0.7' 
      },
      { 
        path: '/story/example-story-2', 
        lastmod: '2023-06-20', 
        changefreq: 'monthly', 
        priority: '0.7' 
      },
      // Add more dynamic URLs as needed
    ];
    
    // Generate the XML
    const xml = generateSitemapXml(dynamicUrls);
    
    // Return the sitemap XML
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      },
      body: xml
    };
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error generating sitemap' })
    };
  }
}; 