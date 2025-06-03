import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '../services/authService';
import './ResetPassword.css';

const ResetPassword = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setMessage('Token de recuperación no encontrado en la URL');
    }
  }, [location]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 0:
      case 1: return { text: 'Muy débil', color: '#ef4444' };
      case 2: return { text: 'Débil', color: '#f97316' };
      case 3: return { text: 'Regular', color: '#eab308' };
      case 4: return { text: 'Fuerte', color: '#22c55e' };
      case 5: return { text: 'Muy fuerte', color: '#16a34a' };
      default: return { text: '', color: '#gray' };
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const isPasswordValid = (password) => {
    return password.length >= 8 && 
           /[a-z]/.test(password) && 
           /[A-Z]/.test(password) && 
           /\d/.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setMessage('Token de recuperación no válido');
      return;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      setMessage('Por favor, completa todos los campos');
      return;
    }

    if (!isPasswordValid(formData.newPassword)) {
      setMessage('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      const response = await resetPassword(token, formData.newPassword);
      
      if (response.success) {
        setIsSuccess(true);
        setMessage(response.message);
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: '¡Contraseña restablecida! Ya puedes iniciar sesión.',
              type: 'success' 
            }
          });
        }, 3000);
      } else {
        throw new Error(response.message || 'Error al restablecer contraseña');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage(error.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const strengthInfo = getPasswordStrengthText(passwordStrength);

  if (!token) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="logo-section">
              <h1>🎭 Cuentos Personalizados</h1>
            </div>
            <div className="reset-password-content">
              <div className="error-content">
                <div className="error-icon">❌</div>
                <h2>Enlace inválido</h2>
                <p>El enlace de recuperación no es válido o ha expirado.</p>
                <button 
                  onClick={() => navigate('/forgot-password')}
                  className="btn btn-primary"
                >
                  Solicitar nuevo enlace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="logo-section">
            <h1>🎭 Cuentos Personalizados</h1>
            <p>Restablecer contraseña</p>
          </div>
          
          <div className="reset-password-content">
            {!isSuccess ? (
              <>
                <div className="header-section">
                  <div className="icon">🔑</div>
                  <h2>Nueva contraseña</h2>
                  <p>Crea una contraseña segura para tu cuenta.</p>
                </div>

                <form onSubmit={handleSubmit} className="reset-password-form">
                  <div className="form-group">
                    <label htmlFor="newPassword">Nueva contraseña:</label>
                    <div className="password-input-container">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Ingresa tu nueva contraseña"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    
                    {formData.newPassword && (
                      <div className="password-strength">
                        <div className="strength-bar">
                          <div 
                            className="strength-fill"
                            style={{
                              width: `${(passwordStrength / 5) * 100}%`,
                              backgroundColor: strengthInfo.color
                            }}
                          ></div>
                        </div>
                        <span 
                          className="strength-text"
                          style={{ color: strengthInfo.color }}
                        >
                          {strengthInfo.text}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmar contraseña:</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirma tu nueva contraseña"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="password-requirements">
                    <h4>La contraseña debe contener:</h4>
                    <ul>
                      <li className={formData.newPassword.length >= 8 ? 'valid' : ''}>
                        ✓ Al menos 8 caracteres
                      </li>
                      <li className={/[a-z]/.test(formData.newPassword) ? 'valid' : ''}>
                        ✓ Una letra minúscula
                      </li>
                      <li className={/[A-Z]/.test(formData.newPassword) ? 'valid' : ''}>
                        ✓ Una letra mayúscula
                      </li>
                      <li className={/\d/.test(formData.newPassword) ? 'valid' : ''}>
                        ✓ Un número
                      </li>
                    </ul>
                  </div>

                  {message && (
                    <div className={`message ${isSuccess ? 'success' : 'error'}`}>
                      {message}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading || !isPasswordValid(formData.newPassword) || formData.newPassword !== formData.confirmPassword}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-small"></span>
                        Restableciendo...
                      </>
                    ) : (
                      'Restablecer contraseña'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="success-content">
                <div className="success-icon">✅</div>
                <h2>¡Contraseña restablecida!</h2>
                <p>{message}</p>
                
                <div className="redirect-info">
                  <p>Serás redirigido al login en unos segundos...</p>
                  <button 
                    onClick={() => navigate('/login')}
                    className="btn btn-primary"
                  >
                    Ir al Login Ahora
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="footer-section">
            <p>
              ¿Recordaste tu contraseña? {' '}
              <button 
                onClick={() => navigate('/login')}
                className="link-button"
              >
                Iniciar sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 