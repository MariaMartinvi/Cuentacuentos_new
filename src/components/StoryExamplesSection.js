import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { fetchStoryExamples, checkStoragePermissions, getStoryTextUrl, getStoryAudioUrl, getStoryTextContent, getStoryImageUrl, fetchStoryMetadata, addProtagonistaToStory, updateStoriesWithCreationDate, diagnoseDateIssues } from '../services/storyExamplesService';
import { getStoriesWithCache } from '../services/cacheService';
import { getStoryById } from '../services/storyService';
import StoryCard from './StoryCard';
import StoryModal from './StoryModal';
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

const StoryExamplesSection = ({ autoOpenStoryId, autoPlayMode }) => {
  console.log('🚀 [COMPONENT] StoryExamplesSection rendered with:', { autoOpenStoryId, autoPlayMode });
  
  const { t } = useTranslation();
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    age: 'all',
    language: 'all',
    level: 'all',
    sortBy: 'newest'
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    content: '',
    audioUrl: null,
    showAudio: false,
    usingMockContent: false,
    imageUrl: null,
    storyId: null
  });

  console.log('🚀 [COMPONENT] Initial filters state:', filters);

  // Cargar solo los metadatos inicialmente
  useEffect(() => {
    const loadStories = async () => {
      try {
        setLoading(true);
        console.log("🚀 Loading stories...");
        
        let storyData = await fetchStoryMetadata();
        
        // Check if stories have creation dates
        if (storyData && storyData.length > 0) {
          const storiesWithoutDates = storyData.filter(story => !story.createdAt);
          console.log(`📅 Stories without dates: ${storiesWithoutDates.length}/${storyData.length}`);
          
          if (storiesWithoutDates.length > 0) {
            console.log('📅 Updating creation dates...');
            try {
              await updateStoriesWithCreationDate();
              // Reload stories after updating dates
              storyData = await fetchStoryMetadata();
            } catch (updateError) {
              console.error('❌ Error updating dates:', updateError);
            }
          }
        }
        
        if (storyData && storyData.length > 0) {
          console.log(`✅ Loaded ${storyData.length} stories`);
          // Cargar todas las historias para permitir filtros y ordenamiento correcto
          setStories(storyData);
          // Remove setFilteredStories - let the useEffect handle filtering and sorting
          setHasMore(false); // Disable load more since we're loading all
        } else {
          console.warn("⚠️ No stories found");
          setError(new Error("No se encontraron historias"));
        }
      } catch (error) {
        console.error("❌ Error loading stories:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStories();
  }, []);

  // Aplicar filtros localmente
  useEffect(() => {
    console.log('🔄 [FILTER-EFFECT] ===== EFFECT TRIGGERED =====');
    console.log('🔄 [FILTER-EFFECT] Stories length:', stories.length);
    console.log('🔄 [FILTER-EFFECT] Current filters:', filters);
    console.log('🔄 [FILTER-EFFECT] Running filter effect...');
    
    if (stories.length > 0) {
      let filtered = stories.filter(story => {
        return (filters.language === 'all' || story.language === filters.language) &&
               (filters.level === 'all' || story.level === filters.level);
      });
      
      console.log('🔄 [FILTER-EFFECT] After language/level filter:', filtered.length);
      
      // Apply sorting
      console.log(`🎯 [SORTING] Current sortBy filter: "${filters.sortBy}"`);
      switch (filters.sortBy) {
        case 'rating':
          // Sort by best rated: first by average rating, then by number of ratings
          filtered = filtered.sort((a, b) => {
            const aRating = a.averageRating || 0;
            const bRating = b.averageRating || 0;
            const aTotalRatings = a.totalRatings || 0;
            const bTotalRatings = b.totalRatings || 0;
            
            // First priority: higher average rating
            if (bRating !== aRating) {
              return bRating - aRating;
            }
            
            // Second priority: more total ratings (if same average rating)
            return bTotalRatings - aTotalRatings;
          });
          console.log('📊 Sorted by rating - first 3 stories:', filtered.slice(0, 3).map(s => ({
            title: s.title,
            avgRating: s.averageRating || 0,
            totalRatings: s.totalRatings || 0
          })));
          break;
        case 'newest':
        default:
          // Sort by creation date: NEW stories first, then OLD stories
          console.log('📅 [DATE-SORT] Sorting by creation date...');
          
          filtered = filtered.sort((a, b) => {
            // Función para detectar si es formato localizado (español) - NUEVAS HISTORIAS
            const isNewFormat = (dateValue) => {
              if (!dateValue) return false;
              
              // Si es un objeto Timestamp de Firebase, NO es formato nuevo
              if (dateValue && typeof dateValue === 'object' && dateValue.seconds !== undefined) {
                return false;
              }
              
              // Solo strings pueden ser formato nuevo localizado
              if (typeof dateValue !== 'string') return false;
              
              return dateValue.includes('de ') || dateValue.includes('p.m.') || dateValue.includes('a.m.');
            };
            
            const aIsNew = isNewFormat(a.createdAt);
            const bIsNew = isNewFormat(b.createdAt);
            
            // PRIORIDAD ABSOLUTA: Historias nuevas SIEMPRE van primero
            if (aIsNew && !bIsNew) {
              return -1; // a (nueva) va antes que b (vieja)
            }
            if (!aIsNew && bIsNew) {
              return 1;  // b (nueva) va antes que a (vieja)
            }
            
            // Si ambas son del mismo tipo (ambas nuevas o ambas viejas), ordenar por fecha
            try {
              if (!a.createdAt && !b.createdAt) return 0;
              if (!a.createdAt) return 1;
              if (!b.createdAt) return -1;
              
              // Convertir fechas correctamente según su tipo
              let dateA, dateB;
              
              // Para objetos Timestamp de Firebase
              if (a.createdAt && typeof a.createdAt === 'object' && a.createdAt.seconds !== undefined) {
                dateA = new Date(a.createdAt.seconds * 1000);
              } else {
                dateA = new Date(a.createdAt);
              }
              
              if (b.createdAt && typeof b.createdAt === 'object' && b.createdAt.seconds !== undefined) {
                dateB = new Date(b.createdAt.seconds * 1000);
              } else {
                dateB = new Date(b.createdAt);
              }
              
              // DEBUG: Log NEW date comparisons only (since those are the priority)
              if (aIsNew && bIsNew) {
                console.log(`📅 [NEW-DATE-SORT] Comparing new dates:`, {
                  a: { title: a.title.substring(0, 20), dateA: dateA.getTime(), dateStr: dateA.toISOString() },
                  b: { title: b.title.substring(0, 20), dateB: dateB.getTime(), dateStr: dateB.toISOString() },
                  result: dateB.getTime() - dateA.getTime(),
                  winner: (dateB.getTime() - dateA.getTime()) < 0 ? 'A' : (dateB.getTime() - dateA.getTime()) > 0 ? 'B' : 'TIE'
                });
              }
              
              if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                const result = dateB.getTime() - dateA.getTime(); // Más recientes primero
                
                return result;
              }
              
              // If date parsing fails, try to fallback to string comparison for localized dates
              if (aIsNew && bIsNew) {
                console.log(`⚠️ [DATE-PARSE-FAIL] Could not parse dates, using string comparison`);
                return b.createdAt.localeCompare(a.createdAt);
              }
              
              return 0;
            } catch (error) {
              console.error('❌ [DATE-SORT] Error:', error);
              return 0;
            }
          });
          
          // Log resultado final con más detalle para fechas nuevas
          console.log('📅 [RESULT] Order after sorting:');
          filtered.slice(0, 8).forEach((s, index) => {
            let dateStr = '';
            let parsed = null;
            
            // Determinar tipo de fecha y parsear correctamente
            if (s.createdAt) {
              if (typeof s.createdAt === 'object' && s.createdAt.seconds !== undefined) {
                // Timestamp de Firebase
                parsed = new Date(s.createdAt.seconds * 1000);
                dateStr = `Timestamp(${s.createdAt.seconds})`;
              } else if (typeof s.createdAt === 'string') {
                // String date (puede ser localizada o ISO)
                dateStr = s.createdAt;
                parsed = new Date(s.createdAt);
              } else {
                dateStr = String(s.createdAt);
                parsed = new Date(s.createdAt);
              }
            }
            
            const isNew = (typeof s.createdAt === 'string') && (s.createdAt.includes('de ') || s.createdAt.includes('p.m.') || s.createdAt.includes('a.m.'));
            
            console.log(`${index + 1}. "${s.title}" - ${isNew ? '🆕 NEW' : '🕰️ OLD'} - ${dateStr} ${parsed && !isNaN(parsed.getTime()) ? `(parsed: ${parsed.toISOString()})` : '(parse failed)'}`);
          });
          break;
      }
      
      console.log('🔄 [FILTER-EFFECT] Final filtered stories count:', filtered.length);
      console.log('🔄 [FILTER-EFFECT] Setting filtered stories...');
      // For homepage, show only first 6 after filtering and sorting
      const displayStories = filtered.slice(0, 6);
      setFilteredStories(displayStories);
      setHasMore(filtered.length > 6);
      
      console.log(`✅ [FILTER] Showing ${displayStories.length} stories (${filtered.length} total after filters)`);
    } else {
      console.log('⚠️ [FILTER] No stories to filter');
    }
  }, [filters, stories]);

  // Auto-load story from URL parameter
  useEffect(() => {
    if (autoOpenStoryId && !modalState.isOpen) {
      loadStoryFromId(autoOpenStoryId);
    }
  }, [autoOpenStoryId, modalState.isOpen]);

  const loadStoryFromId = async (storyId) => {
    try {
      console.log("[AUTO-LOAD] Loading story with ID:", storyId);
      
      // Validate storyId
      if (!storyId || typeof storyId !== 'string') {
        throw new Error('Invalid story ID provided');
      }
      
      // Fetch the story data from backend
      const response = await getStoryById(storyId);
      console.log("[AUTO-LOAD] API Response:", response);
      
      const story = response?.story || response?.data;
      
      if (!story) {
        console.error("[AUTO-LOAD] No story found in response:", response);
        throw new Error('Story not found');
      }

      console.log("[AUTO-LOAD] Story loaded:", story.title);
      console.log("[AUTO-LOAD] Auto play mode:", autoPlayMode);

      // Load content based on autoPlayMode preference
      let content = story.content || '';
      let audioUrl = null;
      
      // If autoPlay mode is "audio", prioritize audio loading
      if (autoPlayMode === 'audio' && story.audioPath) {
        console.log("[AUTO-LOAD] Audio mode requested - loading audio first");
        try {
          // For user stories, the audioPath might be a full URL or a path
          if (story.audioPath.startsWith('http')) {
            audioUrl = story.audioPath;
          } else {
            audioUrl = await getStoryAudioUrl(story.audioPath);
          }
          console.log("[AUTO-LOAD] Audio URL loaded successfully");
          
          // For audio mode, we can set content to empty or minimal to focus on audio
          if (audioUrl) {
            content = story.content || ''; // Keep content available but audio will be primary
          }
        } catch (error) {
          console.warn("[AUTO-LOAD] Could not load audio, falling back to text:", error);
          // If audio fails, keep the text content
        }
      } else {
        // Default behavior: load text, then try audio
        console.log("[AUTO-LOAD] Default mode - loading text content");
        
        // Try to load audio if available (for both modes)
        if (story.audioPath) {
          try {
            if (story.audioPath.startsWith('http')) {
              audioUrl = story.audioPath;
            } else {
              audioUrl = await getStoryAudioUrl(story.audioPath);
            }
            console.log("[AUTO-LOAD] Audio URL also loaded");
          } catch (error) {
            console.warn("[AUTO-LOAD] Could not load audio:", error);
          }
        }
      }

      // Load image URL if available
      let imageUrl = null;
      if (story.imagePath) {
        try {
          imageUrl = await getStoryImageUrl(story.imagePath);
          console.log("[AUTO-LOAD] Image URL loaded");
        } catch (error) {
          console.warn("[AUTO-LOAD] Could not load image:", error);
        }
      }

      // Open modal with the loaded story
      // For audio mode, prioritize showing audio player
      const shouldShowAudio = !!audioUrl;
      const shouldPrioritizeAudio = autoPlayMode === 'audio' && shouldShowAudio;
      
      setModalState({
        isOpen: true,
        title: story.title,
        content: content,
        audioUrl: audioUrl,
        showAudio: shouldShowAudio,
        prioritizeAudio: shouldPrioritizeAudio, // New flag to indicate audio priority
        usingMockContent: false,
        imageUrl: imageUrl,
        storyId: storyId
      });

    } catch (error) {
      console.error("[AUTO-LOAD] Error loading story:", error);
      
      // Determine error message based on error type
      let errorMessage = 'There was an error loading the story. Please try again later.';
      
      if (error.message === 'Story not found' || error.response?.status === 404) {
        errorMessage = 'Story not found. It may have been removed or you may not have permission to view it.';
      } else if (error.message === 'Invalid story ID provided') {
        errorMessage = 'Invalid story link. Please check the URL or try accessing the story from your profile.';
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'You need to be logged in to view this story. Please log in and try again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to view this story.';
      }
      
      // Show a user-friendly error message
      setModalState({
        isOpen: true,
        title: t('common.error'),
        content: errorMessage,
        audioUrl: null,
        showAudio: false,
        usingMockContent: false,
        imageUrl: null,
        storyId: null
      });
    }
  };

  const handleFilterChange = (filterType, value) => {
    console.log(`🔧 [FILTER] ${filterType} = ${value}`);
    
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
    }));
  };

  const handleStoryClick = async (story, actionType = 'text') => {
    console.log("[SECTION] Story clicked:", story.title, "Action:", actionType);

    try {
      let content = null;
      let audioUrl = null;

      // Load content based on action type
      if (actionType === 'text' || actionType === 'both') {
        // Load text content
        if (story.textPath) {
          try {
            content = await getStoryTextContent(story.textPath);
            console.log("[SECTION] Text content loaded:", !!content);
          } catch (error) {
            console.error("[SECTION] Error loading text content:", error);
            content = `Error al cargar el contenido del texto: ${error.message}`;
          }
        } else {
          content = "El contenido de texto no está disponible para esta historia.";
        }
      }

      if (actionType === 'audio' || actionType === 'both') {
        // Load audio content
        if (story.audioPath) {
          try {
            audioUrl = await getStoryAudioUrl(story.audioPath);
            console.log("[SECTION] Audio URL loaded:", !!audioUrl);
          } catch (error) {
            console.error("[SECTION] Error loading audio:", error);
            // Don't set audioUrl if there's an error
          }
        }
      }

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
        imageUrl: imageUrl,
        storyId: story.id
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
      
      const nextPage = page + 1;
      const endIndex = nextPage * 6;
      
      // Re-apply filters and get more stories to display
      let filtered = stories.filter(story => {
        return (filters.language === 'all' || story.language === filters.language) &&
               (filters.level === 'all' || story.level === filters.level);
      });
      
      // Apply current sorting
      switch (filters.sortBy) {
        case 'rating':
          filtered = filtered.sort((a, b) => {
            const aRating = a.averageRating || 0;
            const bRating = b.averageRating || 0;
            const aTotalRatings = a.totalRatings || 0;
            const bTotalRatings = b.totalRatings || 0;
            
            if (bRating !== aRating) {
              return bRating - aRating;
            }
            return bTotalRatings - aTotalRatings;
          });
          break;
        case 'newest':
        default:
          filtered = filtered.sort((a, b) => {
            const isNewFormat = (dateValue) => {
              if (!dateValue) return false;
              const dateStr = typeof dateValue === 'string' ? dateValue : String(dateValue);
              return dateStr.includes('de ') || dateStr.includes('p.m.') || dateStr.includes('a.m.');
            };
            
            const aIsNew = isNewFormat(a.createdAt);
            const bIsNew = isNewFormat(b.createdAt);
            
            if (aIsNew && !bIsNew) return -1;
            if (!aIsNew && bIsNew) return 1;
            
            try {
              if (!a.createdAt && !b.createdAt) return 0;
              if (!a.createdAt) return 1;
              if (!b.createdAt) return -1;
              
              const dateA = new Date(a.createdAt);
              const dateB = new Date(b.createdAt);
              
              if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                return dateB.getTime() - dateA.getTime();
              }
              
              return 0;
            } catch (error) {
              return 0;
            }
          });
          break;
      }
      
      const displayStories = filtered.slice(0, endIndex);
      setFilteredStories(displayStories);
      setPage(nextPage);
      setHasMore(filtered.length > displayStories.length);
      
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
        <p>{t('storyExamples.subtitle')}</p>
      </div>

      <div className="filters-container">
        <h3>{t('storyExamples.filters.title')}</h3>
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="home-language-filter">{t('storyExamples.filters.language')}</label>
            <div className="select-wrapper">
              <select 
                id="home-language-filter" 
                value={filters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
              >
                <option value="all">{t('storyExamples.languages.all')}</option>
                <option value="spanish">{t('storyExamples.languages.spanish')}</option>
                <option value="english">{t('storyExamples.languages.english')}</option>
                <option value="catalan">{t('storyExamples.languages.catalan')}</option>
                <option value="german">{t('storyExamples.languages.german')}</option>
                <option value="italian">{t('storyExamples.languages.italian')}</option>
                <option value="french">{t('storyExamples.languages.french')}</option>
                <option value="galician">{t('storyExamples.languages.galician')}</option>
                <option value="basque">{t('storyExamples.languages.basque')}</option>
                <option value="portuguese">{t('storyExamples.languages.portuguese')}</option>
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="home-level-filter">{t('storyExamples.filters.level')}</label>
            <div className="select-wrapper">
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

          <div className="filter-group">
            <label htmlFor="home-sort-filter">Ordenar por</label>
            <div className="select-wrapper">
              <select 
                id="home-sort-filter" 
                value={filters.sortBy || 'newest'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="newest">Fecha de creación</option>
                <option value="rating">Mejor puntuadas</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="stories-grid">
        {(() => {
          console.log('🔍 [StoryExamplesSection] About to render stories:', filteredStories.length);
          if (filteredStories.length > 0) {
            console.log('🔍 [StoryExamplesSection] First story data:', filteredStories[0]);
            console.log('🔍 [StoryExamplesSection] First story keys:', Object.keys(filteredStories[0]));
            console.log('🔍 [StoryExamplesSection] First story id:', filteredStories[0].id);
          }
          return filteredStories.map(story => (
            <StoryCard
              key={story.id}
              story={story}
              onStoryClick={handleStoryClick}
            />
          ));
        })()}
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