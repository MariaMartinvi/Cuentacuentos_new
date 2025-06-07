import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';
import './StarRating.css';

const StarRating = ({ 
  storyId, 
  averageRating = 0, 
  totalRatings = 0, 
  userRating = null, 
  onRatingChange,
  readonly = false,
  showCount = true,
  size = 'medium'
}) => {
  const { isAuthenticated } = useAuth();
  const [hoveredRating, setHoveredRating] = useState(0);
  const [currentUserRating, setCurrentUserRating] = useState(userRating);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentUserRating(userRating);
  }, [userRating]);

  const handleStarClick = async (rating) => {
    if (readonly || !isAuthenticated || isSubmitting) return;

    console.log('🌟 [StarRating] Attempting to rate story:', { storyId, rating, apiUrl: config.apiUrl });
    
    setIsSubmitting(true);
    try {
      const url = `${config.apiUrl}/api/stories/${storyId}/rate`;
      console.log('🌟 [StarRating] Making request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rating })
      });

      console.log('🌟 [StarRating] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🌟 [StarRating] Success! Response data:', data);
        setCurrentUserRating(rating);
        
        // Notify parent component of the change
        if (onRatingChange) {
          onRatingChange({
            averageRating: data.data.averageRating,
            totalRatings: data.data.totalRatings,
            userRating: rating
          });
        }
      } else {
        const errorData = await response.json();
        console.error('🌟 [StarRating] Error rating story:', errorData);
        // You could add a toast notification here
      }
    } catch (error) {
      console.error('🌟 [StarRating] Network error rating story:', error);
      // You could add a toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarHover = (rating) => {
    if (!readonly && isAuthenticated && !isSubmitting) {
      setHoveredRating(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  const renderStars = () => {
    const stars = [];
    const displayRating = hoveredRating || averageRating;
    
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= displayRating;
      const isPartiallyFilled = i === Math.ceil(displayRating) && displayRating % 1 !== 0;
      const isUserRated = currentUserRating && i <= currentUserRating;
      const isHovered = hoveredRating && i <= hoveredRating;
      
      stars.push(
        <button
          key={i}
          className={`star ${size} ${isFilled ? 'filled' : ''} ${isPartiallyFilled ? 'partial' : ''} ${isUserRated ? 'user-rated' : ''} ${isHovered ? 'hovered' : ''} ${readonly ? 'readonly' : ''}`}
          onClick={() => handleStarClick(i)}
          onMouseEnter={() => handleStarHover(i)}
          onMouseLeave={handleMouseLeave}
          disabled={readonly || !isAuthenticated || isSubmitting}
          aria-label={`${i} ${i === 1 ? 'estrella' : 'estrellas'}`}
          title={readonly ? 
            `Puntuación: ${averageRating.toFixed(1)}/5` : 
            (isAuthenticated ? 
              `Dar ${i} ${i === 1 ? 'estrella' : 'estrellas'}` : 
              'Inicia sesión para puntuar'
            )
          }
        >
          {isPartiallyFilled ? (
            <span className="star-partial">
              ★
              <span className="star-partial-overlay" style={{ width: `${(1 - (displayRating % 1)) * 100}%` }}>
                ☆
              </span>
            </span>
          ) : (
            isFilled ? '★' : '☆'
          )}
        </button>
      );
    }
    
    return stars;
  };

  return (
    <div className={`star-rating ${size}`}>
      <div className="stars-container">
        {renderStars()}
        {isSubmitting && <span className="rating-spinner">⟳</span>}
      </div>
      
      {showCount && (
        <div className="rating-info">
          <span className="average-rating">
            {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
          </span>
          <span className="rating-count">
            ({totalRatings} {totalRatings === 1 ? 'voto' : 'votos'})
          </span>
        </div>
      )}
      
      {!readonly && !isAuthenticated && (
        <div className="login-prompt">
          <small>Inicia sesión para puntuar</small>
        </div>
      )}
      
      {!readonly && isAuthenticated && currentUserRating && (
        <div className="user-rating-info">
          <small>Tu puntuación: {currentUserRating} ★</small>
        </div>
      )}
    </div>
  );
};

export default StarRating; 