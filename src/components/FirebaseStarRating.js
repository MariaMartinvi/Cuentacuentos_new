import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { rateFirebaseStory, getUserRatingForStory } from '../services/firebaseRatingService';
import './StarRating.css';

const FirebaseStarRating = ({ 
  storyId, 
  averageRating = 0, 
  totalRatings = 0, 
  onRatingChange,
  readonly = false,
  showCount = true,
  size = 'medium'
}) => {
  const { user, isAuthenticated } = useAuth();
  const [hoveredRating, setHoveredRating] = useState(0);
  const [currentUserRating, setCurrentUserRating] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStats, setCurrentStats] = useState({
    averageRating,
    totalRatings
  });

  console.log('🌟 [FirebaseStarRating] Component mounted:', { 
    storyId, 
    averageRating, 
    totalRatings, 
    isAuthenticated,
    readonly,
    user: user ? {
      uid: user.uid,
      id: user.id,
      email: user.email,
      keys: Object.keys(user)
    } : null
  });

  useEffect(() => {
    // Actualizar stats cuando cambien las props
    setCurrentStats({
      averageRating,
      totalRatings
    });
  }, [averageRating, totalRatings]);

  useEffect(() => {
    // Cargar rating del usuario si está autenticado
    const loadUserRating = async () => {
      if (isAuthenticated && user && storyId) {
        try {
          // Get user ID - try uid first (Firebase), then id (custom)
          const userId = user.uid || user.id || user._id;
          
          if (!userId) {
            console.warn('🌟 [FirebaseStarRating] No user ID found for loading rating');
            return;
          }
          
          console.log('🌟 [FirebaseStarRating] Loading user rating for:', { storyId, userId });
          const userRating = await getUserRatingForStory(storyId, userId);
          console.log('🌟 [FirebaseStarRating] User rating loaded:', userRating);
          setCurrentUserRating(userRating);
        } catch (error) {
          console.error('🌟 [FirebaseStarRating] Error loading user rating:', error);
          setCurrentUserRating(null);
        }
      }
    };

    loadUserRating();
  }, [isAuthenticated, user, storyId]);

  const handleStarClick = async (rating) => {
    if (readonly || !isAuthenticated || !user || isSubmitting) {
      console.log('🌟 [FirebaseStarRating] Click ignored:', { 
        readonly, 
        isAuthenticated, 
        hasUser: !!user, 
        isSubmitting 
      });
      return;
    }

    // Get user ID - try uid first (Firebase), then id (custom)
    const userId = user.uid || user.id || user._id;
    
    if (!userId) {
      console.error('🌟 [FirebaseStarRating] No user ID found:', user);
      alert('Error: No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.');
      return;
    }

    console.log('🌟 [FirebaseStarRating] Rating story:', { storyId, rating, userId, userObject: user });

    setIsSubmitting(true);
    try {
      const result = await rateFirebaseStory(storyId, rating, userId);
      console.log('🌟 [FirebaseStarRating] Rating successful:', result);

      // Actualizar estado local
      setCurrentUserRating(rating);
      setCurrentStats({
        averageRating: result.averageRating,
        totalRatings: result.totalRatings
      });

      // Notificar al componente padre
      if (onRatingChange) {
        onRatingChange(result);
      }

    } catch (error) {
      console.error('🌟 [FirebaseStarRating] Error rating story:', error);
      alert(`Error al calificar la historia: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarHover = (rating) => {
    if (!readonly && isAuthenticated) {
      setHoveredRating(rating);
    }
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const displayRating = hoveredRating || currentUserRating || 0;
  const starsToShow = Math.max(hoveredRating, 0);

  return (
    <div className={`star-rating ${size} ${readonly ? 'readonly' : ''} ${isSubmitting ? 'submitting' : ''}`}>
      <div className="stars-container" onMouseLeave={handleStarLeave}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${
              (hoveredRating >= star || (hoveredRating === 0 && currentUserRating >= star)) 
                ? 'filled' 
                : currentStats.averageRating >= star 
                ? 'average-filled' 
                : ''
            } ${isSubmitting ? 'disabled' : ''}`}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            disabled={readonly || !isAuthenticated || isSubmitting}
            aria-label={`Rate ${star} stars`}
            title={
              !isAuthenticated 
                ? 'Inicia sesión para calificar' 
                : readonly 
                ? 'Solo lectura' 
                : `Calificar ${star} estrella${star > 1 ? 's' : ''}`
            }
          >
            <span className="star-icon">★</span>
          </button>
        ))}
      </div>

      {showCount && (
        <div className="rating-info">
          <span className="average-rating">
            {currentStats.averageRating > 0 ? currentStats.averageRating.toFixed(1) : '0.0'}
          </span>
          <span className="rating-count">
            ({currentStats.totalRatings} {currentStats.totalRatings === 1 ? 'voto' : 'votos'})
          </span>
        </div>
      )}

      {!isAuthenticated && !readonly && (
        <div className="auth-prompt">
          <small>Inicia sesión para calificar</small>
        </div>
      )}

      {isSubmitting && (
        <div className="rating-loading">
          <small>Guardando...</small>
        </div>
      )}
    </div>
  );
};

export default FirebaseStarRating; 