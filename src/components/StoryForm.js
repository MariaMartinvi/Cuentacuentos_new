import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { generateStory } from '../services/storyService.js';
import { getCurrentUser } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import { checkServerHealth, diagnoseBackendIssue } from '../services/storyService';
import AudioPlayer from './AudioPlayer';
import './StoryForm.css';
import axios from 'axios';

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
  const [isMounted, setIsMounted] = useState(true);

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
    console.log('StoryForm mounted');
    return () => {
      console.log('StoryForm unmounted');
      setIsMounted(false);
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

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      if (!isMounted) return;
      
      try {
        console.log('Loading user data...');
        const currentUser = await getCurrentUser();
        if (isMounted) {
          console.log('User data loaded:', currentUser);
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        if (isMounted) {
          setError(t('storyForm.loginRequired'));
        }
      }
    };
    loadUser();
  }, [t, isMounted]);

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
    console.log('Form submitted');
    
    // Verifica si el campo topic está vacío
    const topicInput = document.getElementById('topic');
    if (topicInput && !topicInput.value.trim()) {
      console.log('Topic is empty');
      // Hacer scroll hacia arriba de la página
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Enfoca el campo topic y muestra el mensaje de validación personalizado
      topicInput.focus();
      topicInput.setCustomValidity(t('storyForm.alertTopicRequired'));
      topicInput.reportValidity();
      return;
    }
    
    if (!user) {
      console.log('No user found');
      setError(t('storyForm.loginRequired'));
      return;
    }

    if (!user.email) {
      console.log('No user email found');
      setError(t('storyForm.emailRequired'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Asegurarnos de que el idioma esté definido
      const selectedLanguage = i18n.language || 'es';
      console.log('Selected language:', selectedLanguage);
      
      const storyParams = {
        topic,
        storyLength,
        storyType,
        creativityLevel,
        ageGroup,
        childNames,
        englishLevel,
        spanishLevel: selectedLanguage,
        language: selectedLanguage,
        email: user?.email
      };

      console.log('Sending story generation request with params:', storyParams);

      const result = await generateStory(storyParams);
      
      if (result.story) {
        console.log('Story generated successfully');
        // Actualizar el estado del usuario con las historias restantes
        if (result.storiesRemaining !== undefined) {
          const updatedUser = {
            ...user,
            storiesRemaining: result.storiesRemaining
          };
          setUser(updatedUser);
        }

        // Llamar al callback con la historia generada
        onStoryGenerated(result.story);
        
        // Limpiar el formulario
        setTopic('');
        setStoryLength('medium');
        setStoryType('original');
        setCreativityLevel('innovative');
        setAgeGroup('default');
        setChildNames('');
        setEnglishLevel('intermediate');
      } else {
        console.log('No story received from server');
        throw new Error('No story received from the server');
      }
    } catch (error) {
      console.error('Error generating story:', error);
      
      if (error.response?.data?.error === 'Story limit reached') {
        console.log('Error message from backend:', error.response.data.message);
        const errorData = error.response.data.message;
        if (typeof errorData === 'object' && errorData.key) {
          // Handle translated error message
          setError(t(errorData.key, errorData.params) + ' [[subscribe]]');
        } else {
          setError(t('storyForm.storyLimitReached') + ' [[subscribe]]');
        }
      } else if (error.response?.data?.message) {
        console.log('Error message from backend:', error.response.data.message);
        setError(error.response.data.message);
      } else {
        setError(t('storyForm.generalError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el clic en el enlace de inicio de sesión
  const handleLoginClick = (e) => {
    // Scroll hacia arriba antes de navegar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para manejar el clic en el enlace de suscripción
  const handleSubscribeClick = (e) => {
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

  // Función para manejar el clic en el enlace de contacto
  const handleContactClick = (e) => {
    // Scroll hacia arriba antes de navegar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="story-form-container">
      <h2>
        <span className="icon-title">🌙</span>
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
            ) : error.includes('[[subscribe]]') ? (
              <p>
                {error.split('[[subscribe]]').map((part, index, array) => {
                  if (index === array.length - 1) return part;
                  return (
                    <React.Fragment key={index}>
                      {part}
                      <Link to="/subscribe" className="error-login-link" onClick={handleSubscribeClick}>
                        {error.includes('actualizar tu plan') ? t('storyForm.updatePlan') : t('storyForm.subscribe')}
                      </Link>
                    </React.Fragment>
                  );
                })}
              </p>
            ) : error.includes('[[contact]]') ? (
              <p>
                {error.split('[[contact]]').map((part, index, array) => {
                  if (index === array.length - 1) return part;
                  return (
                    <React.Fragment key={index}>
                      {part}
                      <Link to="/contact" className="error-login-link" onClick={handleContactClick}>
                        {t('storyForm.contactUs')}
                      </Link>
                    </React.Fragment>
                  );
                })}
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