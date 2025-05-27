import React from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import './GoogleButton.css';

const GoogleButton = ({ onSuccess, onError, useOneTap = false, type = 'login' }) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="google-button-container">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        useOneTap={useOneTap}
        text={t(`${type}.signInWithGoogle`)}
        shape="rectangular"
        theme="filled_blue"
        locale={i18n.language}
        ux_mode="popup"
      />
    </div>
  );
};

export default GoogleButton; 