import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEO from '../SEO';

const BlogPost1 = () => {
  const { t, i18n } = useTranslation();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": t('blogPost1.title'),
    "description": t('blogPost1.description'),
    "author": {
      "@type": "Organization",
      "name": "AudioGretel"
    },
    "publisher": {
      "@type": "Organization",
      "name": "AudioGretel",
      "logo": {
        "@type": "ImageObject",
        "url": "https://audiogretel.com/logo512.png"
      }
    },
    "datePublished": "2025-01-02",
    "dateModified": "2025-01-02",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://audiogretel.com/blog/beneficios-audiocuentos-ia-ninos"
    }
  };

  return (
    <>
      <SEO
        title={t('blogPost1.seoTitle')}
        description={t('blogPost1.seoDescription')}
        keywords={t('blogPost1.seoKeywords', { returnObjects: true })}
        canonicalUrl="https://audiogretel.com/blog/beneficios-audiocuentos-ia-ninos"
        lang={i18n.language}
        pageType="Article"
        articlePublishedTime="2025-01-02"
        articleModifiedTime="2025-01-02"
      >
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </SEO>

      <div className="blog-post">
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
          <article>
            <header className="post-header" style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#2c3e50' }}>
                {t('blogPost1.title')}
              </h1>
              <div className="post-meta" style={{ color: '#666', marginBottom: '2rem' }}>
                <time dateTime="2025-01-02">{t('blogPost1.date')}</time> • 
                <span> {t('blogPost1.readTime')}</span>
              </div>
            </header>

            <div className="post-content" style={{ lineHeight: '1.8', fontSize: '1.1rem' }}>
              <p style={{ marginBottom: '1.5rem' }}>
                {t('blogPost1.intro')}
              </p>

              <h2 style={{ color: '#2c3e50', marginTop: '2rem', marginBottom: '1rem' }}>
                {t('blogPost1.section1Title')}
              </h2>
              <p style={{ marginBottom: '1.5rem' }}>
                {t('blogPost1.section1Content')}
              </p>

              <h2 style={{ color: '#2c3e50', marginTop: '2rem', marginBottom: '1rem' }}>
                {t('blogPost1.section2Title')}
              </h2>
              <ul style={{ marginBottom: '1.5rem', paddingLeft: '2rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>{t('blogPost1.benefit1')}</li>
                <li style={{ marginBottom: '0.5rem' }}>{t('blogPost1.benefit2')}</li>
                <li style={{ marginBottom: '0.5rem' }}>{t('blogPost1.benefit3')}</li>
                <li style={{ marginBottom: '0.5rem' }}>{t('blogPost1.benefit4')}</li>
              </ul>

              <h2 style={{ color: '#2c3e50', marginTop: '2rem', marginBottom: '1rem' }}>
                {t('blogPost1.section3Title')}
              </h2>
              <p style={{ marginBottom: '1.5rem' }}>
                {t('blogPost1.section3Content')}
              </p>

              <div className="cta-box" style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white', 
                padding: '2rem', 
                borderRadius: '10px', 
                textAlign: 'center',
                margin: '2rem 0'
              }}>
                <h3 style={{ marginBottom: '1rem' }}>{t('blogPost1.ctaTitle')}</h3>
                <p style={{ marginBottom: '1.5rem' }}>{t('blogPost1.ctaDescription')}</p>
                <Link 
                  to="/" 
                  style={{ 
                    background: 'white', 
                    color: '#667eea', 
                    padding: '1rem 2rem', 
                    borderRadius: '50px', 
                    textDecoration: 'none', 
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}
                >
                  {t('blogPost1.ctaButton')}
                </Link>
              </div>

              <p style={{ marginBottom: '1.5rem' }}>
                {t('blogPost1.conclusion')}
              </p>
            </div>
          </article>

          <div className="related-posts" style={{ marginTop: '3rem', padding: '2rem', background: '#f8f9fa', borderRadius: '10px' }}>
            <h3 style={{ marginBottom: '1rem' }}>{t('blogPost1.relatedTitle')}</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/herramientas/generador-audiocuentos" style={{ 
                color: '#667eea', 
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                background: 'white',
                borderRadius: '5px',
                border: '1px solid #ddd'
              }}>
                {t('blogPost1.relatedLink1')}
              </Link>
              <Link to="/como-generar-audiocuentos-ia" style={{ 
                color: '#667eea', 
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                background: 'white',
                borderRadius: '5px',
                border: '1px solid #ddd'
              }}>
                {t('blogPost1.relatedLink2')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPost1; 