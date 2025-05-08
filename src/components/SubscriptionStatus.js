import React from 'react';
import { useTranslation } from 'react-i18next';
import { createCheckoutSession, loadStripe } from '../services/subscriptionService';

const SubscriptionStatus = ({ status, storiesRemaining, email }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      const { sessionId } = await createCheckoutSession(email);
      const stripe = await loadStripe();
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Subscription error:', error);
      alert(t('subscription.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="subscription-status">
      <div className="status-info">
        {status === 'free' ? (
          <>
            <h3>{t('subscription.freeTitle')}</h3>
            <p>
              {t('subscription.freeDescription', { remaining: storiesRemaining })}
            </p>
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="subscribe-button"
            >
              {isLoading ? t('subscription.processing') : t('subscription.subscribe')}
            </button>
          </>
        ) : status === 'active' ? (
          <>
            <h3>{t('subscription.activeTitle')}</h3>
            <p>
              {t('subscription.activeDescription', { remaining: storiesRemaining })}
            </p>
          </>
        ) : (
          <>
            <h3>{t('subscription.cancelledTitle')}</h3>
            <p>{t('subscription.cancelledDescription')}</p>
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="subscribe-button"
            >
              {isLoading ? t('subscription.processing') : t('subscription.resubscribe')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus; 