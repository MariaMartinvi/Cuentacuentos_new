import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import emailjs from '@emailjs/browser';
import './ContactPage.css';
import SEO from '../SEO';

const ContactPage = () => {
  const { t, i18n } = useTranslation();
  const form = useRef();
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await emailjs.sendForm(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        form.current,
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );
      
      setStatus({ type: 'success', message: t('contact.form.success') });
      form.current.reset();
    } catch (error) {
      console.error('Error sending contact form:', error);
      setStatus({ type: 'error', message: t('contact.form.error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <SEO 
        title={i18n.language === 'es' ? 
          'Contacto - Mi Cuentacuentos' : 
          'Contact - My Storyteller'}
        description={i18n.language === 'es' ? 
          'Contacta con el equipo de Mi Cuentacuentos. Estamos aquí para responder tus preguntas y escuchar tus sugerencias.' : 
          'Contact the My Storyteller team. We are here to answer your questions and listen to your suggestions.'}
        keywords={['contacto', 'soporte', 'ayuda', 'preguntas', 'sugerencias', 'formulario de contacto']}
        lang={i18n.language}
      />
      
      <div className="page-header">
        <h1>{t('contact.title')}</h1>
        <p>{t('contact.description')}</p>
      </div>

      <div className="contact-container">
        <div className="contact-content">
          <form ref={form} onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">{t('contact.form.name')}</label>
              <input
                type="text"
                id="name"
                name="user_name"
                placeholder={t('contact.form.namePlaceholder')}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('contact.form.email')}</label>
              <input
                type="email"
                id="email"
                name="user_email"
                placeholder={t('contact.form.emailPlaceholder')}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">{t('contact.form.message')}</label>
              <textarea
                id="message"
                name="message"
                placeholder={t('contact.form.messagePlaceholder')}
                required
              />
            </div>

            {status.message && (
              <div className={`status-message ${status.type}`}>
                {status.message}
              </div>
            )}

            <button type="submit" disabled={loading} className="submit-button">
              {loading ? t('contact.form.loading') : t('contact.form.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;