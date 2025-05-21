import React from 'react';
import { useEffect } from 'react';

/**
 * DynamicSitemap - Component to generate dynamic sitemap.xml content
 * Can be used in a serverless function or in a build script
 * 
 * @param {Object} props
 * @param {Array<Object>} props.urls - Array of URL objects with path, lastmod, changefreq, priority
 * @returns {String} XML content
 */
export function generateSitemapXml(urls = []) {
  const baseUrl = 'https://micuentacuentos.com';
  
  // Start XML sitemap format
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static pages first (these are already in our static sitemap.xml)
  const staticPages = [
    { path: '/', lastmod: '2023-07-01', changefreq: 'weekly', priority: '1.0' },
    { path: '/about', lastmod: '2023-07-01', changefreq: 'monthly', priority: '0.8' },
    { path: '/services', lastmod: '2023-07-01', changefreq: 'monthly', priority: '0.8' },
    { path: '/contact', lastmod: '2023-07-01', changefreq: 'monthly', priority: '0.7' },
    { path: '/login', lastmod: '2023-07-01', changefreq: 'monthly', priority: '0.6' },
    { path: '/register', lastmod: '2023-07-01', changefreq: 'monthly', priority: '0.6' },
    { path: '/politica', lastmod: '2023-07-01', changefreq: 'yearly', priority: '0.5' },
  ];
  
  // Add each page to XML
  [...staticPages, ...urls].forEach(page => {
    const fullUrl = `${baseUrl}${page.path}`;
    
    xml += `
  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${page.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq || 'monthly'}</changefreq>
    <priority>${page.priority || '0.5'}</priority>
  </url>`;
  });
  
  // Close XML
  xml += `
</urlset>`;
  
  return xml;
}

/**
 * Creates a function that can be used with a serverless function to generate a dynamic sitemap
 * Example usage in a Netlify function:
 * 
 * exports.handler = async function(event, context) {
 *   const stories = await fetchStoriesFromDatabase();
 *   const storyUrls = stories.map(story => ({
 *     path: `/story/${story.id}`,
 *     lastmod: story.updatedAt.split('T')[0],
 *     changefreq: 'monthly',
 *     priority: '0.7'
 *   }));
 *   
 *   const xml = generateSitemapXml(storyUrls);
 *   
 *   return {
 *     statusCode: 200,
 *     headers: { 'Content-Type': 'application/xml' },
 *     body: xml
 *   };
 * };
 */
export function createSitemapHandler(fetchUrlsFunction) {
  return async function(event, context) {
    try {
      const dynamicUrls = await fetchUrlsFunction();
      const xml = generateSitemapXml(dynamicUrls);
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/xml' },
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
}

export default { generateSitemapXml, createSitemapHandler }; 