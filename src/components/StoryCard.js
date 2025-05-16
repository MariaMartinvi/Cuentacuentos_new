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

  useEffect(() => {
    const loadImageUrl = async () => {
      if (story.imagePath) {
        try {
          console.log("[STORY] Loading image for story:", story.id);
          const url = await getStoryImageUrl(story.imagePath);
          console.log("[STORY] Image URL loaded:", url);
          setImageUrl(url);
        } catch (error) {
          console.error("[STORY] Error loading image URL:", error);
          setError(error);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log("[STORY] No image path provided for story:", story.id);
        setIsLoading(false);
      }
    };

    loadImageUrl();
  }, [story.imagePath, story.id]);

  const handleTextClick = async () => {
    try {
      console.log("[STORY] === Starting text load ===");
      console.log("[STORY] Story ID:", story.id);
      console.log("[STORY] Text path:", story.textPath);
      
      setIsLoadingContent(true);
      setError(null); // Clear any previous errors

      if (!story.textPath) {
        console.log("[STORY] No text path provided for story:", story.id);
        throw new Error("No text path provided");
      }

      try {
        console.log("[STORY] Loading text content for story:", story.id);
        const content = await getStoryTextContent(story.textPath);
        console.log("[STORY] Text content loaded:", content ? "Yes" : "No");
        
        if (!content) {
          throw new Error("No text content received");
        }
        
        setStoryContent(content);
        console.log("[STORY] Text content set in state:", content.substring(0, 100) + "...");
        
        // Notify parent component with loaded content
        if (onStoryClick) {
          console.log("[STORY] Notifying parent component with text content");
          onStoryClick(story, content, null);
        } else {
          console.warn("[STORY] No onStoryClick handler provided");
        }
      } catch (error) {
        console.error("[STORY] Error loading text content:", error);
        throw new Error(`Failed to load story text: ${error.message}`);
      }
    } catch (error) {
      console.error("[STORY] Error in handleTextClick:", error);
      setError(error);
    } finally {
      setIsLoadingContent(false);
      console.log("[STORY] === Text load completed ===");
    }
  };

  const handleAudioClick = async () => {
    try {
      console.log("[STORY] === Starting audio load ===");
      console.log("[STORY] Story ID:", story.id);
      console.log("[STORY] Audio path:", story.audioPath);
      
      setIsLoadingAudio(true);
      let audio = audioUrl;

      if (story.audioPath) {
        try {
          console.log("[STORY] Loading audio for story:", story.id);
          audio = await getStoryAudioUrl(story.audioPath);
          console.log("[STORY] Audio URL loaded:", audio ? "Yes" : "No");
          
          if (!audio) {
            throw new Error("No audio URL received");
          }
          
          setAudioUrl(audio);
          setShowAudio(true);
          console.log("[STORY] Audio URL set in state");
          
          // Notify parent component with audio URL
          if (onStoryClick) {
            console.log("[STORY] Notifying parent component with audio URL");
            onStoryClick(story, storyContent, audio);
          }
        } catch (error) {
          console.error("[STORY] Error loading audio:", error);
          setError(error);
        }
      } else {
        console.log("[STORY] No audio path provided for story:", story.id);
      }
    } catch (error) {
      console.error("[STORY] Error in handleAudioClick:", error);
      setError(error);
    } finally {
      setIsLoadingAudio(false);
      console.log("[STORY] === Audio load completed ===");
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
    <div className="story-card">
      <div className="story-card-image-container">
        {isLoading ? (
          <div className="story-card-skeleton">
            <div className="skeleton-image"></div>
          </div>
        ) : error ? (
          <div className="story-card-error">
            <div className="error-image"></div>
          </div>
        ) : (
          <LazyImage
            src={imageUrl}
            alt={story.title}
            className="story-card-image"
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
      </div>
      {showAudio && audioUrl && (
        <AudioPlayer audioUrl={audioUrl} title={story.title} />
      )}
    </div>
  );
};

export default StoryCard; 