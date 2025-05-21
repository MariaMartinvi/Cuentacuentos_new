import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/blogPost.css';

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

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const BlogPost = () => {
  const { id } = useParams();
  const { t } = useTranslation();

  // En una implementación real, esto vendría de una API o CMS
  const post = {
    id: id,
    title: t(`blog.posts.${id}.title`),
    content: t(`blog.posts.${id}.content`),
    author: t(`blog.posts.${id}.author`),
    date: t(`blog.posts.${id}.date`),
    category: t(`blog.posts.${id}.category`),
    image: id === '1' ? '/aprender.jpg' : id === '2' ? '/historias.jpg' : '/Garcia.jpg',
    readingTime: t(`blog.posts.${id}.readingTime`),
    tags: t(`blog.posts.${id}.tags`, { returnObjects: true })
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = post.title;
    let shareUrl;

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <article className="blog-post">
      <header className="post-header">
        <div className="post-meta">
          <span className="post-category">{post.category}</span>
          <span className="post-date">
            <CalendarIcon /> {post.date}
          </span>
          <span className="post-reading-time">
            <ClockIcon /> {post.readingTime}
          </span>
        </div>
        <h1>{post.title}</h1>
        <div className="post-author">
          <img 
            src={`/authors/${post.author.toLowerCase().replace(' ', '-')}.jpg`} 
            alt={post.author}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/authors/default-author.jpg';
            }}
          />
          <span>
            <UserIcon /> {post.author}
          </span>
        </div>
      </header>

      <div className="post-image">
        <img src={post.image} alt={post.title} />
      </div>

      <div className="post-content">
        {post.content.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="post-tags">
        {post.tags.map((tag, index) => (
          <span key={index} className="tag">
            #{tag}
          </span>
        ))}
      </div>

      <div className="post-share">
        <h3>{t('blog.share')}</h3>
        <div className="share-buttons">
          <button 
            className="share-button facebook"
            onClick={() => handleShare('facebook')}
            aria-label="Share on Facebook"
          >
            <FacebookIcon />
          </button>
          <button 
            className="share-button twitter"
            onClick={() => handleShare('twitter')}
            aria-label="Share on Twitter"
          >
            <TwitterIcon />
          </button>
          <button 
            className="share-button linkedin"
            onClick={() => handleShare('linkedin')}
            aria-label="Share on LinkedIn"
          >
            <LinkedInIcon />
          </button>
          <button 
            className="share-button whatsapp"
            onClick={() => handleShare('whatsapp')}
            aria-label="Share on WhatsApp"
          >
            <WhatsAppIcon />
          </button>
        </div>
      </div>

      <div className="related-posts">
        <h3>{t('blog.relatedPosts')}</h3>
        <div className="related-posts-grid">
          {/* Aquí irían los posts relacionados */}
        </div>
      </div>

      <div className="newsletter-cta">
        <h3>{t('blog.newsletter.title')}</h3>
        <p>{t('blog.newsletter.description')}</p>
        <form className="newsletter-form">
          <input type="email" placeholder={t('blog.newsletter.placeholder')} />
          <button type="submit">{t('blog.newsletter.subscribe')}</button>
        </form>
      </div>
    </article>
  );
};

export default BlogPost; 