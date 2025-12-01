import React from 'react';
import { useTranslation } from 'react-i18next';
import LazyImage from './LazyImage';
import './TestimonialsSection.css';

function TestimonialsSection() {
  const { t } = useTranslation();

  return (
    <section className="testimonials-section">
      <div className="container">
        <h2 className="section-title">{t('testimonials.title')}</h2>
        <p className="section-subtitle">{t('testimonials.subtitle')}</p>
        
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <div className="quote-icon">"</div>
              <p>{t('testimonials.testimonial1.content')}</p>
            </div>
            <div className="testimonial-author">
              <div className="author-image">
                <LazyImage 
                  src="/images/testimonials/testimonial1.jpg" 
                  alt={t('testimonials.testimonial1.name')}
                  size="small"
                />
              </div>
              <div className="author-info">
                <h4>{t('testimonials.testimonial1.name')}</h4>
                <p>{t('testimonials.testimonial1.role')}</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-content">
              <div className="quote-icon">"</div>
              <p>{t('testimonials.testimonial2.content')}</p>
            </div>
            <div className="testimonial-author">
              <div className="author-image">
                <LazyImage 
                  src="/images/testimonials/testimonial2.jpg" 
                  alt={t('testimonials.testimonial2.name')}
                  size="small"
                />
              </div>
              <div className="author-info">
                <h4>{t('testimonials.testimonial2.name')}</h4>
                <p>{t('testimonials.testimonial2.role')}</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-content">
              <div className="quote-icon">"</div>
              <p>{t('testimonials.testimonial3.content')}</p>
            </div>
            <div className="testimonial-author">
              <div className="author-image">
                <LazyImage 
                  src="/images/testimonials/testimonial3.jpg" 
                  alt={t('testimonials.testimonial3.name')}
                  size="small"
                />
              </div>
              <div className="author-info">
                <h4>{t('testimonials.testimonial3.name')}</h4>
                <p>{t('testimonials.testimonial3.role')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection; 