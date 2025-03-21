import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './AuthorProfilePage.css';
import config from '../config/api';

const AuthorProfilePage = () => {
  const { email } = useParams();
  const [author, setAuthor] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Format date helper function
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const fetchAuthorAndArticles = async () => {
      try {
        setLoading(true);
        
        // Fetch author profile
        const authorResponse = await fetch(config.getApiUrl(`/api/authors/profile/${email}`));
        
        if (!authorResponse.ok) {
          throw new Error('Author not found');
        }
        
        const authorData = await authorResponse.json();
        setAuthor(authorData);
        
        // Fetch author's approved articles
        const articlesResponse = await fetch(config.getApiUrl(`/api/articles?author=${email}&approved=true`));
        
        if (articlesResponse.ok) {
          const articlesData = await articlesResponse.json();
          
          // Sort articles by date (newest first)
          const sortedArticles = articlesData.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          
          setArticles(sortedArticles);
        }
      } catch (err) {
        console.error('Error fetching author profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (email) {
      fetchAuthorAndArticles();
    }
  }, [email]);

  if (loading) {
    return (
      <div className="author-profile-page loading">
        <div className="container">
          <div className="loading-indicator">Loading author profile...</div>
        </div>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="author-profile-page error">
        <div className="container">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error || "Author not found"}</p>
            <Link to="/" className="btn btn-primary">Go to Homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  // Display author name and profile
  const authorName = author.name || email.split('@')[0];
  const profileImage = author.pfp || null;

  return (
    <div className="author-profile-page">
      <div className="container">
        <div className="author-header">
          <div className="author-profile-info">
            {profileImage ? (
              <div className="author-profile-image">
                <img src={getValidImageUrl(profileImage)} alt={authorName} />
              </div>
            ) : (
              <div className="author-profile-initial">{authorName.charAt(0).toUpperCase()}</div>
            )}
            
            <div className="author-profile-details">
              <h1 className="author-profile-name">{authorName}</h1>
              <div className="author-profile-status">Writer at Opennionated</div>
            </div>
          </div>
        </div>

        <div className="author-bio">
          <h2>About</h2>
          <p>{author.bio || "No bio available."}</p>
        </div>

        <div className="author-articles">
          <h2>Articles by {authorName}</h2>
          
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
                    <h3>{article.title}</h3>
                    <p className="article-card-description">
                      {article.description || article.content?.substring(0, 150) + '...'}
                    </p>
                    <div className="article-card-meta">
                      <span className="article-card-date">
                        {formatDate(article.createdAt)}
                      </span>
                    </div>
                    <Link to={`/articles/${article.slug}`} className="btn btn-secondary">Read More</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-articles">
              <p>This author hasn't published any articles yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthorProfilePage; 