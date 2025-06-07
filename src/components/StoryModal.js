import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AudioPlayer from './AudioPlayer';
import StarRating from './StarRating';
import { getStoryRatings } from '../services/storyService';
import './StoryModal.css';

const StoryModal = ({ 
  isOpen, 
  onClose, 
  title, 
  content, 
  audioUrl, 
  showAudio, 
  usingMockContent, 
  imageUrl, 
  storyId 
}) => {
  const { t } = useTranslation();
  const [processedAudioUrl, setProcessedAudioUrl] = useState(null);
  const [ratings, setRatings] = useState({
    averageRating: 0,
    totalRatings: 0,
    userRating: null
  });
  const [loadingRatings, setLoadingRatings] = useState(false);
  
  useEffect(() => {
    if (audioUrl) {
      setProcessedAudioUrl(audioUrl);
    }
  }, [audioUrl]);

  // Load ratings when modal opens and we have a storyId
  useEffect(() => {
    if (isOpen && storyId) {
      loadRatings();
    }
  }, [isOpen, storyId]);

  const loadRatings = async () => {
    try {
      setLoadingRatings(true);
      const response = await getStoryRatings(storyId);
      if (response.success) {
        setRatings(response.data);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
      // Set default values on error
      setRatings({
        averageRating: 0,
        totalRatings: 0,
        userRating: null
      });
    } finally {
      setLoadingRatings(false);
    }
  };

  const handleRatingChange = (newRatings) => {
    setRatings(newRatings);
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

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
                onError={handleImageError} 
              />
            </div>
          )}
          
          {/* Rating Section - Only show for user stories (MongoDB IDs), not Firebase examples */}
          {storyId && (storyId.length === 24 || storyId.startsWith('68')) && (
            <div className="story-modal-rating">
              {!loadingRatings ? (
                <StarRating
                  storyId={storyId}
                  averageRating={ratings.averageRating}
                  totalRatings={ratings.totalRatings}
                  userRating={ratings.userRating}
                  onRatingChange={handleRatingChange}
                  size="large"
                  showCount={true}
                />
              ) : (
                <div className="rating-loading">
                  <span>Cargando puntuaciones...</span>
                </div>
              )}
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

export default StoryModal; 