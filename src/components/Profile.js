import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { getCurrentUser, logout } from '../services/authService';
import { getMyStories } from '../services/storyService';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';
import SEO from './SEO';
import StarRating from './StarRating';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setUser: setAuthUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [storiesRemaining, setStoriesRemaining] = useState(null);
  
  // New states for user stories
  const [userStories, setUserStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [storiesError, setStoriesError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showStories, setShowStories] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // Calcular cuentos restantes
        if (currentUser) {
          await fetchStoriesRemaining(currentUser);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setError(t('profile.error'));
      }
    };
    loadUser();
  }, [t]);

  // Load user stories
  const loadUserStories = async (page = 1) => {
    setStoriesLoading(true);
    setStoriesError('');
    
    try {
      console.log('Loading user stories, page:', page);
      const response = await getMyStories(page, 6); // Load 6 stories per page
      
      console.log('User stories response:', response);
      
      if (page === 1) {
        setUserStories(response.stories || []);
      } else {
        setUserStories(prev => [...prev, ...(response.stories || [])]);
      }
      
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading user stories:', error);
      
      // Provide more specific error messages based on the error type
      let errorMessage = t('profile.stories.error');
      
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = i18n.language === 'es' 
          ? 'No se puede conectar al servidor. Por favor, verifica tu conexión a internet.' 
          : 'Cannot connect to server. Please check your internet connection.';
      } else if (error.response?.status === 401) {
        errorMessage = i18n.language === 'es' 
          ? 'Sesión expirada. Por favor, inicia sesión nuevamente.' 
          : 'Session expired. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = i18n.language === 'es' 
          ? 'No tienes permisos para ver estas historias.' 
          : 'You do not have permission to view these stories.';
      } else if (error.response?.status >= 500) {
        errorMessage = i18n.language === 'es' 
          ? 'El servidor está experimentando problemas. Por favor, intenta más tarde.' 
          : 'The server is experiencing issues. Please try again later.';
      }
      
      setStoriesError(errorMessage);
    } finally {
      setStoriesLoading(false);
    }
  };

  // Handle show stories toggle
  const handleShowStories = () => {
    if (!showStories && userStories.length === 0) {
      loadUserStories(1);
    }
    setShowStories(!showStories);
  };

  // Handle load more stories
  const handleLoadMore = () => {
    if (pagination && pagination.hasNext) {
      loadUserStories(currentPage + 1);
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const fetchStoriesRemaining = async (currentUser) => {
    try {
      // Calculate locally from user data instead of making server request
      const userData = currentUser.data || currentUser;
      
      console.log('📊 Calculating stories remaining locally:', {
        email: userData.email,
        storiesGenerated: userData.storiesGenerated,
        monthlyStoriesGenerated: userData.monthlyStoriesGenerated,
        subscriptionStatus: userData.subscriptionStatus
      });
      
      let remaining;
      if (userData.subscriptionStatus === 'active') {
        remaining = Math.max(0, 30 - (userData.monthlyStoriesGenerated || 0));
      } else {
        remaining = Math.max(0, 3 - (userData.storiesGenerated || 0));
      }
      
      setStoriesRemaining(remaining);
      console.log('✅ Stories remaining calculated:', remaining);
      
    } catch (error) {
      console.error('Error calculating stories remaining:', error);
      // Default fallback
      const userData = currentUser.data || currentUser;
      if (userData.subscriptionStatus === 'active') {
        setStoriesRemaining(30 - (userData.monthlyStoriesGenerated || 0));
      } else {
        setStoriesRemaining(3 - (userData.storiesGenerated || 0));
      }
    }
  };

  const handleLogout = () => {
    logout();
    setAuthUser(null);
    navigate('/login');
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/subscription/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(t('profile.subscriptionCancelled'));
        // Update user state
        const userData = user.data || user;
        const updatedUser = { ...user, data: { ...userData, subscriptionStatus: 'cancelled', isPremium: false } };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      setError(err.response?.data?.message || t('profile.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="profile-container">{t('profile.loading')}</div>;
  }

  // Get user data from the correct location (handle both nested and flat structures)
  const userData = user.data || user;

  // Textos para el contador de cuentos
  const storiesRemainingLabel = i18n.language === 'es' ? 'Cuentos Disponibles' : 'Available Stories';
  const storiesOfText = i18n.language === 'es' ? 'de' : 'of';
  const totalStories = userData.subscriptionStatus === 'active' ? '30' : '3';

  return (
    <div className="profile-container">
      <SEO 
        title={i18n.language === 'es' ? 
          'Mi Perfil - AudioGretel' : 
          'My Profile - AudioGretel'}
        description={i18n.language === 'es' ? 
          'Gestiona tu perfil y suscripción en AudioGretel. Consulta tus cuentos disponibles y opciones de cuenta.' : 
          'Manage your profile and subscription in AudioGretel. Check your available stories and account options.'}
        keywords={['perfil usuario', 'cuenta', 'suscripción', 'cuentos disponibles', 'gestión de cuenta']}
        lang={i18n.language}
      />
      
      <div className="profile-card">
        <h1 className="profile-title">{t('profile.title')}</h1>
        
        <div className="profile-info">
          <div className="info-group">
            <label>{t('profile.email')}</label>
            <p>{userData.email}</p>
          </div>
          
          <div className="info-group">
            <label>{t('profile.subscriptionStatus')}</label>
            <p className={`status ${userData.subscriptionStatus || 'free'}`}>
              {userData.subscriptionStatus && t(`profile.subscription${userData.subscriptionStatus.charAt(0).toUpperCase() + userData.subscriptionStatus.slice(1)}`)}
              {userData.isPremium && ' (Premium)'}
            </p>
          </div>
          
          <div className="info-group">
            <label>{storiesRemainingLabel}</label>
            <p className="stories-count">
              {storiesRemaining !== null ? (
                <span>
                  <strong>{storiesRemaining}</strong> {storiesOfText} <strong>{totalStories}</strong>
                </span>
              ) : (
                t('profile.loading')
              )}
            </p>
          </div>
        </div>

        {userData.subscriptionStatus === 'active' && (
          <div className="subscription-actions">
            <button
              className="cancel-button"
              onClick={handleCancelSubscription}
              disabled={loading}
            >
              {loading ? t('profile.loading') : t('profile.cancelSubscription')}
            </button>
            <p className="cancel-info">{t('profile.cancelInfo')}</p>
          </div>
        )}

        {!userData.isPremium && (
          <div className="subscription-actions">
            <Link to="/subscribe" className="premium-button">
              {t('subscription.subscribeButton')}
            </Link>
            <p className="premium-info">
              {t('profile.premiumInfo')}
              <Link to="/subscribe"> {t('profile.learnMore')}</Link>
            </p>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {/* My Stories Section */}
        <div className="my-stories-section">
          <div className="stories-header">
            <h2 className="stories-title">
              {i18n.language === 'es' ? 'Mis Cuentos' : 'My Stories'}
            </h2>
            <button 
              className="toggle-stories-btn"
              onClick={handleShowStories}
              disabled={storiesLoading}
            >
              {showStories ? 
                (i18n.language === 'es' ? 'Ocultar' : 'Hide') : 
                (i18n.language === 'es' ? 'Ver Mis Cuentos' : 'View My Stories')
              }
            </button>
          </div>

          {showStories && (
            <div className="stories-content">
              {storiesError && (
                <div className="error-message stories-error">
                  {storiesError}
                </div>
              )}

              {storiesLoading && userStories.length === 0 && (
                <div className="stories-loading">
                  {i18n.language === 'es' ? 'Cargando cuentos...' : 'Loading stories...'}
                </div>
              )}

              {userStories.length > 0 && (
                <div className="stories-grid">
                  {userStories.map((story, index) => (
                    <div key={story._id} className="story-card-wrapper">
                      <Link 
                        to={`/story-examples?storyId=${story._id}&autoPlay=audio`}
                        className="story-card-link"
                        title={i18n.language === 'es' ? 'Escuchar historia' : 'Listen to story'}
                      >
                        <div className="story-card">
                          <div className="story-card-header">
                            <h4 className="story-card-title">{story.title}</h4>
                            {story.createdAt && !isNaN(new Date(story.createdAt)) && (
                              <span className="story-card-date">
                                {new Date(story.createdAt).toLocaleDateString(
                                  i18n.language === 'es' ? 'es-ES' : 'en-US'
                                )}
                              </span>
                            )}
                          </div>
                          <div className="story-card-content">
                            <p className="story-card-preview">
                              {story.content.slice(0, 150)}...
                            </p>
                            <div className="story-card-metadata">
                              <span className="story-metadata-item">
                                {i18n.language === 'es' ? 'Idioma' : 'Language'}: {story.language?.toUpperCase() || 'ES'}
                              </span>
                              {story.ageGroup && (
                                <span className="story-metadata-item">
                                  {i18n.language === 'es' ? 'Edad' : 'Age'}: {story.ageGroup}
                                </span>
                              )}
                              {story.audioGenerations > 0 && (
                                <span className="story-metadata-item audio-indicator">
                                  🎵 {i18n.language === 'es' ? 'Con audio' : 'Has audio'}
                                </span>
                              )}
                            </div>
                            
                            {/* Story Rating */}
                            <div className="story-card-rating">
                              <StarRating
                                storyId={story._id}
                                averageRating={story.averageRating || 0}
                                totalRatings={story.totalRatings || 0}
                                userRating={story.userRating || null}
                                size="small"
                                showCount={true}
                                readonly={false}
                              />
                            </div>
                          </div>
                          <div className="story-card-footer">
                            <span className="view-story-text">
                              {i18n.language === 'es' ? 'Hacer clic para escuchar →' : 'Click to listen →'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {pagination && pagination.hasNext && (
                <div className="load-more-container">
                  <button 
                    className="load-more-btn"
                    onClick={handleLoadMore}
                    disabled={storiesLoading}
                  >
                    {storiesLoading ? 
                      (i18n.language === 'es' ? 'Cargando...' : 'Loading...') :
                      (i18n.language === 'es' ? 'Cargar Más' : 'Load More')
                    }
                  </button>
                </div>
              )}

              {pagination && pagination.totalStories === 0 && !storiesLoading && (
                <div className="no-stories">
                  {i18n.language === 'es' ? 
                    'Aún no has generado ningún cuento. ¡Crea tu primer cuento ahora!' :
                    'You haven\'t generated any stories yet. Create your first story now!'
                  }
                </div>
              )}

              {pagination && (
                <div className="stories-pagination-info">
                  {i18n.language === 'es' ? 
                    `Mostrando ${userStories.length} de ${pagination.totalStories} cuentos` :
                    `Showing ${userStories.length} of ${pagination.totalStories} stories`
                  }
                </div>
              )}
            </div>
          )}
        </div>

        <div className="logout-container">
          <button onClick={handleLogout} className="logout-button">
            {t('navbar.logout')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile; 