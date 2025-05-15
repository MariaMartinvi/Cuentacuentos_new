import React from 'react';
import { useTranslation } from 'react-i18next';
import './RetryButton.css';

const RetryButton = ({ onClick, text, isLoading }) => {
  const { t } = useTranslation();
  
  return (
    <button
      className={`retry-button ${isLoading ? 'loading' : ''}`}
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="loading-spinner"></span>
      ) : (
        <span className="retry-icon">↻</span>
      )}
      {text || t('common.retry')}
    </button>
  );
};

export default RetryButton; 