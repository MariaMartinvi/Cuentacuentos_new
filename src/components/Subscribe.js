import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { createCheckoutSession } from '../services/subscriptionService';
import './Subscribe.css';
import SEO from './SEO';
import ProductSchema from './ProductSchema';

const Subscribe = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.email) {
        throw new Error('User email is required');
      }

      await createCheckoutSession(user.email);
      
    } catch (error) {
      console.error('Subscribe error:', error);
      setError(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const features = [
    t('subscription.premium.features.0'),
    t('subscription.premium.features.1'),
    t('subscription.premium.features.2'),
    t('subscription.premium.features.3'),
    t('subscription.premium.features.4')
  ];

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const priceValidUntil = oneYearFromNow.toISOString().split('T')[0];

  return (
    <div className="subscribe-container">
      <SEO 
        title={i18n.language === 'es' ? 
          'Suscripción Premium - Mi Cuentacuentos' : 
          'Premium Subscription - My Storyteller'}
        description={i18n.language === 'es' ? 
          'Suscríbete a Mi Cuentacuentos Premium y disfruta de generación ilimitada de cuentos, más idiomas y voces, y sin anuncios.' :
          'Subscribe to My Storyteller Premium and enjoy unlimited story generation, more languages and voices, and no ads.'}
        keywords={['suscripción premium', 'cuentos ilimitados', 'audiocuentos premium', 'generador de cuentos']}
        pageType="Product"
        ogType="product"
        lang={i18n.language}
      />
      
      <ProductSchema 
        name={i18n.language === 'es' ? "Mi Cuentacuentos Premium" : "My Storyteller Premium"}
        description={i18n.language === 'es' ? 
          "Suscripción premium para generación ilimitada de cuentos personalizados" : 
          "Premium subscription for unlimited personalized story generation"}
        image="/og-image.jpg"
        price="9.99"
        currency="EUR"
        availability="InStock" 
        url="/subscribe"
        sku="premium-monthly"
        priceValidUntil={priceValidUntil}
      />
      
      <div className="subscribe-card">
        <h1 className="subscribe-title">{t('subscription.premium.title')}</h1>
        <p className="subscribe-subtitle">{t('subscription.planDescription')}</p>

        <div className="premium-features-banner">
          <div className="premium-features-text">
            <p className="premium-features-title">
              <span className="premium-features-icon">⭐</span>
              <span className="price-amount">5€</span>
            </p>
            <p className="premium-features-subtitle">{t('subscription.cancelInfo')}</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="features-list">
          {features.map((feature, index) => (
            <div key={index} className="feature-item">
              <span className="check-icon">✓</span>
              {feature}
            </div>
          ))}
        </div>

        <button 
          onClick={handleSubscribe}
          className="subscribe-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner small-spinner"></div>
              {t('subscription.processing')}
            </>
          ) : (
            t('subscription.subscribe')
          )}
        </button>

        <p className="payment-info">{t('subscription.paymentInfo')}</p>
      </div>
    </div>
  );
};

export default Subscribe;