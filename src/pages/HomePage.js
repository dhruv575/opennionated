import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import { trackEvent } from '../utils/analytics';
import config from '../config/api';

const HomePage = () => {
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        
        // Fetch approved articles
        const response = await fetch(config.getApiUrl('/api/articles?approved=true'));
        
        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }
        
        const data = await response.json();
        
        // Log the first article to check its structure
        if (data.length > 0) {
          // Articles data available
        }
        
        if (data.length === 0) {
          // No articles available
          setFeaturedArticles([]);
          setRecentArticles([]);
        } else {
          // Sort articles by creation date (newest first)
          const sortedArticles = [...data].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          
          // Get the most recent articles (up to 8)
          setRecentArticles(sortedArticles.slice(0, 8));
          
          // Get 3 random articles for featured section
          // If we have 3 or fewer articles total, use all of them
          if (data.length <= 3) {
            setFeaturedArticles(data);
          } else {
            // Shuffle the array and take the first 3
            const shuffled = [...data].sort(() => 0.5 - Math.random());
            setFeaturedArticles(shuffled.slice(0, 3));
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticles();
  }, []);

  // Format date helper function
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get author name helper function
  const getAuthorName = (article) => {
    return article.author_name || article.author_email.split('@')[0];
  };

  // Helper function to validate image URLs
  const getValidImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    
    // Check if the URL is relative (doesn't have http/https)
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      // If it's a relative URL, add the backend URL
      return `${config.API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }
    
    return imageUrl;
  };

  // Track article clicks
  const handleArticleClick = (articleTitle, section) => {
    trackEvent({
      category: 'Home',
      action: `Click ${section} Article`,
      label: articleTitle
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="home-page">
        <section className="hero-section">
          <div className="hero-decoration"></div>
          <div className="container">
            <h1>Opennionated</h1>
            <p className="hero-subtitle">Share your voice. Exchange ideas. Connect with the Penn community.</p>
            <div className="hero-buttons">
              <Link to="/articles" className="btn btn-secondary">Explore Articles</Link>
              <Link to="/join" className="btn">Join the Conversation</Link>
            </div>
          </div>
        </section>
        <section className="featured-section">
          <div className="container">
            <h2 className="section-title">Featured Articles</h2>
            <div className="loading-indicator">Loading articles...</div>
          </div>
        </section>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="home-page">
        <section className="hero-section">
          <div className="hero-decoration"></div>
          <div className="container">
            <h1>Opennionated</h1>
            <p className="hero-subtitle">Share your voice. Exchange ideas. Connect with the Penn community.</p>
            <div className="hero-buttons">
              <Link to="/articles" className="btn btn-secondary">Explore Articles</Link>
              <Link to="/join" className="btn">Join the Conversation</Link>
            </div>
          </div>
        </section>
        <section className="featured-section">
          <div className="container">
            <h2 className="section-title">Featured Articles</h2>
            <div className="error-message">
              <p>Error loading articles: {error}</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-decoration"></div>
        <div className="container">
          <h1>Opennionated</h1>
          <p className="hero-subtitle">Share your voice. Exchange ideas. Connect with the Penn community.</p>
          <div className="hero-buttons">
            <Link to="/articles" className="btn btn-secondary">Explore Articles</Link>
            <Link to="/join" className="btn">Join the Conversation</Link>
          </div>
        </div>
      </section>

      {featuredArticles.length > 0 && (
        <section className="featured-section">
          <div className="container">
            <h2 className="section-title">Featured Articles</h2>
            <div className="featured-grid">
              {featuredArticles.map(article => {
                return (
                  <div key={article._id} className="featured-card">
                    {article.image ? (
                      <div className="featured-img-placeholder">
                        <img 
                          src={getValidImageUrl(article.image)} 
                          alt={article.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="featured-img-placeholder"></div>
                    )}
                    <div className="featured-content">
                      <h3>
                        <Link 
                          to={`/articles/${article.slug}`}
                          onClick={() => handleArticleClick(article.title, 'Featured')}
                        >
                          {article.title}
                        </Link>
                      </h3>
                      <p className="article-meta">
                        <Link to={`/authors/${article.author_email}`} className="author-link">{getAuthorName(article)}</Link><span className="date-separator"> · </span>{formatDate(article.createdAt)}
                      </p>
                      <p className="article-excerpt">
                        {article.description || article.content.substring(0, 150) + '...'}
                      </p>
                      <Link 
                        to={`/articles/${article.slug}`} 
                        className="read-more"
                        onClick={() => handleArticleClick(article.title, 'Featured')}
                      >
                        Read more
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {recentArticles.length > 0 && (
        <section className="recent-section">
          <div className="container">
            <h2 className="section-title">Recent Articles</h2>
            <div className="recent-grid">
              {recentArticles.map(article => (
                <div className="recent-card" key={article._id}>
                  {article.image ? (
                    <div className="recent-img-placeholder">
                      <img 
                        src={getValidImageUrl(article.image)} 
                        alt={article.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="recent-img-placeholder"></div>
                  )}
                  <h3>
                    <Link 
                      to={`/articles/${article.slug}`}
                      onClick={() => handleArticleClick(article.title, 'Recent')}
                    >
                      {article.title}
                    </Link>
                  </h3>
                  <p className="article-meta">
                    <Link to={`/authors/${article.author_email}`} className="author-link">{getAuthorName(article)}</Link><span className="date-separator"> · </span>{formatDate(article.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {featuredArticles.length === 0 && recentArticles.length === 0 && (
        <section className="featured-section">
          <div className="container">
            <h2 className="section-title">Articles</h2>
            <div className="no-articles">
              <p>No articles have been published yet. Be the first to contribute!</p>
              <Link to="/articles/new" className="btn btn-primary">Write an Article</Link>
            </div>
          </div>
        </section>
      )}

      <section className="cta-section">
        <div className="container">
          <h2>Have something to say?</h2>
          <p>Share your unique perspective with the Penn community</p>
          <Link to="/join" className="btn">Become an Author</Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 