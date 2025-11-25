import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SEO from '../SEO';
import BreadcrumbSchema from '../BreadcrumbSchema';
import './LearnEnglishPage.css';

// AudioPlayer component integrado
const AudioPlayer = ({ audioUrl, title }) => {
  const { t } = useTranslation();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;

      const setAudioData = () => {
        setDuration(audio.duration);
      };

      const setAudioTime = () => {
        const currentTime = audio.currentTime;
        const duration = audio.duration;
        const progress = (currentTime / duration) * 100;
        
        setCurrentTime(currentTime);
        setProgress(progress);
      };

      const handleAudioEnd = () => {
        setIsPlaying(false);
      };

      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', handleAudioEnd);

      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', handleAudioEnd);
      };
    }
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (e) => {
    const newTime = (e.target.value / 100) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(e.target.value);
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={audioUrl} />

      <div className="player-controls">
        <button
          onClick={togglePlay}
          className="play-pause-btn"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>

        <div className="time-display">
          {formatTime(currentTime)}
        </div>

        <input
          type="range"
          className="progress-bar"
          value={progress}
          onChange={handleProgressChange}
          min="0"
          max="100"
          step="0.1"
          aria-label="Progress"
        />

        <div className="time-display">
          {formatTime(duration)}
        </div>

        <a 
          href={audioUrl} 
          download={`${title || 'audio'}.mp3`}
          className="download-audio-btn"
          aria-label="Download"
          target="_blank"
          rel="noopener noreferrer"
        >
          ⬇️ Download
        </a>
      </div>
    </div>
  );
};

