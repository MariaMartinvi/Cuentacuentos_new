import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '../services/authService';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Por favor, ingresa tu email');
      setIsSuccess(false);
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      const response = await forgotPassword(email);
      
      if (response.success) {
        setIsSuccess(true);
        setMessage(response.message);
      } else {
        throw new Error(response.message || 'Error al enviar email de recuperación');
      }
    } catch (error) {
      console.error('Error in forgot password:', error);
      setIsSuccess(false);
      setMessage(error.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="logo-section">
            <h1>🎭 Cuentos Personalizados</h1>
            <p>Recuperar contraseña</p>
          </div>
          
          <div className="forgot-password-content">
            {!isSuccess ? (
              <>
                <div className="header-section">
                  <div className="icon">🔐</div>
                  <h2>¿Olvidaste tu contraseña?</h2>
                  <p>
                    No te preocupes, es algo que pasa. Ingresa tu email y te enviaremos 
                    un enlace para restablecer tu contraseña.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="forgot-password-form">
                  <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  {message && (
                    <div className={`message ${isSuccess ? 'success' : 'error'}`}>
                      {message}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-small"></span>
                        Enviando...
                      </>
                    ) : (
                      'Enviar enlace de recuperación'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="success-content">
                <div className="success-icon">📧</div>
                <h2>¡Email enviado!</h2>
                <p>{message}</p>
                
                <div className="info-box">
                  <h3>¿Qué sigue?</h3>
                  <ul>
                    <li>📬 Revisa tu bandeja de entrada</li>
                    <li>📱 También verifica la carpeta de spam</li>
                    <li>🔗 Haz clic en el enlace del email</li>
                    <li>🔑 Crea tu nueva contraseña</li>
                  </ul>
                </div>

                <div className="resend-section">
                  <p>¿No recibiste el email?</p>
                  <button 
                    onClick={() => {
                      setIsSuccess(false);
                      setMessage('');
                    }}
                    className="btn btn-outline"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="footer-section">
            <p>
              ¿Recordaste tu contraseña? {' '}
              <Link to="/login" className="link">
                Iniciar sesión
              </Link>
            </p>
            <p>
              ¿No tienes cuenta? {' '}
              <Link to="/register" className="link">
                Registrarse
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 