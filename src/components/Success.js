import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './Success.css';

const Success = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifySubscription = async () => {
      const sessionId = new URLSearchParams(location.search).get('session_id');
      
      if (!sessionId) {
        setError(t('subscription.noSessionId'));
        setLoading(false);
        return;
      }

      try {
        console.log('Verifying subscription with session ID:', sessionId);
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        const response = await axios.get(`${apiUrl}/api/stripe/success`, {
          params: { session_id: sessionId },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        console.log('Subscription verification response:', response.data);
        
        if (response.data.success) {
          // Update local storage with new user data from backend
          const updatedUser = response.data.user;
          localStorage.setItem('user', JSON.stringify(updatedUser));

          // Refresh user data to get updated subscription status
          await refreshUser();
          setLoading(false);
          
          // Redirect after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          throw new Error('Subscription verification failed');
        }
      } catch (err) {
        console.error('Error verifying subscription:', err);
        setError(t('subscription.verificationError') || 'Error verifying subscription');
        setLoading(false);
      }
    };

    verifySubscription();
  }, [location, navigate, t, refreshUser]);

  if (!user) {
    return null;
  }

  return (
    <div className="success-container">
      <h1>{t('subscription.paymentSuccess')}</h1>
      <p>{t('subscription.thankYou')}</p>
      {loading && <p>{t('subscription.processing')}</p>}
      {error && <div className="error-message">{error}</div>}
      {!loading && !error && (
        <p>{t('subscription.redirecting')}</p>
      )}
    </div>
  );
};

export default Success;