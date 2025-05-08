import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './SubscriptionSuccess.css';

const SubscriptionSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      console.error('No session ID found in URL');
      navigate('/subscribe');
      return;
    }

    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, searchParams]);

  return (
    <div className="subscription-success-container">
      <h1>{t('subscription.successTitle')}</h1>
      <p>{t('subscription.successMessage')}</p>
      <p>{t('subscription.redirectMessage')}</p>
      <div className="countdown">
        {countdown}
      </div>
    </div>
  );
};

export default SubscriptionSuccess; 