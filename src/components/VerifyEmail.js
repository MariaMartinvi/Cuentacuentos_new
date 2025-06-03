import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { verifyEmail, resendVerificationEmail } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser, login } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');
  const [showResendForm, setShowResendForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Prevenir múltiples ejecuciones

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token && !isProcessing) {
      handleVerification(token);
    } else if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado en la URL');
    }
  }, [location, isProcessing]);

  const handleVerification = async (token) => {
    if (isProcessing) {
      console.log('🚫 Verification already in progress, skipping...');
      return;
    }

    try {
      setIsProcessing(true);
      setStatus('verifying');
      console.log('🔍 Starting email verification with token:', token);
      
      const response = await verifyEmail(token);
      console.log('✅ Email verification response received:', response);
      
      if (response && response.success) {
        setStatus('success');
        setMessage(response.message || '¡Email verificado exitosamente!');
        
        // Si la respuesta incluye un token, auto-loguear al usuario
        if (response.token && response.data) {
          console.log('🔑 Auto-login with provided token...');
          try {
            await login(response.token, response.data);
            console.log('✅ Auto-login successful!');
            setMessage('¡Email verificado y sesión iniciada automáticamente!');
            
            // Redirigir al dashboard después de 2 segundos
            setTimeout(() => {
              navigate('/dashboard', { 
                state: { 
                  message: '¡Bienvenido! Tu email ha sido verificado exitosamente.',
                  type: 'success' 
                }
              });
            }, 2000);
            return;
          } catch (loginError) {
            console.error('⚠️ Auto-login failed:', loginError);
            // Continuar con el flujo normal sin auto-login
          }
        }
        
        // Solo intentar refrescar el usuario si hay un token en localStorage
        const userToken = localStorage.getItem('token');
        if (userToken) {
          console.log('🔄 User is logged in, attempting to refresh user context...');
          try {
            await refreshUser();
            console.log('🔄 User context refreshed after verification');
            setMessage('¡Email verificado exitosamente! Tu cuenta ya está completamente activa.');
            return; // No redireccionar automáticamente
          } catch (refreshError) {
            console.log('⚠️ Failed to refresh user context, but verification was successful:', refreshError);
            // No hacer nada más, la verificación fue exitosa
          }
        } else {
          console.log('👤 User not logged in, will redirect to login');
          // Redirigir al login después de 3 segundos solo si no está logueado
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
      console.error('💥 Email verification failed:', error);
      console.error('🔍 Full error details:', {
        message: error.message,
        name: error.name,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
        code: error.code
      });
      
      setStatus('error');
      
      // Simplificar el manejo de errores
      let errorMessage = error.message || 'Error desconocido al verificar el email';
      
      // Si el error contiene información específica del backend
      if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      console.log('📝 Setting error message:', errorMessage);
      setMessage(errorMessage);
      
      // Solo mostrar opción de reenvío si es realmente un token expirado/inválido
      if (errorMessage.includes('expired') || errorMessage.includes('invalid') || errorMessage.includes('expirado')) {
        setShowResendForm(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Por favor, ingresa tu email');
      return;
    }

    try {
      setIsResending(true);
      const response = await resendVerificationEmail(email);
      
      if (response.success) {
        setMessage('Email de verificación reenviado. Revisa tu bandeja de entrada.');
        setShowResendForm(false);
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
        const isLoggedIn = localStorage.getItem('token');
        const isAutoLogin = message.includes('sesión iniciada automáticamente');
        
        return (
          <div className="verification-content success">
            <div className="success-icon">✅</div>
            <h2>¡Email verificado exitosamente!</h2>
            <p>{message}</p>
            
            {isAutoLogin ? (
              <div className="auto-login-info">
                <div className="loading-spinner">
                  <div className="spinner"></div>
                </div>
                <p>Redirigiendo al dashboard...</p>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-primary"
                >
                  Ir al Dashboard Ahora
                </button>
              </div>
            ) : isLoggedIn ? (
              <div className="logged-in-actions">
                <p>Tu cuenta ya está completamente verificada y activa.</p>
                <div className="action-buttons">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-primary"
                  >
                    Ir al Dashboard
                  </button>
                  <button 
                    onClick={() => navigate('/stories')}
                    className="btn btn-secondary"
                  >
                    Crear Cuento
                  </button>
                </div>
              </div>
            ) : (
              <div className="redirect-info">
                <p>Serás redirigido al login en unos segundos...</p>
                <button 
                  onClick={() => navigate('/login')}
                  className="btn btn-primary"
                >
                  Ir al Login Ahora
                </button>
              </div>
            )}
          </div>
        );

      case 'error':
        return (
          <div className="verification-content error">
            <div className="error-icon">❌</div>
            <h2>Error en la verificación</h2>
            <p>{message}</p>
            
            {showResendForm ? (
              <div className="resend-form">
                <h3>Reenviar email de verificación</h3>
                <form onSubmit={handleResendVerification}>
                  <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isResending}
                    className="btn btn-primary"
                  >
                    {isResending ? 'Reenviando...' : 'Reenviar Email de Verificación'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="action-buttons">
                <button 
                  onClick={() => setShowResendForm(true)}
                  className="btn btn-secondary"
                >
                  Reenviar Email de Verificación
                </button>
                <button 
                  onClick={() => navigate('/register')}
                  className="btn btn-outline"
                >
                  Registrarse de Nuevo
                </button>
              </div>
            )}
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