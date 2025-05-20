import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { generateStory } from '../services/storyService.js';
import { getCurrentUser } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import { checkServerHealth, diagnoseBackendIssue } from '../services/storyService';
import AudioPlayer from './AudioPlayer';
import './StoryForm.css';

function StoryForm({ onStoryGenerated }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [topic, setTopic] = useState('');
  const [storyLength, setStoryLength] = useState('medium');
  const [storyType, setStoryType] = useState('original');
  const [creativityLevel, setCreativityLevel] = useState('innovative');
  const [ageGroup, setAgeGroup] = useState('default');
  const [childNames, setChildNames] = useState('');
  const [englishLevel, setEnglishLevel] = useState('intermediate');
  const [audioUrl, setAudioUrl] = useState(null);

  // Special handler for rate limit errors with countdown
  const formatTimeRemaining = (milliseconds) => {
    if (milliseconds <= 0) return '0:00';
    
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const [rateLimitCountdown, setRateLimitCountdown] = useState(null);
  const countdownIntervalRef = useRef(null);
  
  // Clear interval on component unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);
  
  const setupRateLimitCountdown = (retryAfterISO) => {
    let retryAfter;
    try {
      retryAfter = new Date(retryAfterISO);
    } catch {
      // If ISO parsing fails, use a default of 5 minutes from now
      retryAfter = new Date(Date.now() + 5 * 60 * 1000);
    }
    
    // Clear any existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    // Initial value
    const updateCountdown = () => {
      const remaining = retryAfter - new Date();
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        setRateLimitCountdown(null);
      } else {
        setRateLimitCountdown(formatTimeRemaining(remaining));
      }
    };
    
    // Update immediately and then every second
    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
        setError(t('storyForm.loginRequired'));
      }
    };
    loadUser();
  }, [t]);

  // State for server status
  const [serverStatus, setServerStatus] = useState(null);

  // Function to check server health when errors occur
  const checkServerStatus = async () => {
    try {
      console.log('🔍 Checking server health...');
      setServerStatus({status: 'checking'});
      
      // First try the general health endpoint
      const healthResult = await checkServerHealth();
      console.log('📊 Server health check result:', healthResult);
      
      // If server health check fails, try the diagnostic API
      if (!healthResult.healthy) {
        console.log('🛠️ Running backend diagnostics...');
        const diagnostics = await diagnoseBackendIssue();
        console.log('📊 Backend diagnostic result:', diagnostics);
        
        setServerStatus({
          status: diagnostics.status || 'error',
          issue: diagnostics.issue,
          details: diagnostics.details
        });
        
        return diagnostics;
      }
      
      setServerStatus(healthResult);
      return healthResult;
    } catch (error) {
      console.error('❌ Failed to check server status:', error);
      setServerStatus({
        status: 'error',
        error: error.message
      });
      return null;
    }
  };
  
  // Add server error component
  const renderServerStatus = () => {
    if (!serverStatus || serverStatus.status === 'ok') return null;
    
    if (serverStatus.status === 'checking') {
      return (
        <div className="server-status checking">
          <div className="status-icon">🔄</div>
          <div className="status-message">
            <p>{i18n.language === 'es' 
              ? 'Verificando el estado del servidor...' 
              : 'Checking server status...'}</p>
          </div>
        </div>
      );
    }
    
    // Critical error (red)
    if (serverStatus.status === 'critical' || serverStatus.status === 'error') {
      return (
        <div className="server-status error">
          <div className="status-icon">❌</div>
          <div className="status-message">
            <h4>{i18n.language === 'es' ? 'Error del Servidor' : 'Server Error'}</h4>
            <p>{serverStatus.details || (i18n.language === 'es' 
              ? 'El servidor está experimentando problemas.' 
              : 'The server is experiencing issues.')}</p>
            {serverStatus.issue === 'openai_quota_exceeded' && (
              <p className="admin-note">{i18n.language === 'es'
                ? 'Nota: El servicio de IA ha alcanzado su límite de uso. Los administradores han sido notificados.'
                : 'Note: The AI service has reached its usage limit. Administrators have been notified.'}</p>
            )}
          </div>
        </div>
      );
    }
    
    // Warning (yellow)
    if (serverStatus.status === 'degraded') {
      return (
        <div className="server-status warning">
          <div className="status-icon">⚠️</div>
          <div className="status-message">
            <h4>{i18n.language === 'es' ? 'Rendimiento Limitado' : 'Limited Performance'}</h4>
            <p>{serverStatus.details || (i18n.language === 'es' 
              ? 'El servidor está experimentando ralentizaciones.' 
              : 'The server is experiencing slowdowns.')}</p>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  // Style for server status
  useEffect(() => {
    if (serverStatus) {
      const style = document.createElement('style');
      style.textContent = `
        .server-status {
          display: flex;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          align-items: center;
        }
        .server-status.checking {
          background-color: #e3f2fd;
          border: 1px solid #bbdefb;
        }
        .server-status.error {
          background-color: #ffebee;
          border: 1px solid #ffcdd2;
        }
        .server-status.warning {
          background-color: #fff8e1;
          border: 1px solid #ffe082;
        }
        .status-icon {
          font-size: 24px;
          margin-right: 16px;
        }
        .status-message {
          flex: 1;
        }
        .status-message h4 {
          margin-top: 0;
          margin-bottom: 8px;
        }
        .server-status.error h4 {
          color: #c62828;
        }
        .server-status.warning h4 {
          color: #ef6c00;
        }
        .admin-note {
          font-style: italic;
          margin-top: 8px;
          font-size: 0.9em;
          color: #616161;
        }
        .retry-btn {
          margin-top: 12px;
          background-color: #f5f5f5;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        .retry-btn:hover {
          background-color: #e0e0e0;
        }
      `;
      document.head.appendChild(style);
      
      // Cleanup
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [serverStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verifica si el campo topic está vacío
    const topicInput = document.getElementById('topic');
    if (topicInput && !topicInput.value.trim()) {
      // Hacer scroll hacia arriba de la página
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Enfoca el campo topic y muestra el mensaje de validación personalizado
      topicInput.focus();
      topicInput.setCustomValidity(t('storyForm.alertTopicRequired'));
      topicInput.reportValidity();
      return;
    }
    
    if (!user) {
      setError(t('storyForm.loginRequired'));
      return;
    }

    setIsLoading(true);
    setError(null);

    // Track retry attempts
    let retryCount = 0;
    const maxRetries = 2;
    
    const attemptStoryGeneration = async () => {
      try {
        const story = await generateStory({
          topic,
          storyLength,
          storyType,
          creativityLevel,
          ageGroup,
          childNames,
          englishLevel,
          language: i18n.language
        });
        onStoryGenerated(story);
        return true; // Success
      } catch (err) {
        console.log(`Story generation error (attempt ${retryCount + 1}):`, err);
        
        // Check if this is a server error (500)
        if (err.response?.status === 500) {
          console.log('⚠️ Server error (500) detected, checking server health...');
          await checkServerStatus();
        }
        
        // Check for diagnostic information
        if (err.diagnostics) {
          console.log('📊 Server diagnostics received:', err.diagnostics);
          
          // Handle specific diagnostic issues
          if (err.diagnostics.issue === 'openai_quota_exceeded') {
            console.error('🚫 OpenAI API quota exceeded confirmed by diagnostics');
            // Show quota exceeded error (reuse existing code)
            setError(
              <div className="quota-error">
                <div className="quota-icon">🚫</div>
                <div className="quota-message">
                  <h4>{i18n.language === 'es' ? 'Servicio No Disponible' : 'Service Unavailable'}</h4>
                  <p>{i18n.language === 'es' 
                    ? 'Lo sentimos, el servicio de generación de cuentos no está disponible en este momento debido a un problema técnico.' 
                    : 'Sorry, the story generation service is currently unavailable due to a technical issue.'}</p>
                  <p className="quota-hint">{i18n.language === 'es'
                    ? 'Nuestro equipo ha sido notificado y estamos trabajando para resolver este problema lo más pronto posible.'
                    : 'Our team has been notified and we are working to resolve this issue as soon as possible.'}</p>
                </div>
              </div>
            );
            return false; // Don't retry
          }
          
          if (err.diagnostics.issue === 'openai_api_error') {
            console.error('❌ OpenAI API error confirmed by diagnostics:', err.diagnostics.details);
            setError(i18n.language === 'es'
              ? `Error del servicio de IA: ${err.diagnostics.details}`
              : `AI service error: ${err.diagnostics.details}`);
            return false;
          }
          
          if (err.diagnostics.issue === 'database_error') {
            console.error('🗄️ Database error confirmed by diagnostics');
            setError(i18n.language === 'es'
              ? 'Error de conexión a la base de datos. Por favor, inténtalo más tarde.'
              : 'Database connection error. Please try again later.');
            return false;
          }
          
          if (err.diagnostics.issue === 'connection_error') {
            console.error('🔌 Connection error confirmed by diagnostics:', err.diagnostics.details);
            // Only retry connection errors
            if (retryCount < maxRetries) {
              return false; // Let the retry logic handle it
            } else {
              setError(i18n.language === 'es'
                ? 'No se puede conectar con el servidor. Por favor, verifica tu conexión a internet.'
                : 'Cannot connect to the server. Please check your internet connection.');
              return false;
            }
          }
        }
        
        // Handle FedCM AbortError
        if (err.name === 'AbortError' || 
            (err.message && err.message.includes('AbortError')) || 
            (err.toString && err.toString().includes('AbortError'))) {
          
          setError(i18n.language === 'es'
            ? 'La sesión de autenticación ha expirado. Por favor, intenta iniciar sesión nuevamente.'
            : 'Authentication session has expired. Please try logging in again.');
          
          // Redirect to login after a delay
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          
          return false; // Don't retry on auth errors
        }
        
        // Special handling for OpenAI quota exceeded errors
        if (err.response?.data?.isQuotaExceeded || 
            (err.message && err.message.includes('quota exceeded')) ||
            (err.response?.data?.error?.code === 'insufficient_quota') ||
            (err.response?.data?.error?.message && err.response?.data?.error?.message.includes('exceeded your current quota'))) {
          
          console.error('🚫 OpenAI API quota exceeded detected in UI');
          
          // Show a special styled error for quota exceeded
          setError(
            <div className="quota-error">
              <div className="quota-icon">🚫</div>
              <div className="quota-message">
                <h4>{i18n.language === 'es' ? 'Servicio No Disponible' : 'Service Unavailable'}</h4>
                <p>{i18n.language === 'es' 
                  ? 'Lo sentimos, el servicio de generación de cuentos no está disponible en este momento debido a un problema técnico.' 
                  : 'Sorry, the story generation service is currently unavailable due to a technical issue.'}</p>
                <p className="quota-hint">{i18n.language === 'es'
                  ? 'Nuestro equipo ha sido notificado y estamos trabajando para resolver este problema lo más pronto posible.'
                  : 'Our team has been notified and we are working to resolve this issue as soon as possible.'}</p>
              </div>
            </div>
          );
          
          // Add some CSS dynamically for the quota error styling
          const style = document.createElement('style');
          style.textContent = `
            .quota-error {
              display: flex;
              background-color: #ffebee;
              border: 1px solid #ffcdd2;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 20px;
            }
            .quota-icon {
              font-size: 28px;
              margin-right: 16px;
              display: flex;
              align-items: center;
            }
            .quota-message {
              flex: 1;
            }
            .quota-message h4 {
              margin-top: 0;
              margin-bottom: 8px;
              color: #c62828;
            }
            .quota-hint {
              font-style: italic;
              margin-top: 8px;
              font-size: 0.9em;
            }
          `;
          document.head.appendChild(style);
          
          // Also disable the generate button to prevent further attempts
          const generateBtn = document.querySelector('.generate-btn');
          if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.style.opacity = '0.5';
            generateBtn.title = i18n.language === 'es' 
              ? 'Servicio temporalmente no disponible' 
              : 'Service temporarily unavailable';
          }
          
          return false; // Don't retry on quota exceeded
        }
        
        // Special handling for rate limit errors
        if (err.response?.status === 429 || err.response?.data?.isRateLimit || 
            (err.response?.data?.error && err.response?.data?.error.includes('rate limit'))) {
          console.warn('🕒 Rate limit detected in UI layer');
          
          // Start countdown if retryAfter is provided
          if (err.response?.data?.retryAfter) {
            setupRateLimitCountdown(err.response.data.retryAfter);
          }
          
          // Show a special styled error for rate limits
          setError(
            <div className="rate-limit-error">
              <div className="rate-limit-icon">⏳</div>
              <div className="rate-limit-message">
                <h4>{i18n.language === 'es' ? 'Servidor Ocupado' : 'Server Busy'}</h4>
                <p>{i18n.language === 'es' 
                  ? 'El servidor está procesando demasiadas solicitudes en este momento. Por favor, espera unos minutos antes de intentarlo nuevamente.' 
                  : 'The server is processing too many requests right now. Please wait a few minutes before trying again.'}</p>
                {rateLimitCountdown && (
                  <p className="countdown">
                    {i18n.language === 'es' 
                      ? `Puedes intentarlo nuevamente en: ${rateLimitCountdown}`
                      : `You can try again in: ${rateLimitCountdown}`}
                  </p>
                )}
                <p className="rate-limit-hint">{i18n.language === 'es'
                  ? 'Sugerencia: Puedes probar con un tema diferente o esperar un momento.'
                  : 'Tip: You can try a different topic or wait a moment.'}</p>
              </div>
            </div>
          );
          
          // Add some CSS dynamically for the rate limit error styling
          const style = document.createElement('style');
          style.textContent = `
            .rate-limit-error {
              display: flex;
              background-color: #fff8e6;
              border: 1px solid #ffe0b2;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 20px;
            }
            .rate-limit-icon {
              font-size: 28px;
              margin-right: 16px;
              display: flex;
              align-items: center;
            }
            .rate-limit-message {
              flex: 1;
            }
            .rate-limit-message h4 {
              margin-top: 0;
              margin-bottom: 8px;
              color: #e65100;
            }
            .countdown {
              font-weight: bold;
              color: #e65100;
              background: #ffecb3;
              display: inline-block;
              padding: 4px 10px;
              border-radius: 4px;
              margin: 10px 0;
            }
            .rate-limit-hint {
              font-style: italic;
              margin-top: 8px;
              font-size: 0.9em;
              opacity: 0.8;
            }
          `;
          document.head.appendChild(style);
          
          return false; // Don't retry on rate limit
        }
        
        // Check if the error is specifically "Story generation failed"
        if (err.response?.data?.error === 'Story generation failed') {
          if (retryCount < maxRetries) {
            retryCount++;
            // Wait 2 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
            return false; // Continue to retry
          } else {
            // After max retries, show a more detailed error message
            setError(i18n.language === 'es'
              ? 'No se pudo generar el cuento después de varios intentos. El servidor podría estar sobrecargado. Por favor, intenta con un tema diferente o inténtalo más tarde.'
              : 'Could not generate the story after multiple attempts. The server might be overloaded. Please try a different topic or try again later.');
            return false; // Stop retrying
          }
        }
        
        if (err.response?.data?.error === 'Story limit reached') {
          setError(t('storyForm.storyLimitReached'));
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError(t('storyForm.generalError'));
        }
        return false; // Don't retry on other errors
      }
    };
    
    // Initial attempt
    let success = await attemptStoryGeneration();
    
    // Retry logic if needed
    while (!success && retryCount < maxRetries) {
      success = await attemptStoryGeneration();
    }
    
    setIsLoading(false);
  };

  // Función para manejar el clic en el enlace de inicio de sesión
  const handleLoginClick = (e) => {
    // Scroll hacia arriba antes de navegar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para limpiar el mensaje de validación cuando el usuario empieza a escribir
  const handleTopicChange = (e) => {
    const input = e.target;
    input.setCustomValidity('');
    setTopic(e.target.value);
  };

  // Función para validar el campo topic cuando pierde el foco
  const handleTopicBlur = (e) => {
    const input = e.target;
    if (!input.value.trim()) {
      input.setCustomValidity(t('storyForm.alertTopicRequired'));
    } else {
      input.setCustomValidity('');
    }
  };

  return (
    <div className="story-form-container">
      <h2>
        <span className="icon-title">🦉</span>
        {t('storyForm.title')}
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="topic">
            <span className="form-icon">📝</span> {t('storyForm.topicLabel')}
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={handleTopicChange}
            onBlur={handleTopicBlur}
            placeholder={t('storyForm.topicPlaceholder')}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="childNames">
              <span className="form-icon">👶</span> {t('storyForm.childNamesLabel')}
            </label>
            <input
              type="text"
              id="childNames"
              value={childNames}
              onChange={(e) => setChildNames(e.target.value)}
              placeholder={t('storyForm.childNamesPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="englishLevel">
              <span className="form-icon">🌍</span> {t('storyForm.englishLevelLabel')}
            </label>
            <select
              id="englishLevel"
              value={englishLevel}
              onChange={(e) => setEnglishLevel(e.target.value)}
            >
              <option value="basic">{t('storyForm.englishLevelBeginner')}</option>
              <option value="intermediate">{t('storyForm.englishLevelIntermediate')}</option>
              <option value="advanced">{t('storyForm.englishLevelAdvanced')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="storyLength">
              <span className="form-icon">📏</span> {t('storyForm.lengthLabel')}
            </label>
            <select
              id="storyLength"
              value={storyLength}
              onChange={(e) => setStoryLength(e.target.value)}
            >
              <option value="short">{t('storyForm.lengthShort')}</option>
              <option value="medium">{t('storyForm.lengthMedium')}</option>
              <option value="long">{t('storyForm.lengthLong')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="storyType">
              <span className="form-icon">📚</span> {t('storyForm.typeLabel')}
            </label>
            <select
              id="storyType"
              value={storyType}
              onChange={(e) => setStoryType(e.target.value)}
            >
              <option value="original">{t('storyForm.typeOriginal')}</option>
              <option value="classic">{t('storyForm.typeClassic')}</option>
              <option value="humor">{t('storyForm.typeHumor')}</option>
              <option value="sci-fi">{t('storyForm.typeSciFi')}</option>
              <option value="horror">{t('storyForm.typeHorror')}</option>
              <option value="adventure">{t('storyForm.typeAdventure')}</option>
              <option value="fantasy">{t('storyForm.typeFantasy')}</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ageGroup">
              <span className="form-icon">🎯</span> {t('storyForm.ageGroupLabel')}
            </label>
            <select
              id="ageGroup"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
            >
              <option value="default">{t('storyForm.ageGroupDefault')}</option>
              <option value="3-5">{t('storyForm.ageGroup3to5')}</option>
              <option value="6-8">{t('storyForm.ageGroup6to8')}</option>
              <option value="9-12">{t('storyForm.ageGroup9to12')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="creativityLevel">
              <span className="form-icon">🎨</span> {t('storyForm.creativityLevelLabel')}
            </label>
            <select
              id="creativityLevel"
              value={creativityLevel}
              onChange={(e) => setCreativityLevel(e.target.value)}
            >
              <option value="standard">{t('storyForm.creativityStandard')}</option>
              <option value="innovative">{t('storyForm.creativityInnovative')}</option>
              <option value="creative">{t('storyForm.creativityCreative')}</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error === t('storyForm.loginRequired') ? (
              <p>
                {error}{' '}
                <Link to="/login" className="error-login-link" onClick={handleLoginClick}>
                  {t('storyForm.clickToLogin')}
                </Link>
              </p>
            ) : (
              <p>{error}</p>
            )}
          </div>
        )}

        {/* Server status indicator */}
        {renderServerStatus()}

        <div className="button-group">
          <button
            type="submit"
            className="generate-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                {t('storyForm.generating')}
              </>
            ) : (
              <>
                <span className="btn-icon">✨</span>
                {t('storyForm.generateButton')}
              </>
            )}
          </button>
        </div>
      </form>

      {audioUrl && (
        <div className="audio-player-section">
          <AudioPlayer audioUrl={audioUrl} title={topic} />
        </div>
      )}
    </div>
  );
}

export default StoryForm;