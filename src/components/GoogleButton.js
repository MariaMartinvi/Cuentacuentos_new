import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import config from '../config';
import './GoogleButton.css';

const GoogleButton = ({ onSuccess, onError, useOneTap = false, type = 'login' }) => {
  const { t } = useTranslation();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const handleError = (error) => {
    console.error('Google Sign-In Error:', error);
    
    if (error.error === 'popup_closed_by_user') {
      onError('Sign-in popup was closed');
    } else if (error.error === 'access_denied') {
      onError('Access was denied');
    } else if (error.error === 'immediate_failed') {
      // This is normal when using one-tap sign-in
      return;
    } else if (error.error === 'abort' || error.name === 'AbortError') {
      // Handle FedCM abort error with retry logic
      console.log('FedCM abort detected, retrying...');
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        // Force a small delay before retrying
        setTimeout(() => {
          // The component will re-render and retry
        }, 1000);
      } else {
        onError('Unable to complete Google sign-in. Please try again later.');
      }
    } else {
      onError(error.error || 'An error occurred during Google sign-in');
    }
  };

  return (
    <div className="google-button-container">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={handleError}
        useOneTap={useOneTap}
        theme="filled_blue"
        size="large"
        text={type === 'login' ? 'signin_with' : 'signup_with'}
        shape="rectangular"
        locale={t('common.language')}
        context={type}
        flow="implicit"
        ux_mode="popup"
        auto_select={false}
        cancel_on_tap_outside={true}
      />
    </div>
  );
};

export default GoogleButton; 