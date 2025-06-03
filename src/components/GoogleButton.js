import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import config from '../config';
import './GoogleButton.css';

const GoogleButton = ({ onSuccess, onError, useOneTap = false, type = 'login' }) => {
  const { t } = useTranslation();

  const handleError = (error) => {
    console.error('Google Sign-In Error:', error);
    if (error.error === 'popup_closed_by_user') {
      onError('Sign-in popup was closed');
    } else if (error.error === 'access_denied') {
      onError('Access was denied');
    } else if (error.error === 'immediate_failed') {
      // This is normal when using one-tap sign-in
      return;
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
        hosted_domain={config.isProduction ? 'generadorcuentos.onrender.com' : 'localhost'}
      />
    </div>
  );
};

export default GoogleButton; 