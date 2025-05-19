import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { fetchStoryExamples, checkStoragePermissions, getStoryTextUrl, getStoryAudioUrl, getStoryTextContent, getStoryImageUrl, fetchStoryMetadata } from '../services/storyExamplesService';
import { getStoriesWithCache } from '../services/cacheService';
import StoryCard from './StoryCard';
import './StoryExamplesSection.css';

// AudioPlayer component for the modal
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
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      };

      // Event listeners
      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', () => setIsPlaying(false));

      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', () => setIsPlaying(false));
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

  const getDownloadUrl = () => {
    if (typeof audioUrl === 'object' && audioUrl.url) {
      return audioUrl.url;
    }
    return audioUrl;
  };

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={getDownloadUrl()} />

      <div className="player-controls">
        <button
          onClick={togglePlay}
          className="play-pause-btn"
          aria-label={isPlaying ? t('audioPlayer.pause') : t('audioPlayer.play')}
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
          aria-label={t('audioPlayer.progress')}
        />

        <div className="time-display">
          {formatTime(duration)}
        </div>

        <a 
          href={getDownloadUrl()} 
          download={`${title || 'audio'}.mp3`}
          className="download-audio-btn"
          aria-label={t('audioPlayer.download')}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('audioPlayer.download')}
        </a>
      </div>
    </div>
  );
};

