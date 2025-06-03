import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createCheckoutSession, loadStripe } from '../services/subscriptionService';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from './SEO';
import ProductSchema from './ProductSchema';
import './Subscribe.css';

const Subscribe = () => {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure user data is loaded
    if (!user) {
      refreshUser();
    }
  }, [user, refreshUser]);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userEmail = user?.data?.email || user?.email;
      
      if (!user || !userEmail) {
        throw new Error('User email is required. Please log in again.');
      }

      const response = await createCheckoutSession(userEmail);
      
      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('Invalid response from subscription service');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError(error.message || 'An error occurred during subscription');
      
      // If the error is related to authentication, redirect to login
      if (error.message.includes('log in')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center p-4">
        <p>Please log in to subscribe.</p>
        <button 
          onClick={() => navigate('/login')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (user?.isPremium || user?.data?.isPremium || user?.data?.subscriptionStatus === 'active') {
    return (
      <div className="text-center p-4">
        <p>You are already a premium subscriber!</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
      </div>
    );
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
          'Suscripción Premium - AudioGretel' : 
          'Premium Subscription - AudioGretel'}
        description={i18n.language === 'es' ? 
          'Suscríbete a AudioGretel Premium y disfruta de generación ilimitada de cuentos, más idiomas y voces, y sin anuncios.' :
          'Subscribe to AudioGretel Premium and enjoy unlimited story generation, more languages and voices, and no ads.'}
        keywords={['suscripción premium', 'cuentos ilimitados', 'audiocuentos premium', 'generador de cuentos']}
        pageType="Product"
        ogType="product"
        lang={i18n.language}
      />
      
      <ProductSchema 
        name={i18n.language === 'es' ? "AudioGretel Premium" : "AudioGretel Premium"}
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