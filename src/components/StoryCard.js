import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import FirebaseStarRating from './FirebaseStarRating';
import LazyImage from './LazyImage';
import { getStoryImageUrl } from '../services/storyExamplesService';
import './StoryCard.css';

const StoryCard = ({ story, onStoryClick }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  console.log('🔍 [StoryCard] Rendering story:', {
    id: story.id,
    title: story.title,
    hasImage: !!story.imagePath,
    hasAudio: !!story.audioPath,
    imagePath: story.imagePath
  });

  // Cargar imagen desde Firebase Storage
  useEffect(() => {
    const loadImageUrl = async () => {
      if (story.imagePath) {
        try {
          setIsLoadingImage(true);
          setImageError(false);
          const url = await getStoryImageUrl(story.imagePath);
          console.log('🖼️ [StoryCard] Image URL loaded:', url);
          setImageUrl(url);
        } catch (error) {
          console.error('🖼️ [StoryCard] Error loading image:', error);
          setImageError(true);
        } finally {
          setIsLoadingImage(false);
        }
      } else {
        setIsLoadingImage(false);
      }
    };

    loadImageUrl();
  }, [story.imagePath]);

  const handleImageLoad = () => {
    console.log('🖼️ [StoryCard] Image loaded successfully');
  };

  const handleImageError = () => {
    console.error('🖼️ [StoryCard] Image failed to load');
    setImageError(true);
  };

  const handleReadStory = async (e) => {
    e.stopPropagation();
    console.log('📖 [StoryCard] Read story clicked for:', story.id);
    
    if (onStoryClick) {
      setIsLoadingContent(true);
      try {
        await onStoryClick(story, 'text');
      } catch (error) {
        console.error('📖 [StoryCard] Error in read story:', error);
      } finally {
        setIsLoadingContent(false);
      }
    }
  };

  const handleListenAudio = async (e) => {
    e.stopPropagation();
    console.log('🔊 [StoryCard] Listen audio clicked for:', story.id);
    
    if (onStoryClick) {
      setIsLoadingContent(true);
      try {
        await onStoryClick(story, 'audio');
      } catch (error) {
        console.error('🔊 [StoryCard] Error in listen audio:', error);
      } finally {
        setIsLoadingContent(false);
      }
    }
  };

  const handleRatingChange = (ratingResult) => {
    console.log('🌟 [StoryCard] Rating changed:', ratingResult);
    // Aquí podrías actualizar el estado local si es necesario
  };

  return (
    <div className={`story-card ${isLoadingContent ? 'loading-content' : ''}`}>
      {/* Image Container */}
      <div className="story-card-image-container">
        {isLoadingImage ? (
          <div className="story-card-skeleton" />
        ) : imageUrl && !imageError ? (
          <LazyImage
            src={imageUrl}
            alt={story.title}
            className="story-card-image"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <div className="story-card-image-fallback">
            <span>📚</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="story-card-content">
        <h3 className="story-card-title">{story.title}</h3>
        
        {/* Protagonist */}
        {story.protagonista && story.protagonista.trim() !== '' && (
          <p className="story-card-protagonist">
            <span className="protagonist-label">{t('storyExamples.storyCard.protagonist')}: </span>
            <span className="protagonist-name">{story.protagonista}</span>
          </p>
        )}

        {/* Metadata */}
        <div className="story-card-metadata">
          {story.age && (
            <span className="story-card-age">
              {story.age === '6to8' ? '6-8 años' : 
               story.age === '3to5' ? '3-5 años' : 
               story.age === '9to12' ? '9-12 años' : story.age}
            </span>
          )}
          {story.language && (
            <span className="story-card-language">
              {story.language === 'spanish' ? 'Español' :
               story.language === 'english' ? 'Inglés' :
               story.language === 'catalan' ? 'Catalán' : story.language}
            </span>
          )}
          {story.level && (
            <span className="story-card-level">
              {story.level === 'basic' ? 'Principiante' :
               story.level === 'intermediate' ? 'Intermedio' :
               story.level === 'advanced' ? 'Avanzado' : story.level}
            </span>
          )}
        </div>

        {/* Firebase Star Rating */}
        <div className="story-card-rating">
          <FirebaseStarRating
            storyId={story.id}
            averageRating={story.averageRating || 0}
            totalRatings={story.totalRatings || 0}
            onRatingChange={handleRatingChange}
            size="small"
            showCount={true}
            readonly={false}
          />
        </div>

        {/* Action Buttons */}
        <div className="story-card-actions">
          {story.textPath && (
            <button
              className="story-card-button text-button"
              onClick={handleReadStory}
              disabled={isLoadingContent}
            >
              {isLoadingContent ? t('common.loading') : t('storyExamples.storyCard.readStory')}
            </button>
          )}
          
          {story.audioPath && (
            <button
              className="story-card-button audio-button"
              onClick={handleListenAudio}
              disabled={isLoadingContent}
            >
              {isLoadingContent ? t('common.loading') : t('storyExamples.storyCard.listenAudio')}
            </button>
          )}
        </div>

        {/* Published by info */}
        {story.email && (
          <div className="story-card-published-by">
            Publicado por: {story.email.substring(0, 6)}...
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryCard; 