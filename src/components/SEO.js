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
  const defaultTitle = {
    es: 'AudioGretel - Audiocuentos personalizados para niños',
    en: 'AudioGretel - Personalized audio stories for children',
    ca: 'AudioGretel - Audiocontes personalitzats per a nens',
    fr: 'AudioGretel - Histoires audio personnalisées pour enfants',
    it: 'AudioGretel - Storie audio personalizzate per bambini',
    de: 'AudioGretel - Personalisierte Audiogeschichten für Kinder',
    gl: 'AudioGretel - Contos de audio personalizados para nenos',
    pt: 'AudioGretel - Histórias de áudio personalizadas para crianças',
    eu: 'AudioGretel - Haurrentzako audio-ipuin pertsonalizatuak'
  };

  const defaultDescription = {
    es: 'Genera audiocuentos personalizados para niños con inteligencia artificial. Convierte historias en audio con diferentes voces y acentos para aprender idiomas.',
    en: 'Generate personalized audio stories for children with artificial intelligence. Convert stories to audio with different voices and accents to learn languages.',
    ca: 'Genera audiocontes personalitzats per a nens amb intel·ligència artificial. Converteix històries en àudio amb diferents veus i accents per aprendre idiomes.',
    fr: 'Générez des histoires audio personnalisées pour les enfants avec l\'intelligence artificielle. Convertissez des histoires en audio avec différentes voix et accents pour apprendre les langues.',
    it: 'Genera storie audio personalizzate per bambini con intelligenza artificiale. Converti storie in audio con diverse voci e accenti per imparare le lingue.',
    de: 'Erstellen Sie personalisierte Audiogeschichten für Kinder mit künstlicher Intelligenz. Konvertieren Sie Geschichten in Audio mit verschiedenen Stimmen und Akzenten zum Sprachenlernen.',
    gl: 'Xera contos de audio personalizados para nenos con intelixencia artificial. Converte historias en audio con diferentes voces e acentos para aprender idiomas.',
    pt: 'Gere histórias de áudio personalizadas para crianças com inteligência artificial. Converta histórias em áudio com diferentes vozes e sotaques para aprender idiomas.',
    eu: 'Haurrentzako audio-ipuin pertsonalizatuak sortu adimen artifizialarekin. Ipuinak audio bihurtu ahots eta azentu desberdinekin hizkuntzak ikasteko.'
  };

  const defaultKeywords = {
    es: [
      'audiocuentos para niños',
      'cuentos personalizados',
      'historias en audio',
      'aprender idiomas',
      'cuentos en inglés',
      'cuentos en español',
      'cuentos en catalán',
      'cuentos en francés',
      'cuentos en italiano',
      'cuentos en alemán',
      'cuentos en gallego',
      'cuentos en portugués',
      'cuentos en euskera',
      'inteligencia artificial',
      'educación infantil'
    ],
    en: [
      'audio stories for children',
      'personalized stories',
      'audio stories',
      'language learning',
      'stories in English',
      'stories in Spanish',
      'stories in Catalan',
      'stories in French',
      'stories in Italian',
      'stories in German',
      'stories in Galician',
      'stories in Portuguese',
      'stories in Basque',
      'artificial intelligence',
      'children education'
    ],
    ca: [
      'audiocontes per a nens',
      'contes personalitzats',
      'històries en àudio',
      'aprendre idiomes',
      'contes en anglès',
      'contes en castellà',
      'contes en català',
      'contes en francès',
      'contes en italià',
      'contes en alemany',
      'contes en gallec',
      'contes en portuguès',
      'contes en basc',
      'intel·ligència artificial',
      'educació infantil'
    ],
    fr: [
      'histoires audio pour enfants',
      'histoires personnalisées',
      'histoires en audio',
      'apprentissage des langues',
      'histoires en anglais',
      'histoires en espagnol',
      'histoires en catalan',
      'histoires en français',
      'histoires en italien',
      'histoires en allemand',
      'histoires en galicien',
      'histoires en portugais',
      'histoires en basque',
      'intelligence artificielle',
      'éducation des enfants'
    ],
    it: [
      'storie audio per bambini',
      'storie personalizzate',
      'storie in audio',
      'apprendimento delle lingue',
      'storie in inglese',
      'storie in spagnolo',
      'storie in catalano',
      'storie in francese',
      'storie in italiano',
      'storie in tedesco',
      'storie in galiziano',
      'storie in portoghese',
      'storie in basco',
      'intelligenza artificiale',
      'educazione infantile'
    ],
    de: [
      'Audiogeschichten für Kinder',
      'personalisierte Geschichten',
      'Audiogeschichten',
      'Sprachlernen',
      'Geschichten auf Englisch',
      'Geschichten auf Spanisch',
      'Geschichten auf Katalanisch',
      'Geschichten auf Französisch',
      'Geschichten auf Italienisch',
      'Geschichten auf Deutsch',
      'Geschichten auf Galizisch',
      'Geschichten auf Portugiesisch',
      'Geschichten auf Baskisch',
      'künstliche Intelligenz',
      'Kindererziehung'
    ],
    gl: [
      'contos de audio para nenos',
      'contos personalizados',
      'historias en audio',
      'aprender idiomas',
      'contos en inglés',
      'contos en castelán',
      'contos en catalán',
      'contos en francés',
      'contos en italiano',
      'contos en alemán',
      'contos en galego',
      'contos en portugués',
      'contos en éuscaro',
      'intelixencia artificial',
      'educación infantil'
    ],
    pt: [
      'histórias de áudio para crianças',
      'histórias personalizadas',
      'histórias em áudio',
      'aprendizagem de idiomas',
      'histórias em inglês',
      'histórias em espanhol',
      'histórias em catalão',
      'histórias em francês',
      'histórias em italiano',
      'histórias em alemão',
      'histórias em galego',
      'histórias em português',
      'histórias em basco',
      'inteligência artificial',
      'educação infantil'
    ],
    eu: [
      'haurrentzako audio-ipuinak',
      'ipuin pertsonalizatuak',
      'audio-ipuinak',
      'hizkuntzak ikastea',
      'ingelesezko ipuinak',
      'gaztelaniazko ipuinak',
      'katalanezko ipuinak',
      'frantsesezko ipuinak',
      'italierazko ipuinak',
      'alemanezko ipuinak',
      'galizierazko ipuinak',
      'portugesezko ipuinak',
      'euskal ipuinak',
      'adimen artifiziala',
      'haur hezkuntza'
    ]
  };

  const siteUrl = 'https://audiogretel.com';
  const currentLang = lang || 'es';

  // Usar valores proporcionados o valores por defecto
  const seoTitle = title || defaultTitle[currentLang];
  const seoDescription = description || defaultDescription[currentLang];
  const seoKeywords = [...(defaultKeywords[currentLang] || defaultKeywords['es']), ...keywords].join(', ');
  const seoUrl = canonicalUrl || siteUrl;

  // Language-specific Open Graph locales
  const ogLocales = {
    es: 'es_ES',
    en: 'en_US',
    ca: 'ca_ES',
    fr: 'fr_FR',
    it: 'it_IT',
    de: 'de_DE',
    gl: 'gl_ES',
    pt: 'pt_PT',
    eu: 'eu_ES'
  };

  // Prepare structured data
  const baseSchemaOrgWebPage = {
    '@context': 'https://schema.org',
    '@type': pageType,
    headline: seoTitle,
    description: seoDescription,
    url: seoUrl,
    author: {
      '@type': 'Organization',
      name: 'AudioGretel',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AudioGretel',
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
    <Helmet htmlAttributes={{ lang: currentLang }}>
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
      <meta property="og:site_name" content="AudioGretel" />
      <meta property="og:locale" content={ogLocales[currentLang]} />
      
      {/* Language alternates */}
      {Object.entries(ogLocales).map(([langCode, locale]) => (
        <meta key={langCode} property="og:locale:alternate" content={locale} />
      ))}
      
      {/* Language alternates */}
      {Object.keys(ogLocales).map(langCode => (
        <link key={langCode} rel="alternate" hrefLang={langCode} href={`${siteUrl}/${langCode}`} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={siteUrl} />
      
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
      <meta name="author" content="AudioGretel" />
      
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