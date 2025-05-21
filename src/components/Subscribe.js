import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { createCheckoutSession, loadStripe } from '../services/subscriptionService';
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

      console.log('Subscribe: Creating checkout session for user:', user.email);
      
      // Create checkout session and redirect
      await createCheckoutSession(user.email);
      
    } catch (error) {
      console.error('Subscribe error:', error);
      setError(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // If no user is logged in, show nothing until redirect happens
  if (!user) {
    return null;
  }

  const features = [
    t('subscription.features.0'),
    t('subscription.features.1'),
    t('subscription.features.2'),
    t('subscription.features.3'),
    t('subscription.features.4')
  ];

  // Get current date plus one year for priceValidUntil
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const priceValidUntil = oneYearFromNow.toISOString().split('T')[0]; // Format as YYYY-MM-DD

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
      
      <h1 className="subscribe-title">{t('subscription.title')}</h1>
      <p className="subscribe-description">{t('subscription.description')}</p>

      <div className="subscription-cards">
        <div className="subscription-card premium">
          <h2>{t('subscription.premium.title')}</h2>
          <p className="price">{t('subscription.premium.price')}</p>
          <ul className="features-list">
            {features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
          <button 
            onClick={handleSubscribe}
            className="subscribe-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner small-spinner"></div>
                {t('subscription.loading')}
              </>
            ) : (
              t('subscription.subscribe')
            )}
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Subscribe;