// Story modal component
const StoryModal = ({ isOpen, onClose, title, content, audioUrl, showAudio, usingMockContent, imageUrl }) => {
  const { t } = useTranslation();
  const [processedAudioUrl, setProcessedAudioUrl] = useState(null);
  
  useEffect(() => {
    if (audioUrl) {
      setProcessedAudioUrl(audioUrl);
    }
  }, [audioUrl]);

  if (!isOpen) return null;

  return (
    <div className="story-modal-overlay" onClick={onClose}>
      <div className="story-modal" onClick={e => e.stopPropagation()}>
        <button className="story-modal-close" onClick={onClose}>×</button>
        <div className="story-modal-content">
          <h1>{title}</h1>
          {imageUrl && (
            <div className="story-modal-image-container">
              <img 
                src={imageUrl} 
                alt={title} 
                className="story-modal-image" 
                onError={(e) => {
                  console.error("[MODAL] Error loading image");
                  e.target.src = '/images/default-story.jpg';
                  e.target.onerror = null;
                }} 
              />
            </div>
          )}
          {!showAudio && content && (
            <div className="story-content">
              {content.split('\n').map((paragraph, index) => (
                <p key={index} className="story-paragraph">{paragraph}</p>
              ))}
              {usingMockContent && (
                <div className="mock-content-notice">
                  <p>{t('story.mockContentNotice')}</p>
                </div>
              )}
            </div>
          )}
          {showAudio && processedAudioUrl && (
            <div className="story-modal-audio">
              <AudioPlayer audioUrl={processedAudioUrl} title={title} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StoryExamplesSection = () => {
  const { t } = useTranslation();
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    language: 'all',
    level: 'all'
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Add modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    content: '',
    audioUrl: null,
    showAudio: false,
    usingMockContent: false,
    imageUrl: null
  });

  // Cargar solo los metadatos inicialmente
  useEffect(() => {
    const loadStories = async () => {
      try {
        setLoading(true);
        console.log("Cargando metadatos de historias...");
        
        const storyData = await fetchStoryMetadata();
        
        if (storyData && storyData.length > 0) {
          console.log(`✓ Éxito! Cargados ${storyData.length} metadatos de historias`);
          // Mostrar solo un subconjunto de historias en la página principal (máximo 6)
          const limitedStories = storyData.slice(0, 6);
          setStories(limitedStories);
          setFilteredStories(limitedStories);
          setHasMore(storyData.length > 6);
        } else {
          console.warn("⚠ No se encontraron historias");
          setError(new Error("No se encontraron historias"));
        }
      } catch (error) {
        console.error("✗ Error al cargar metadatos de historias:", error);
        setError(error);
      } finally {
        setLoading(false);
        console.log("=== CARGA DE METADATOS COMPLETADA ===");
      }
    };
    
    loadStories();
  }, []);

  // Aplicar filtros localmente
  useEffect(() => {
    if (stories.length > 0) {
      const filtered = stories.filter(story => {
        return (filters.language === 'all' || story.language === filters.language) &&
               (filters.level === 'all' || story.level === filters.level);
      });
      
      setFilteredStories(filtered);
    }
  }, [filters, stories]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
    }));
  };

  const handleStoryClick = async (story, content, audioUrl) => {
    console.log("[SECTION] Story clicked:", story.title);
    console.log("[SECTION] Content received:", content ? "Yes" : "No");
    console.log("[SECTION] Audio URL received:", audioUrl ? "Yes" : "No");

    try {
      // Get image URL
      let imageUrl = null;
      if (story.imagePath) {
        try {
          imageUrl = await getStoryImageUrl(story.imagePath);
          console.log("[SECTION] Image URL loaded:", imageUrl);
        } catch (error) {
          console.error("[SECTION] Error loading image:", error);
        }
      }

      // Open modal with content
      setModalState({
        isOpen: true,
        title: story.title,
        content: content,
        audioUrl: audioUrl,
        showAudio: !!audioUrl,
        usingMockContent: false,
        imageUrl: imageUrl
      });
    } catch (error) {
      console.error("[SECTION] Error handling story click:", error);
      setError(error);
    }
  };

  const handleCloseModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      console.log("Cargando más historias...");
      
      const storyData = await fetchStoryMetadata();
      const nextPage = page + 1;
      const startIndex = 0;
      const endIndex = nextPage * 6;
      const newStories = storyData.slice(startIndex, endIndex);
      
      if (newStories.length > stories.length) {
        setStories(newStories);
        setPage(nextPage);
        setHasMore(storyData.length > newStories.length);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error al cargar más historias:", error);
      setError(error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="story-examples-section loading">
        <div className="loading-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="story-examples-section error">
        <p>{t('common.error')}</p>
        <button onClick={() => window.location.reload()}>
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <section className="story-examples-section">
      <div className="section-header">
        <h2>{t('storyExamples.title')}</h2>
        <p>{t('storyExamples.description')}</p>
      </div>

      <div className="filters-container">
        <h3>{t('storyExamples.filters.title')}</h3>
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="home-language-filter">{t('storyExamples.filters.language')}</label>
            <select 
              id="home-language-filter" 
              value={filters.language}
              onChange={(e) => handleFilterChange('language', e.target.value)}
            >
              <option value="all">{t('storyExamples.languages.all')}</option>
              <option value="spanish">{t('storyExamples.languages.spanish')}</option>
              <option value="english">{t('storyExamples.languages.english')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="home-level-filter">{t('storyExamples.filters.level')}</label>
            <select 
              id="home-level-filter" 
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
            >
              <option value="all">{t('storyExamples.levels.all')}</option>
              <option value="beginner">{t('storyExamples.levels.beginner')}</option>
              <option value="intermediate">{t('storyExamples.levels.intermediate')}</option>
              <option value="advanced">{t('storyExamples.levels.advanced')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="stories-grid">
        {filteredStories.map(story => (
          <StoryCard
            key={story.id}
            story={story}
            onStoryClick={handleStoryClick}
          />
        ))}
      </div>
      
      <div className="view-all-container">
        {hasMore && (
          <button 
            onClick={handleLoadMore} 
            className="btn btn-primary view-all-btn"
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <span className="loading-spinner"></span>
                {t('common.loading')}
              </>
            ) : (
              t('common.seeAllStories')
            )}
          </button>
        )}
      </div>

      {/* Add StoryModal component */}
      <StoryModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        title={modalState.title}
        content={modalState.content}
        audioUrl={modalState.audioUrl}
        showAudio={modalState.showAudio}
        usingMockContent={modalState.usingMockContent}
        imageUrl={modalState.imageUrl}
      />
    </section>
  );
};

export default StoryExamplesSection; 