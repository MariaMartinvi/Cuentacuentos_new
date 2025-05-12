import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords = [], 
  canonicalUrl, 
  ogImage = '/logo512.png', 
  ogType = 'website',
  lang = 'es'
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
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seoUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />

      {/* Metadatos adicionales */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="author" content="Mi Cuentacuentos" />
    </Helmet>
  );
};

export default SEO; 