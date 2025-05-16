import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import LazyImage from './LazyImage';
import { getStoryTextContent, getStoryAudioUrl, getStoryImageUrl } from '../services/storyExamplesService';
import AudioPlayer from './AudioPlayer';
import './StoryCard.css';

const StoryCard = ({ story, onStoryClick }) => {
  const { t } = useTranslation();
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAudio, setShowAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [storyContent, setStoryContent] = useState(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const loadImageUrl = async () => {
      if (story.imagePath) {
        try {
          const url = await getStoryImageUrl(story.imagePath);
          setImageUrl(url);
        } catch (error) {
          console.error("[STORY] Error loading image URL:", error);
          setError(error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadImageUrl();
  }, [story.imagePath]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleTextClick = async () => {
    try {
      setIsLoadingContent(true);
      setError(null);

      if (!story.textPath) {
        throw new Error("No text path provided");
      }

      const content = await getStoryTextContent(story.textPath);
      
      if (!content) {
        throw new Error("No text content received");
      }
      
      setStoryContent(content);
      
      if (onStoryClick) {
        onStoryClick(story, content, null);
      }
    } catch (error) {
      console.error("[STORY] Error in handleTextClick:", error);
      setError(error);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleAudioClick = async () => {
    try {
      setIsLoadingAudio(true);
      let audio = audioUrl;

      if (story.audioPath) {
        try {
          audio = await getStoryAudioUrl(story.audioPath);
          
          if (!audio) {
            throw new Error("No audio URL received");
          }
          
          setAudioUrl(audio);
          setShowAudio(true);
          
          if (onStoryClick) {
            onStoryClick(story, storyContent, audio);
          }
        } catch (error) {
          console.error("[STORY] Error loading audio:", error);
          setError(error);
        }
      }
    } catch (error) {
      console.error("[STORY] Error in handleAudioClick:", error);
      setError(error);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  if (error) {
    return (
      <div className="story-card error">
        <div className="story-card-image-container">
          <img 
            src="/images/default-story.jpg" 
            alt={story.title} 
            className="story-card-image"
          />
        </div>
        <div className="story-card-content">
          <h3 className="story-card-title">{story.title}</h3>
          <p className="error-message">{error.message || t('common.error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`story-card ${isLoadingContent ? 'loading-content' : ''}`}>
      <div className="story-card-image-container">
        {isLoading ? (
          <div className="story-card-skeleton" />
        ) : (
          <LazyImage
            src={imageUrl}
            alt={story.title}
            className={`story-card-image ${imageLoaded ? 'loaded' : 'loading'}`}
            onLoad={handleImageLoad}
          />
        )}
      </div>
      <div className="story-card-content">
        <h3 className="story-card-title">{story.title}</h3>
        <div className="story-card-metadata">
          <span className="story-card-age">
            {t(`storyExamples.ageGroups.${story.age}`)}
          </span>
          <span className="story-card-language">
            {t(`storyExamples.languages.${story.language}`)}
          </span>
          <span className="story-card-level">
            {t(`storyExamples.levels.${story.level}`)}
          </span>
        </div>
        {error && (
          <p className="error-message">{error.message || t('common.error')}</p>
        )}
        <div className="story-card-actions">
          {story.textPath && (
            <button 
              className="story-card-button text-button"
              onClick={handleTextClick}
              disabled={isLoadingContent}
            >
              {isLoadingContent ? t('common.loading') : t('storyExamples.storyCard.readStory')}
            </button>
          )}
          {story.audioPath && (
            <button 
              className="story-card-button audio-button"
              onClick={handleAudioClick}
              disabled={isLoadingAudio}
            >
              {isLoadingAudio ? t('common.loading') : t('storyExamples.storyCard.listenAudio')}
            </button>
          )}
        </div>
        {showAudio && audioUrl && (
          <AudioPlayer audioUrl={audioUrl} />
        )}
      </div>
    </div>
  );
};

export default StoryCard; 