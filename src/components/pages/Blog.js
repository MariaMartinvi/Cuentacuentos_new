import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import config from '../../config';
import '../../styles/blog.css';
import { API_URL, API_ENDPOINTS } from '../../config/api';

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5zm2 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
  </svg>
);

const Blog = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState({ type: '', message: '' });
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = useMemo(() => [
    {
      id: 'benefits',
      title: t('blog.categories.benefits'),
      description: t('blog.categories.benefitsDesc'),
      icon: '🎯'
    },
    {
      id: 'tips',
      title: t('blog.categories.tips'),
      description: t('blog.categories.tipsDesc'),
      icon: '💡'
    },
    {
      id: 'examples',
      title: t('blog.categories.examples'),
      description: t('blog.categories.examplesDesc'),
      icon: '📚'
    },
    {
      id: 'testimonials',
      title: t('blog.categories.testimonials'),
      description: t('blog.categories.testimonialsDesc'),
      icon: '🌟'
    }
  ], [t]);

  const featuredPosts = useMemo(() => [
    {
      id: 1,
      title: t('blog.featured.earlyLearning.title'),
      excerpt: t('blog.featured.earlyLearning.excerpt'),
      category: 'benefits',
      image: '/aprender.jpg',
      date: '2024-03-20'
    },
    {
      id: 2,
      title: t('blog.featured.bedtimeStories.title'),
      excerpt: t('blog.featured.bedtimeStories.excerpt'),
      category: 'tips',
      image: '/historias.jpg',
      date: '2024-03-18'
    },
    {
      id: 3,
      title: t('blog.featured.successStory.title'),
      excerpt: t('blog.featured.successStory.excerpt'),
      category: 'testimonials',
      image: '/Garcia.jpg',
      date: '2024-03-15'
    }
  ], [t]);

  const filteredPosts = useMemo(() => {
    if (!selectedCategory) return featuredPosts;
    return featuredPosts.filter(post => post.category === selectedCategory);
  }, [featuredPosts, selectedCategory]);

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    navigate(`/blog?category=${categoryId}`);
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica del email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setNewsletterStatus({
        type: 'error',
        message: t('blog.newsletter.invalidEmail')
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}${API_ENDPOINTS.NEWSLETTER.SUBSCRIBE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en la suscripción');
      }

      setNewsletterStatus({
        type: 'success',
        message: data.message || t('blog.newsletter.success')
      });
      setEmail(''); // Limpiar el input después de una suscripción exitosa
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setNewsletterStatus({
        type: 'error',
        message: error.message || t('blog.newsletter.error')
      });
    }
  };

  return (
    <div className="blog-container">
      <header className="blog-header">
        <h1>{t('blog.title')}</h1>
        <p>{t('blog.description')}</p>
      </header>

      <section className="blog-categories">
        <h2>{t('blog.categoriesTitle')}</h2>
        <div className="categories-grid">
          {categories.map(category => (
            <div 
              key={category.id} 
              className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
              <span className="category-link">
                {t('blog.exploreCategory')} <ArrowIcon />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="featured-posts">
        <h2>{selectedCategory ? categories.find(c => c.id === selectedCategory)?.title : t('blog.featuredTitle')}</h2>
        <div className="posts-grid">
          {filteredPosts.map(post => (
            <article key={post.id} className="post-card">
              <div className="post-image">
                <img src={post.image} alt={post.title} />
                <span className="post-category">
                  {categories.find(c => c.id === post.category)?.title}
                </span>
              </div>
              <div className="post-content">
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="post-meta">
                  <span className="post-date">
                    <CalendarIcon /> {new Date(post.date).toLocaleDateString()}
                  </span>
                  <Link to={`/blog/post/${post.id}`} className="read-more">
                    {t('blog.readMore')} <ArrowIcon />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="newsletter-section">
        <div className="newsletter-content">
          <h2>{t('blog.newsletter.title')}</h2>
          <p>{t('blog.newsletter.description')}</p>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input 
              type="email" 
              placeholder={t('blog.newsletter.placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">{t('blog.newsletter.subscribe')}</button>
          </form>
          {newsletterStatus.message && (
            <div className={`newsletter-status ${newsletterStatus.type}`}>
              {newsletterStatus.message}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Blog; 