// AudioPlayerSequence - Reproduce 3 audios en secuencia (intro + vocab + story)
const AudioPlayerSequence = ({ introUrl, vocabUrl, storyUrl, title }) => {
  const { t } = useTranslation();
  const audioRef = useRef(null);
  const [currentPart, setCurrentPart] = useState(0); // 0=intro, 1=vocab, 2=story
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  
  const parts = [
    { url: introUrl, name: t('storyExamples.audioIntro') || 'Introduction' },
    { url: vocabUrl, name: t('storyExamples.audioVocab') || 'Vocabulary' },
    { url: storyUrl, name: t('storyExamples.audioStory') || 'Story' }
  ];

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;

      const setAudioData = () => {
        setDuration(audio.duration);
      };

      const setAudioTime = () => {
        const currentTime = audio.currentTime;
        const duration = audio.duration;
        const progress = (currentTime / duration) * 100;
        
        setCurrentTime(currentTime);
        setProgress(progress);
      };

      const handleAudioEnd = () => {
        // Cuando termina una parte, pasar a la siguiente
        if (currentPart < parts.length - 1) {
          console.log(`✅ Part ${currentPart + 1} finished, moving to part ${currentPart + 2}`);
          setAccumulatedTime(prev => prev + duration);
          setCurrentPart(currentPart + 1);
          setProgress(0);
          setCurrentTime(0);
        } else {
          console.log('✅ All parts finished');
          setIsPlaying(false);
        }
      };

      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', handleAudioEnd);

      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', handleAudioEnd);
      };
    }
  }, [currentPart, duration, parts.length]);

  // Cuando cambia la parte actual, cargar y reproducir automáticamente si estaba reproduciendo
  useEffect(() => {
    if (audioRef.current && currentPart < parts.length) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
        });
      }
    }
  }, [currentPart, isPlaying, parts.length]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (e) => {
    const newTime = (e.target.value / 100) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(e.target.value);
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={parts[currentPart]?.url} />
      
      {/* Indicador de parte actual */}
      <div className="audio-part-indicator" style={{ marginBottom: '10px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
        <span>🎵 {parts[currentPart]?.name} ({currentPart + 1}/{parts.length})</span>
      </div>

      <div className="player-controls">
        <button
          onClick={togglePlay}
          className="play-pause-btn"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>

        <div className="time-display">
          {formatTime(currentTime)}
        </div>

        <input
          type="range"
          className="progress-bar"
          value={progress}
          onChange={handleProgressChange}
          min="0"
          max="100"
          step="0.1"
          aria-label="Progress"
        />

        <div className="time-display">
          {formatTime(duration)}
        </div>

        <a 
          href={storyUrl} 
          download={`${title || 'story'}.mp3`}
          className="download-audio-btn"
          aria-label="Download"
          target="_blank"
          rel="noopener noreferrer"
        >
          ⬇️ Download
        </a>
      </div>
    </div>
  );
};

function LearnEnglishPage() {
  const { t, i18n } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedStory, setSelectedStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configuración de backend
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

  // Estructura del contenido del curso - Month 1: Los Cinco de la Tierra
  const courseData = {
    1: {
      title: i18n.language === 'es' ? 'Mi equipo y yo' : 'My team and me',
      vocabulary: ['my', 'name', 'videogames', 'brother', 'smart', 'market', 'help', 'study', 'China', 'cat', 'fun', 'friend', 'sports', 'strong', 'sisters', 'confident', 'shy', 'quiet', 'books', 'space', 'team', 'different', 'together', 'mission', 'rescue', 'rocket', 'ready', 'lost', 'find', 'search', 'planet', 'idea', 'plan', 'solve', 'explore', 'magic', 'wizard', 'strange', 'laugh', 'spell', 'careful', 'success', 'proud', 'home', 'Earth'],
      structures: ['"My name is..."', '"I am from..."', '"I love..."', '"I have..."', '"We are..."', '"We work together..."'],
      weeks: [
        {
          number: 1,
          stories: [
            {
              id: 'm1w1s1',
              title: i18n.language === 'es' ? 'Soy Sara de Barcelona' : 'I am Sara from Barcelona',
              vocabulary: ['my', 'name', 'videogames', 'brother'],
              duration: '10:00'
            },
            {
              id: 'm1w1s2',
              title: i18n.language === 'es' ? 'Soy María de Camerún' : 'I am María from Cameroon',
              vocabulary: ['smart', 'market', 'help', 'study'],
              duration: '10:00'
            },
            {
              id: 'm1w1s3',
              title: i18n.language === 'es' ? 'Soy Eva de China' : 'I am Eva from China',
              vocabulary: ['China', 'cat', 'fun', 'friend'],
              duration: '10:00'
            }
          ]
        },
        {
          number: 2,
          stories: [
            {
              id: 'm1w2s1',
              title: i18n.language === 'es' ? 'Soy Robert de Estados Unidos' : 'I am Robert from America',
              vocabulary: ['sports', 'strong', 'sisters', 'confident'],
              duration: '10:00'
            },
            {
              id: 'm1w2s2',
              title: i18n.language === 'es' ? 'Soy Gabriel de Australia' : 'I am Gabriel from Australia',
              vocabulary: ['shy', 'quiet', 'books', 'space'],
              duration: '10:00'
            },
            {
              id: 'm1w2s3',
              title: i18n.language === 'es' ? 'Somos los Cinco' : 'We Are the Five',
              vocabulary: ['team', 'different', 'together', 'friends'],
              duration: '10:00'
            }
          ]
        },
        {
          number: 3,
          stories: [
            {
              id: 'm1w3s1',
              title: i18n.language === 'es' ? '¡Alerta de Misión!' : 'Mission Alert!',
              vocabulary: ['mission', 'rescue', 'rocket', 'ready'],
              duration: '10:00'
            },
            {
              id: 'm1w3s2',
              title: i18n.language === 'es' ? 'El Explorador Perdido' : 'The Lost Explorer',
              vocabulary: ['lost', 'find', 'search', 'planet'],
              duration: '10:00'
            },
            {
              id: 'm1w3s3',
              title: i18n.language === 'es' ? 'El Plan de María' : "María's Plan",
              vocabulary: ['smart', 'idea', 'plan', 'solve'],
              duration: '10:00'
            }
          ]
        },
        {
          number: 4,
          stories: [
            {
              id: 'm1w4s1',
              title: i18n.language === 'es' ? 'El Planeta de los Magos' : 'The Wizard Planet',
              vocabulary: ['explore', 'magic', 'wizard', 'strange'],
              duration: '10:00'
            },
            {
              id: 'm1w4s2',
              title: i18n.language === 'es' ? 'Sara y Eva se Divierten' : 'Sara and Eva Have Fun',
              vocabulary: ['fun', 'laugh', 'spell', 'careful'],
              duration: '10:00'
            },
            {
              id: 'm1w4s3',
              title: i18n.language === 'es' ? 'Éxito del Equipo' : 'Team Success',
              vocabulary: ['success', 'proud', 'home', 'Earth'],
              duration: '10:00'
            }
          ]
        }
      ]
    }
  };

  const currentMonth = courseData[selectedMonth];

  const handleStoryClick = async (story) => {
    console.log('📖 Loading story:', story.id);
    setLoading(true);
    setError(null);
    
    try {
      // Llamar al backend con el idioma actual del usuario
      const response = await fetch(`${BACKEND_URL}/api/learn-english/stories/${story.id}?language=${i18n.language}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load story: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load story');
      }
      
      console.log('✅ Story loaded:', data.story.title.en);
      console.log('🎵 Audio URLs:', { intro: data.story.introUrl, vocab: data.story.vocabUrl, story: data.story.storyUrl });
      setSelectedStory(data.story);
      
    } catch (error) {
      console.error('❌ Error loading story:', error);
      setError(error.message);
      
      // Mostrar el cuento sin audio si falla la carga
      setSelectedStory({
        ...story,
        error: true,
        errorMessage: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const closePlayer = () => {
    setSelectedStory(null);
    setError(null);
  };

  // Breadcrumb items
  const breadcrumbItems = [
    {
      name: i18n.language === 'es' ? 'Inicio' : 'Home',
      url: '/'
    },
    {
      name: i18n.language === 'es' ? 'Aprende Inglés' : 'Learn English',
      url: '/aprender-ingles'
    }
  ];

  return (
    <div className="learn-english-page">
      <SEO 
        title={i18n.language === 'es' ? 
          'Aprende Inglés con Audiocuentos - Plan Anual | AudioGretel' : 
          'Learn English with Audio Stories - Annual Plan | AudioGretel'}
        description={i18n.language === 'es' ? 
          'Aprende inglés con Los Cinco de la Tierra. Aventuras espaciales, misiones de rescate y exploración. Plan anual con vocabulario y 12 cuentos mensuales.' : 
          'Learn English with The Five from Earth. Space adventures, rescue and exploration missions. Annual plan with vocabulary and 12 monthly stories.'}
        keywords={['aprender inglés', 'audiocuentos en inglés', 'inglés para niños', 'learn english', 'english audio stories', 'espacio', 'aventuras']}
        lang={i18n.language}
        pageType="WebPage"
      />

      <BreadcrumbSchema items={breadcrumbItems} />
      
      {/* Hero Section */}
      <div className="learn-english-hero">
        <div className="learn-english-hero-container">
          <h1 className="learn-english-title">
            📚 {t('learnEnglish.pageTitle')}
          </h1>
          <p className="learn-english-subtitle">
            {t('learnEnglish.pageSubtitle')}
          </p>
          <div className="plan-badge">
            🎯 {t('learnEnglish.month1Title')}
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="month-navigation">
        <div className="container">
          <button 
            className={`month-button ${selectedMonth === 1 ? 'active' : ''}`}
            onClick={() => setSelectedMonth(1)}
          >
            {t('learnEnglish.month1Title')}
          </button>
          <button className="month-button disabled" disabled>
            {t('learnEnglish.month2')}
          </button>
          <button className="month-button disabled" disabled>
            {t('learnEnglish.month3')}
          </button>
        </div>
      </div>

      {/* Month Content */}
      <div className="month-content">
        <div className="container">
          {/* Month Header */}
          <div className="month-header">
            <h2 className="month-title">
              {t('learnEnglish.monthPrefix')} 1: {currentMonth.title}
            </h2>
            
            {/* Presentación de Los Cinco de la Tierra */}
            <div className="family-intro">
              <p className="family-intro-text">
                🚀 {t('learnEnglish.teamIntro')}
              </p>
            </div>

            <div className="month-info">
              <div className="info-card">
                <h3>📖 {t('learnEnglish.monthVocabulary')}</h3>
                <div className="vocabulary-list">
                  {currentMonth.vocabulary.slice(0, 12).map((word, index) => (
                    <span key={index} className="vocabulary-item">{word}</span>
                  ))}
                  {currentMonth.vocabulary.length > 12 && (
                    <span className="vocabulary-item">+{currentMonth.vocabulary.length - 12} {t('common.more') || 'more'}</span>
                  )}
                </div>
              </div>
              <div className="info-card">
                <h3>💬 {t('learnEnglish.structures')}</h3>
                <div className="structures-list">
                  {currentMonth.structures.map((structure, index) => (
                    <div key={index} className="structure-item">{structure}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Weeks Calendar */}
          <div className="weeks-calendar">
            {currentMonth.weeks.map((week) => (
              <div key={week.number} className="week-card">
                <div className="week-header">
                  <h3 className="week-title">
                    {t('learnEnglish.week')} {week.number}
                  </h3>
                  <span className="week-stories-count">
                    {week.stories.length} {t('learnEnglish.stories')}
                  </span>
                </div>
                <div className="stories-grid">
                  {week.stories.map((story, index) => (
                    <div key={story.id} className="story-card" onClick={() => handleStoryClick(story)}>
                      <div className="story-number">{index + 1}</div>
                      <h4 className="story-title">{story.title}</h4>
                      <div className="story-vocabulary">
                        <span className="vocab-label">
                          {t('learnEnglish.vocabulary')}
                        </span>
                        <div className="vocab-tags">
                          {story.vocabulary.map((word, idx) => (
                            <span key={idx} className="vocab-tag">{word}</span>
                          ))}
                        </div>
                      </div>
                      <div className="story-footer">
                        <span className="story-duration">⏱️ {story.duration}</span>
                        <button className="play-button">
                          ▶️ {t('learnEnglish.listen')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="info-box">
            <h3>📝 {t('learnEnglish.howItWorks')}</h3>
            <ul>
              <li>
                <strong>[0:00-2:30]</strong> {t('learnEnglish.introSection')}
              </li>
              <li>
                <strong>[2:30-10:00]</strong> {t('learnEnglish.storySection')}
              </li>
              <li>
                🗣️ {t('learnEnglish.formatInfo')}
              </li>
              <li>
                🚀 {t('learnEnglish.missionInfo')}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Story Player Modal */}
      {selectedStory && (
        <div className="story-modal-overlay" onClick={closePlayer}>
          <div className="story-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closePlayer}>✕</button>
            
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>{i18n.language === 'es' ? 'Cargando cuento...' : 'Loading story...'}</p>
              </div>
            ) : (
              <>
                <h2>{typeof selectedStory.title === 'object' ? selectedStory.title[i18n.language] : selectedStory.title}</h2>
                
                {/* Personajes que aparecen en el cuento */}
                {selectedStory.characters && (
                  <div className="story-characters">
                    <strong>{i18n.language === 'es' ? 'Personajes:' : 'Characters:'}</strong>
                    <div className="characters-list">
                      {selectedStory.characters.map((char, idx) => (
                        <div key={idx} className="character-item">
                          {char.imagePath && (
                            <img 
                              src={char.imagePath} 
                              alt={char.name}
                              className="character-avatar"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          )}
                          <span>{char.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Vocabulario del cuento */}
                <div className="modal-vocabulary">
                  <strong>{i18n.language === 'es' ? 'Vocabulario de este cuento:' : 'Story vocabulary:'}</strong>
                  <div className="modal-vocab-list">
                    {(selectedStory.vocabulary || []).map((word, idx) => (
                      <span key={idx} className="modal-vocab-tag">{word}</span>
                    ))}
                  </div>
                </div>
                
                {/* Texto del cuento (si está disponible) */}
                {selectedStory.text && (
                  <details className="story-text-container">
                    <summary>{i18n.language === 'es' ? '📖 Ver texto del cuento' : '📖 Show story text'}</summary>
                    <div className="story-text">
                      {selectedStory.text.split('\n').map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  </details>
                )}
                
                {/* Reproductor de audio - Secuencia de 3 partes */}
                {selectedStory.introUrl && selectedStory.vocabUrl && selectedStory.storyUrl ? (
                  <div className="audio-player-container">
                    <AudioPlayerSequence 
                      introUrl={selectedStory.introUrl}
                      vocabUrl={selectedStory.vocabUrl}
                      storyUrl={selectedStory.storyUrl}
                      title={typeof selectedStory.title === 'object' ? selectedStory.title.en : selectedStory.title}
                    />
                  </div>
                ) : selectedStory.error ? (
                  <div className="audio-error">
                    <p>❌ {t('learnEnglish.errorLoading')}</p>
                    {error && <p className="error-details">{error}</p>}
                  </div>
                ) : (
                  <div className="audio-player-placeholder">
                    <p>🎧 {t('learnEnglish.generating')}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LearnEnglishPage;
