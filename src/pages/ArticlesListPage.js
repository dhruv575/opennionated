import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ArticlesListPage.css';
import { trackEvent } from '../utils/analytics';
import config from '../config/api';
const ArticlesListPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(['All']);
  
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

  // Helper function to get author name
  const getAuthorName = (article) => {
    return article.author_name || article.author_email.split('@')[0];
  };

  // Track read more clicks
  const handleReadMoreClick = (articleTitle) => {
    trackEvent({
      category: 'Article',
      action: 'Click Read More',
      label: articleTitle
    });
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(config.getApiUrl('/api/articles'));
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // Process the received data
        setArticles(data);
        
        // Sort by creation date (newest first)
        setArticles([...data].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ));
        
        // Extract categories
        const allCategories = [];
        data.forEach(article => {
          if (article.categories && article.categories.length > 0) {
            article.categories.forEach(category => {
              if (!allCategories.includes(category)) {
                allCategories.push(category);
              }
            });
          }
        });
        setCategories(['All', ...allCategories.sort()]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="articles-list-page loading">
        <div className="container">
          <div className="articles-loading">
            <h2>Loading articles...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="articles-list-page error">
        <div className="container">
          <div className="articles-error">
            <h2>Error</h2>
            <p>{error}</p>
            <Link to="/" className="btn btn-primary">Go to Homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="articles-list-page">
      <div className="container">
        <div className="articles-header">
          <h1>Latest Articles</h1>
          <p className="articles-subtitle">Explore thoughtful perspectives from the Penn community</p>
        </div>
        
        {articles.length > 0 ? (
          <div className="articles-grid">
            {articles.map(article => (
              <div className="article-card" key={article._id}>
                {article.image ? (
                  <div className="article-card-image">
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
                  <div className="article-card-image-placeholder"></div>
                )}
                
                <div className="article-card-content">
                  <h2>{article.title}</h2>
                  <p className="article-card-description">
                    {article.description || article.content.substring(0, 150) + '...'}
                  </p>
                  <div className="article-card-meta">
                    <span className="article-card-author">
                      <Link to={`/authors/${article.author_email}`}>
                        <span className="author-prefix">By </span>{getAuthorName(article)}
                      </Link>
                    </span>
                    <span className="article-card-date">
                      <span className="date-separator">·</span>
                      {new Date(article.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric',
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <Link 
                    to={`/articles/${article.slug}`} 
                    className="btn btn-secondary"
                    onClick={() => handleReadMoreClick(article.title)}
                  >
                    Read More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-articles">
            <h2>No articles found</h2>
            <p>Be the first to contribute by writing an article!</p>
            <Link to="/articles/new" className="btn btn-primary">Write an Article</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesListPage; 