import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { createCheckoutSession, loadStripe } from '../services/subscriptionService';
import './Subscribe.css';
import SEO from './SEO';

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

  return (
    <div className="subscribe-container">
      <SEO 
        title={i18n.language === 'es' ? 
          'Suscripción Premium - Mi Cuentacuentos' : 
          'Premium Subscription - My Storyteller'}
        description={i18n.language === 'es' ? 
          'Suscríbete al plan premium de Mi Cuentacuentos y desbloquea acceso ilimitado a la generación de cuentos personalizados para niños.' : 
          'Subscribe to My Storyteller premium plan and unlock unlimited access to personalized story generation for children.'}
        keywords={['suscripción premium', 'plan mensual', 'cuentos ilimitados', 'características premium', 'acceso completo']}
        lang={i18n.language}
      />
      
      <div className="subscribe-card">
        <h1 className="subscribe-title">{t('subscription.title')}</h1>
        <p className="subscribe-subtitle">{t('subscription.subtitle')}</p>

        <div className="subscription-plan">
          <h2 className="plan-title">{t('subscription.planTitle')}</h2>
          <p className="plan-price">{t('subscription.price')}</p>
          <p className="plan-description">{t('subscription.planDescription')}</p>

          <ul className="features-list">
            {features.map((feature, index) => (
              <li key={index} className="feature-item">
                <span className="check-icon">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            className="subscribe-button"
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? t('subscription.loading') : t('subscription.subscribeButton')}
          </button>

          <p className="cancel-info">{t('subscription.cancelInfo')}</p>
          <p className="payment-info">{t('subscription.paymentInfo')}</p>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;