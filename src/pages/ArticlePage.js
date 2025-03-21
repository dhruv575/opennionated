import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ArticlePage.css';
import ReactMarkdown from 'react-markdown';
import { trackEvent } from '../utils/analytics';
import config from '../config/api';

const ArticlePage = () => {
  const { slug } = useParams();
  const { isAuthenticated, token, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [article, setArticle] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthor, setIsAuthor] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        
        // Fetch the article data
        const response = await fetch(config.getApiUrl(`/api/articles/${slug}`));
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Article not found');
          } else {
            throw new Error('Failed to fetch article');
          }
        }
        
        const data = await response.json();
        setArticle(data);
        
        // Track article view with Google Analytics
        trackEvent({
          category: 'Article',
          action: 'View',
          label: data.title,
          value: 1 // Count as 1 view
        });
        
        // Check if current user is the author
        if (isAuthenticated && currentUser?.email === data.author_email) {
          setIsAuthor(true);
        }
        
        // Fetch author details
        try {
          const authorResponse = await fetch(config.getApiUrl(`/api/authors/profile/${data.author_email}`));
          if (authorResponse.ok) {
            const authorData = await authorResponse.json();
            setAuthor(authorData);
          }
        } catch (authorErr) {
          console.error('Error fetching author details:', authorErr);
        }
        
      } catch (err) {
        console.error('Error fetching article:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (slug) {
      fetchArticle();
    }
  }, [slug, isAuthenticated, currentUser, token]);

  // Add this helper function after the useState declarations
  const getValidImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    
    // Check if the URL is relative (doesn't have http/https)
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      // If it's a relative URL, add the backend URL
      return `${config.API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }
    
    return imageUrl;
  };

  // Get author name helper function
  const getAuthorName = (article, author) => {
    if (author && author.name) {
      return author.name;
    }
    return article.author_name || article.author_email.split('@')[0];
  };

  if (loading) {
    return (
      <div className="article-page loading">
        <div className="container">
          <div className="article-loading">
            <h2>Loading article...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="article-page error">
        <div className="container">
          <div className="article-error">
            <h2>Error</h2>
            <p>{error}</p>
            <Link to="/" className="btn btn-primary">Go to Homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="article-page not-found">
        <div className="container">
          <div className="article-not-found">
            <h2>Article Not Found</h2>
            <p>The article you're looking for doesn't exist or has been removed.</p>
            <Link to="/" className="btn btn-primary">Go to Homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if the article is approved or the current user is the author
  const canViewArticle = article.approved || isAuthor;

  if (!canViewArticle) {
    return (
      <div className="article-page not-approved">
        <div className="container">
          <div className="article-not-approved">
            <h2>Article Not Available</h2>
            <p>This article is currently under review and not yet published.</p>
            <Link to="/" className="btn btn-primary">Go to Homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="article-page">
      <div className="container">
        {!article.approved && isAuthor && (
          <div className="article-status-banner">
            <p>
              <span className="status-icon">⚠️</span>
              This article is still in the approval process and is only visible to you.
            </p>
          </div>
        )}
        
        <div className="article-header">
          <h1>{article.title}</h1>
          
          <div className="article-meta">
            <div className="author-info">
              <Link to={`/authors/${article.author_email}`}>
                {author?.profileImage ? (
                  <img src={author.profileImage} alt="Author" className="author-image" />
                ) : (
                  <div className="author-initial">{article.author_email.charAt(0).toUpperCase()}</div>
                )}
                <div className="author-details">
                  <span className="author-name">
                    <span className="author-prefix">By </span>{getAuthorName(article, author)}
                  </span>
                  <span className="article-date">
                    <span className="date-separator">·</span>
                    {new Date(article.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </Link>
            </div>
            
            {article.approved ? (
              <span className="article-status approved">Live</span>
            ) : (
              <span className="article-status pending">In Approval Process</span>
            )}
          </div>
        </div>
        
        {article.image && (
          <div className="article-image">
            <img src={getValidImageUrl(article.image)} alt={article.title} />
          </div>
        )}
        
        <div className="article-content">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>
        
        <div className="article-footer">
          <div className="article-tags">
            {article.tags && article.tags.map(tag => (
              <span key={tag} className="article-tag">{tag}</span>
            ))}
          </div>
          
          {isAuthor && (
            <div className="article-actions">
              <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticlePage; 