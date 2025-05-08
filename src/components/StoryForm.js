import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { generateStory } from '../services/storyService.js';
import { getCurrentUser } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
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
    } catch (err) {
      if (err.response?.data?.error === 'Story limit reached') {
        setError(t('storyForm.storyLimitReached'));
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
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
    </div>
  );
}

export default StoryForm;