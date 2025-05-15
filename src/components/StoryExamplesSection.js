import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { fetchStoryExamples, checkStoragePermissions, getStoryTextUrl, getStoryAudioUrl, getStoryTextContent, getStoryImageUrl } from '../services/storyExamplesService';
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

  // Format the story text to display properly
  const formatStoryContent = (text) => {
    if (!text) {
      return (
        <div className="story-content">
          <h1>{title}</h1>
          <p>No story content available.</p>
        </div>
      );
    }
    
    // Split by new lines and convert to paragraphs
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    
    // If we have at least one paragraph
    if (paragraphs.length > 0) {
      return (
        <div className="story-content">
          <h1>{title}</h1>
          {imageUrl && (
            <div className="story-modal-image-container">
              <img 
                src={imageUrl} 
                alt={title} 
                className="story-modal-image" 
                onError={(e) => {
                  console.error(`Error loading image in modal`);
                  // Try to load default image
                  e.target.src = '/images/default-story.jpg';
                  e.target.onerror = null; // Prevent infinite loop if default also fails
                }} 
              />
            </div>
          )}
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      );
    } else {
      // If we couldn't parse paragraphs, just display the text as is
      return (
        <div className="story-content">
          <h1>{title}</h1>
          {imageUrl && (
            <div className="story-modal-image-container">
              <img 
                src={imageUrl} 
                alt={title} 
                className="story-modal-image" 
                onError={(e) => {
                  console.error(`Error loading image in modal`);
                  // Try to load default image
                  e.target.src = '/images/default-story.jpg';
                  e.target.onerror = null; // Prevent infinite loop if default also fails
                }} 
              />
            </div>
          )}
          <p>{text}</p>
        </div>
      );
    }
  };

  // Prevent clicks inside the modal from closing it
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // Close button handler
  const handleCloseClick = () => {
    onClose();
  };

  return (
    <div className="story-modal-overlay" onClick={onClose}>
      <div className="story-modal" onClick={handleModalClick}>
        <button className="story-modal-close" onClick={handleCloseClick}>&times;</button>
        
        {/* Show indicator for mock content if applicable */}
        {usingMockContent && (
          <div className="mock-content-banner">
            <span className="mock-badge">{t('storyExamples.storyCard.usingMockContent')}</span>
          </div>
        )}
        
        {/* Show story content only when not in audio mode */}
        {!showAudio && formatStoryContent(content)}
        
        {/* Show audio player when in audio mode */}
        {showAudio && (
          <div className="audio-mode-container">
            <h1>{title}</h1>
            {imageUrl && (
              <div className="story-modal-image-container">
                <img 
                  src={imageUrl} 
                  alt={title} 
                  className="story-modal-image" 
                  onError={(e) => {
                    console.error(`Error loading image in modal`);
                    // Try to load default image
                    e.target.src = '/images/default-story.jpg';
                    e.target.onerror = null; // Prevent infinite loop if default also fails
                  }} 
                />
              </div>
            )}
            {processedAudioUrl && (
              <AudioPlayer audioUrl={processedAudioUrl} title={title} />
            )}
            {!processedAudioUrl && (
              <div className="audio-not-available">
                <p>{t('storyExamples.audioNotAvailable')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// StoryCard component for the examples section
const StoryCard = ({ story, t }) => {
  const [textUrl, setTextUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storyContent, setStoryContent] = useState('');
  const [showAudio, setShowAudio] = useState(false);
  const [usingMockContent, setUsingMockContent] = useState(false);

  // Get mock story content based on story ID
  const getMockStoryContent = () => {
    return `${story.title}

Esta es una historia de ejemplo para ${story.title}.

El contenido real se cargará desde Firebase cuando esté disponible.

Fin`;
  };

  useEffect(() => {
    const loadResources = async () => {
      try {
        setLoading(true);
        
        // Set image URL using getStoryImageUrl
        if (story.imagePath) {
          try {
            const url = await getStoryImageUrl(story.imagePath);
            if (url) {
              setImageUrl(url);
            } else {
              // Use a local fallback image
              setImageUrl('/images/default-story.jpg');
            }
          } catch (imageError) {
            console.error("Error loading image URL:", imageError);
            // Use a local fallback image
            setImageUrl('/images/default-story.jpg');
          }
        } else {
          // Use a local fallback image
          setImageUrl('/images/default-story.jpg');
        }
        
        // Load text URL
        if (story.textPath) {
          try {
            const url = await getStoryTextUrl(story.textPath);
            setTextUrl(url);
            
            // Pre-load story content for modal
            try {
              const content = await getStoryTextContent(story.textPath);
              if (content) {
                setStoryContent(content);
                // Check if it's mock content
                if (content.includes("Esta es una historia de ejemplo")) {
                  setUsingMockContent(true);
                }
              } else {
                // Use mock content as fallback
                setStoryContent(getMockStoryContent());
                setUsingMockContent(true);
              }
            } catch (contentError) {
              console.error("Error loading story content:", contentError);
              setStoryContent(getMockStoryContent());
              setUsingMockContent(true);
            }
          } catch (textError) {
            console.error("Error loading text URL:", textError);
          }
        }
        
        // Load audio URL
        if (story.audioPath) {
          try {
            const url = await getStoryAudioUrl(story.audioPath);
            setAudioUrl(url);
          } catch (audioError) {
            console.error("Error loading audio URL:", audioError);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading story resources:", error);
        setError(error);
        setLoading(false);
      }
    };
    
    loadResources();
  }, [story]);

  const openTextModal = (e) => {
    e.preventDefault();
    setShowAudio(false);
    setIsModalOpen(true);
  };

  const openAudioModal = (e) => {
    e.preventDefault();
    setShowAudio(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="story-card loading">
        <div className="spinner-container">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="story-card error">
        <h3>{story.title}</h3>
        <p className="text-danger">Error loading story resources</p>
      </div>
    );
  }

  return (
    <>
      <div className="story-card">
        <h3>{story.title}</h3>
        <div className="story-image-container">
          {imageUrl ? (
            <img 
              src={imageUrl}
              alt={story.title} 
              className="story-image" 
              onError={(e) => {
                console.error(`Error loading image for ${story.id}`);
                // Try to load default image
                e.target.src = '/images/default-story.jpg';
                e.target.onerror = null; // Prevent infinite loop if default also fails
              }} 
            />
          ) : (
            <div className="story-image-placeholder">
              <span>{story.title.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="story-details">
          <p><strong>{t('storyExamples.storyCard.recommendedAge')}</strong> {t(`storyExamples.ageGroups.${story.age}`)}</p>
          <p><strong>{t('storyExamples.storyCard.language')}</strong> {t(`storyExamples.languages.${story.language}`)}</p>
          <p><strong>{t('storyExamples.storyCard.level')}</strong> {t(`storyExamples.levels.${story.level}`)}</p>
          {usingMockContent && (
            <p className="mock-content-indicator">
              <span className="mock-badge">{t('storyExamples.storyCard.usingMockContent')}</span>
            </p>
          )}
        </div>
        <div className="story-actions">
          <a href="#" onClick={openTextModal} className="story-link">
            {t('storyExamples.storyCard.readStory')}
          </a>
          {audioUrl && (
            <a href="#" onClick={openAudioModal} className="story-link audio-link">
              {t('storyExamples.storyCard.listenAudio')}
            </a>
          )}
        </div>
      </div>
      
      <StoryModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        title={story.title}
        content={storyContent}
        audioUrl={audioUrl}
        showAudio={showAudio}
        usingMockContent={usingMockContent}
        imageUrl={imageUrl}
      />
    </>
  );
};

const StoryExamplesSection = () => {
  const { t } = useTranslation();
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    age: 'all',
    language: 'all',
    level: 'all'
  });

  // Fetch stories from Firebase
  useEffect(() => {
    const loadStories = async () => {
      try {
        setLoading(true);
        
        // Run diagnostics
        try {
          await checkStoragePermissions();
        } catch (diagError) {
          console.error("Error during diagnostics:", diagError);
        }
        
        // Load stories
        const storyData = await fetchStoryExamples();
        
        if (storyData && storyData.length > 0) {
          // Show only a subset of stories on the homepage (max 6)
          const limitedStories = storyData.slice(0, 6);
          setStories(limitedStories);
          setFilteredStories(limitedStories);
          setLoading(false);
        } else {
          setError(new Error("No stories found"));
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading stories:", error);
        setError(error);
        setLoading(false);
      }
    };
    
    loadStories();
  }, []);

  // Apply filters locally
  useEffect(() => {
    if (stories.length > 0) {
      const filtered = stories.filter(story => {
        return (filters.age === 'all' || story.age === filters.age) &&
               (filters.language === 'all' || story.language === filters.language) &&
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
            <label htmlFor="home-age-filter">{t('storyExamples.filters.age')}</label>
            <select 
              id="home-age-filter" 
              value={filters.age}
              onChange={(e) => handleFilterChange('age', e.target.value)}
            >
              <option value="all">{t('storyExamples.ageGroups.all')}</option>
              <option value="3to5">{t('storyExamples.ageGroups.3to5')}</option>
              <option value="6to8">{t('storyExamples.ageGroups.6to8')}</option>
              <option value="9to12">{t('storyExamples.ageGroups.9to12')}</option>
            </select>
          </div>

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

      {loading ? (
        <div className="loading-container">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{t('common.errorLoading')}</p>
          <Link to="/story-examples" className="btn btn-primary">
            {t('common.seeAllStories')}
          </Link>
        </div>
      ) : (
        <>
          <div className="stories-grid">
            {filteredStories.length > 0 ? (
              filteredStories.map(story => (
                <StoryCard key={story.id} story={story} t={t} />
              ))
            ) : (
              <p className="no-results">{t('storyExamples.noResults')}</p>
            )}
          </div>
          
          <div className="view-all-container">
            <Link to="/story-examples" className="btn btn-primary view-all-btn">
              {t('common.viewAllStories')}
            </Link>
          </div>
        </>
      )}
    </section>
  );
};

export default StoryExamplesSection; 