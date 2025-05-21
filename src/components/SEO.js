import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords = [], 
  canonicalUrl, 
  ogImage = '/logo512.png', 
  ogType = 'website',
  lang = 'es',
  articlePublishedTime,
  articleModifiedTime,
  articleSection,
  articleTags,
  pageType = 'WebPage',
  children
}) => {
  // Valores por defecto para SEO
  const defaultTitle = 'Mi Cuentacuentos - Audiocuentos personalizados para niños';
  const defaultDescription = 'Genera cuentos personalizados para niños con inteligencia artificial. Convierte historias en audio con diferentes voces y acentos.';
  const defaultKeywords = ['cuentos para niños', 'audiocuentos', 'historias personalizadas', 'cuentos en audio', 'aprender idiomas', 'cuentos en inglés', 'cuentos en español'];
  const siteUrl = 'https://micuentacuentos.com';

  // Usar valores proporcionados o valores por defecto
  const seoTitle = title || defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoKeywords = [...defaultKeywords, ...keywords].join(', ');
  const seoUrl = canonicalUrl || siteUrl;
  
  // Prepare structured data
  const baseSchemaOrgWebPage = {
    '@context': 'https://schema.org',
    '@type': pageType,
    headline: seoTitle,
    description: seoDescription,
    url: seoUrl,
    author: {
      '@type': 'Organization',
      name: 'Mi Cuentacuentos',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Mi Cuentacuentos',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo512.png`,
      }
    }
  };

  // Add article specific schema if applicable
  const articleSchema = articlePublishedTime ? {
    ...baseSchemaOrgWebPage,
    '@type': 'Article',
    datePublished: articlePublishedTime,
    dateModified: articleModifiedTime || articlePublishedTime,
    articleSection: articleSection || '',
    keywords: articleTags ? articleTags.join(', ') : seoKeywords,
  } : null;

  // Determine which schema to use
  const schemaOrgWebPage = articleSchema || baseSchemaOrgWebPage;

  return (
    <Helmet htmlAttributes={{ lang }}>
      {/* Metadatos básicos */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={seoUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:site_name" content="Mi Cuentacuentos" />
      <meta property="og:locale" content={lang === 'es' ? 'es_ES' : 'en_US'} />
      
      {/* Article specific tags */}
      {articlePublishedTime && <meta property="article:published_time" content={articlePublishedTime} />}
      {articleModifiedTime && <meta property="article:modified_time" content={articleModifiedTime} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seoUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />

      {/* Metadatos adicionales */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="author" content="Mi Cuentacuentos" />
      
      {/* Mobile SEO */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#4361ee" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaOrgWebPage)}
      </script>
      
      {/* Allow additional custom head elements */}
      {children}
    </Helmet>
  );
};

export default SEO; 