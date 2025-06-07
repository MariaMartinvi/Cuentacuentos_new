import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { verifyEmail, resendVerificationEmail, checkEmailVerification } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode'); // Firebase action code
    
    console.log('📧 VerifyEmail component loaded with params:', { mode, oobCode: oobCode ? 'present' : 'missing' });

    if (mode === 'verifyEmail' && oobCode && !isProcessing) {
      handleFirebaseVerification(oobCode);
    } else if (!oobCode) {
      // No action code - show manual verification check
      setStatus('manual');
      setMessage('Revisa tu email y haz clic en el enlace de verificación.');
    } else {
      setStatus('error');
      setMessage('Enlace de verificación inválido.');
    }
  }, [location, isProcessing]);

  const handleFirebaseVerification = async (actionCode) => {
    if (isProcessing) {
      console.log('🚫 Verification already in progress, skipping...');
      return;
    }

    try {
      setIsProcessing(true);
      setStatus('verifying');
      console.log('🔍 Starting Firebase email verification with action code');
      
      const response = await verifyEmail(actionCode);
      console.log('✅ Firebase email verification response:', response);
      
      if (response && response.success) {
        setStatus('success');
        setMessage(response.message || '¡Email verificado exitosamente!');
        
        // Refresh user context if user is logged in
        if (user) {
          try {
            await refreshUser();
            console.log('🔄 User context refreshed after verification');
            setMessage('¡Email verificado exitosamente! Tu cuenta ya está completamente activa.');
            
            // Redirect to dashboard
            setTimeout(() => {
              navigate('/dashboard', { 
                state: { 
                  message: '¡Email verificado exitosamente!',
                  type: 'success' 
                }
              });
            }, 2000);
          } catch (refreshError) {
            console.log('⚠️ Failed to refresh user context:', refreshError);
            // Still success, just redirect to login
            setTimeout(() => {
              navigate('/login', { 
                state: { 
                  message: '¡Email verificado! Ya puedes iniciar sesión.',
                  type: 'success' 
                }
              });
            }, 3000);
          }
        } else {
          // Not logged in, redirect to login
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: '¡Email verificado! Ya puedes iniciar sesión.',
                type: 'success' 
              }
            });
          }, 3000);
        }
      } else {
        console.error('❌ Verification response does not indicate success:', response);
        throw new Error(response?.message || 'Error en la verificación');
      }
    } catch (error) {
      console.error('💥 Firebase email verification failed:', error);
      setStatus('error');
      setMessage(error.message || 'Error desconocido al verificar el email');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user) {
      setMessage('Debes estar autenticado para reenviar la verificación');
      return;
    }

    try {
      setIsResending(true);
      const response = await resendVerificationEmail();
      
      if (response.success) {
        setMessage('Email de verificación reenviado. Revisa tu bandeja de entrada.');
        setStatus('manual');
      } else {
        throw new Error(response.message || 'Error al reenviar email');
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      setMessage(error.message || 'Error al reenviar el email de verificación');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setIsProcessing(true);
      const result = await checkEmailVerification();
      
      if (result.emailVerified) {
        setStatus('success');
        setMessage('¡Email verificado exitosamente!');
        
        // Refresh user context
        await refreshUser();
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard', { 
            state: { 
              message: '¡Email verificado exitosamente!',
              type: 'success' 
            }
          });
        }, 2000);
      } else {
        setMessage('El email aún no ha sido verificado. Revisa tu bandeja de entrada y spam.');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      setMessage('Error al verificar el estado del email');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="verification-content">
            <div className="verification-spinner">
              <div className="spinner"></div>
            </div>
            <h2>🔍 Verificando tu email...</h2>
            <p>Por favor espera mientras verificamos tu dirección de email.</p>
          </div>
        );

      case 'success':
        return (
          <div className="verification-content success">
            <div className="success-icon">✅</div>
            <h2>¡Email verificado exitosamente!</h2>
            <p>{message}</p>
            
            {!user && (
              <div className="action-buttons">
                <button 
                  onClick={() => navigate('/login')}
                  className="btn btn-primary"
                >
                  Iniciar Sesión
                </button>
              </div>
            )}
          </div>
        );

      case 'manual':
        return (
          <div className="verification-content">
            <div className="info-icon">📧</div>
            <h2>Verifica tu email</h2>
            <p>{message}</p>
            
            <div className="verification-steps">
              <div className="step">
                <span className="step-number">1</span>
                <span>Revisa tu bandeja de entrada y spam</span>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <span>Haz clic en el enlace de verificación</span>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <span>¡Tu cuenta estará verificada!</span>
              </div>
            </div>

            <div className="action-buttons">
              {user && (
                <>
                  <button 
                    onClick={handleCheckVerification}
                    disabled={isProcessing}
                    className="btn btn-primary"
                  >
                    {isProcessing ? 'Verificando...' : 'Ya verifiqué mi email'}
                  </button>
                  <button 
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="btn btn-secondary"
                  >
                    {isResending ? 'Reenviando...' : 'Reenviar Email'}
                  </button>
                </>
              )}
              
              <button 
                onClick={() => navigate('/login')}
                className="btn btn-outline"
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="verification-content error">
            <div className="error-icon">❌</div>
            <h2>Error en la verificación</h2>
            <p>{message}</p>
            
            <div className="action-buttons">
              {user && (
                <button 
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="btn btn-secondary"
                >
                  {isResending ? 'Reenviando...' : 'Reenviar Email de Verificación'}
                </button>
              )}
              <button 
                onClick={() => navigate('/register')}
                className="btn btn-outline"
              >
                Registrarse de Nuevo
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="btn btn-primary"
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="verify-email-page">
      <div className="verify-email-container">
        <div className="verify-email-card">
          <div className="logo-section">
            <h1>🎭 Cuentos Personalizados</h1>
          </div>
          
          {renderContent()}
          
          <div className="help-section">
            <p>¿Necesitas ayuda? <a href="/contact">Contáctanos</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 