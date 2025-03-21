import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import './DashboardPage.css';
import config from '../config/api';

const DashboardPage = () => {
  const { isAuthenticated, currentUser, token, isAuthor: authIsAuthor, updateAuthorStatus } = useAuth();
  const [authorProfile, setAuthorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState('error'); // Can be 'error', 'warning', or 'success'
  const fileInputRef = useRef(null);
  
  // Form state for author profile
  const [authorForm, setAuthorForm] = useState({
    bio: '',
    creatingProfile: false
  });
  
  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Articles data
  const [userArticles, setUserArticles] = useState([]);
  const [recentArticles, setRecentArticles] = useState([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Function to set error with type
  const setErrorWithType = (message, type = 'error') => {
    setError(message);
    setErrorType(type);
  };
  
  // Function to clear error
  const clearError = () => {
    setError(null);
  };
  
  // Check if the user is an author and fetch author profile
  useEffect(() => {
    const fetchAuthorProfile = async () => {
      if (!isAuthenticated || !token) {
        setLoading(false);
        return;
      }
      
      try {
        if (authIsAuthor) {
          // Fetch author profile
          const response = await fetch(config.getApiUrl('/api/authors/profile'), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setAuthorProfile(data);
            
            // If user is an author, fetch their articles
            try {
              const articlesResponse = await fetch(config.getApiUrl('/api/articles/my-articles'), {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (articlesResponse.ok) {
                const articlesData = await articlesResponse.json();
                setUserArticles(articlesData);
              }
            } catch (err) {
              // Handle error fetching articles
            }
          }
        }
      } catch (err) {
        setErrorWithType(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuthorProfile();
  }, [isAuthenticated, currentUser, token, authIsAuthor]);

  // Fetch recent articles for recommendations
  useEffect(() => {
    const fetchRecentArticles = async () => {
      try {
        // Fetch approved articles
        const response = await fetch(config.getApiUrl('/api/articles?approved=true&limit=2'));
        
        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }
        
        const data = await response.json();
        
        // Sort by creation date (newest first)
        const sortedArticles = [...data].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 2); // Get only the 2 most recent
        
        setRecentArticles(sortedArticles);
      } catch (err) {
        // Silently fail, not critical
        setRecentArticles([]);
      }
    };
    
    fetchRecentArticles();
  }, []);

  // Helper function to get author name with fallback
  const getAuthorName = (article) => {
    return article.author_name || article.author_email?.split('@')[0] || 'Anonymous';
  };
  
  // Helper function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
  
  // Handle author form changes
  const handleAuthorFormChange = (e) => {
    const { name, value } = e.target;
    setAuthorForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle image upload to Cloudinary
  const uploadImageToCloudinary = async () => {
    if (!imageFile) return null;
    
    setUploadingImage(true);
    setErrorWithType(null);
    
    try {
      // Check if server is running
      try {
        const pingResponse = await fetch(config.getApiUrl('/api'), { 
          method: 'GET',
          // Add a small timeout to avoid long waits
          signal: AbortSignal.timeout(3000)
        });
        
        if (!pingResponse.ok) {
          throw new Error('Backend server is not responding properly');
        }
        
        const pingData = await pingResponse.json();
      } catch (err) {
        throw new Error('Cannot connect to the backend server. Please make sure it is running.');
      }
      
      // Create form data for image upload
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // Send to our backend endpoint that will handle Cloudinary upload
      const uploadResponse = await fetch(config.getApiUrl('/api/upload/image?type=profile'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!uploadResponse.ok) {
        let errorMessage = `Image upload failed (${uploadResponse.status})`;
        
        try {
          const errorData = await uploadResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, use status text
          errorMessage = `Upload failed: ${uploadResponse.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const imageData = await uploadResponse.json();
      
      if (!imageData.success) {
        throw new Error(imageData.error || 'Image upload failed');
      }
      
      return imageData.data.url;
    } catch (err) {
      setErrorWithType(err.message || 'Failed to upload profile image. Please try again.', 'error');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Handle author profile creation
  const handleAuthorSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorWithType(null);
    
    try {
      // First upload image if there is one
      let profileImage = null;
      if (imageFile) {
        try {
          profileImage = await uploadImageToCloudinary();
          if (!profileImage) {
            // Image upload failed but we can continue with profile creation
            setErrorWithType('Profile image upload failed, but your profile will still be created.', 'warning');
          }
        } catch (imgErr) {
          setErrorWithType('Could not upload your profile image, but we will still create your profile.', 'warning');
        }
      }
      
      // Create author profile
      const authorData = {
        bio: authorForm.bio
      };
      
      // Only include profileImage if it exists
      if (profileImage) {
        authorData.profileImage = profileImage;
      }
      
      try {
        // Check if server is running
        try {
          const pingResponse = await fetch(config.getApiUrl('/api'), { 
            method: 'GET',
            signal: AbortSignal.timeout(3000)
          });
          
          if (!pingResponse.ok) {
            throw new Error('Backend server is not responding properly');
          }
          
          const pingData = await pingResponse.json();
        } catch (err) {
          throw new Error('Cannot connect to backend server');
        }
      
        const response = await fetch(config.getApiUrl('/api/authors/profile'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(authorData)
        });
        
        if (!response.ok) {
          // Try to parse error data, but handle case where it's not JSON
          try {
            const errorData = await response.json();
            const errorMessage = errorData.message || 'Failed to create author profile';
            
            // If there are validation errors, format them nicely
            if (errorData.errors && errorData.errors.length > 0) {
              const validationErrors = errorData.errors.map(err => err.msg).join('. ');
              throw new Error(`${errorMessage}: ${validationErrors}`);
            }
            
            throw new Error(errorMessage);
          } catch (jsonError) {
            // If response is not JSON
            throw new Error(`Server error (${response.status}): Could not create author profile`);
          }
        }
        
        const data = await response.json();
        updateAuthorStatus(true);
        setAuthorProfile(data);
        
        // Show success message
        setErrorWithType('Author profile created successfully!', 'success');
        
      } catch (serverErr) {
        
        // Handle server connection issues - still create local profile
        if (serverErr.message.includes('connect to backend')) {
          // Create a mock profile locally
          const mockProfile = {
            _id: 'local-' + Date.now(),
            bio: authorForm.bio,
            profileImage: profileImage || null
          };
          
          updateAuthorStatus(true);
          setAuthorProfile(mockProfile);
          setErrorWithType('Your profile was created locally, but could not be saved to the server. When the server is available, you may need to recreate your profile.', 'warning');
          
          // Reset form
          setAuthorForm(prev => ({ ...prev, creatingProfile: false }));
          return;
        }
        
        throw serverErr;
      }
    } catch (err) {
      setErrorWithType(err.message || 'Failed to create author profile', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/join" />;
  }
  
  // If still loading, show a loading message
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="container">
          <h2>Loading your dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p className="welcome-message">Welcome back, {currentUser?.name || 'User'}!</p>
        </div>
        
        {error && (
          <div className={`dashboard-message ${errorType}`}>
            <span className="message-text">{error}</span>
            <button className="message-close" onClick={clearError}>×</button>
          </div>
        )}
        
        <div className="dashboard-content">
          <div className="dashboard-sidebar">
            <div className="dashboard-profile-card">
              <div className="profile-image-placeholder">
                {authorProfile?.profileImage ? (
                  <img src={authorProfile.profileImage} alt="Profile" className="profile-image" />
                ) : (
                  currentUser?.name?.charAt(0) || 'U'
                )}
              </div>
              <h3>{currentUser?.name}</h3>
              <p>{currentUser?.email}</p>
              {authorProfile?.bio && (
                <div className="profile-bio">
                  <p>{authorProfile.bio}</p>
                </div>
              )}
              <div className="profile-status">
                {authIsAuthor ? (
                  <span className="status-badge author">Author</span>
                ) : (
                  <span className="status-badge reader">Reader</span>
                )}
              </div>
            </div>
            
            <div className="dashboard-nav">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/articles">Browse Articles</Link></li>
                {authIsAuthor && <li><Link to="/articles/new" state={{ isAuthor: true }}>Write New Article</Link></li>}
                <li><Link to="/profile">Edit Profile</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="dashboard-main">
            {authIsAuthor ? (
              // Author Dashboard Content
              <div className="author-dashboard">
                {/* Analytics Dashboard */}
                {/* 
                  Analytics Dashboard temporarily disabled.
                  We will address this feature in a future update.
                  
                  {userArticles.length > 0 && (
                    <AnalyticsDashboard authorArticles={userArticles} />
                  )}
                */}
                
                <div className="dashboard-section">
                  <div className="section-header">
                    <h2>My Articles</h2>
                    <Link to="/articles/new" state={{ isAuthor: true }} className="btn btn-primary">Write New Article</Link>
                  </div>
                  
                  {userArticles.length > 0 ? (
                    <div className="articles-grid">
                      {userArticles.map(article => (
                        <div className="article-card" key={article._id}>
                          {article.image && (
                            <div 
                              className="article-image" 
                              style={{ backgroundImage: `url(${article.image})` }}
                            ></div>
                          )}
                          {!article.image && <div className="article-image-placeholder"></div>}
                          <div className="article-card-content">
                            <h3>{article.title}</h3>
                            <p className="article-description">
                              {article.description || 'No description available'}
                            </p>
                            <p className="article-meta">
                              {new Date(article.createdAt).toLocaleDateString()} • 
                              {article.approved ? 
                                <span className="status approved">Live</span> : 
                                <span className="status pending">In Approval Process</span>
                              }
                            </p>
                            <div className="article-actions">
                              <Link 
                                to={`/articles/${article.slug}`} 
                                className="btn btn-small btn-primary"
                              >
                                View Article
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>You haven't written any articles yet.</p>
                      <Link to="/articles/new" state={{ isAuthor: true }} className="btn">Write Your First Article</Link>
                    </div>
                  )}
                </div>
                
                <div className="dashboard-section">
                  <h2>Author Stats</h2>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value">{userArticles.length}</div>
                      <div className="stat-label">Total Articles</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{userArticles.filter(a => a.approved).length}</div>
                      <div className="stat-label">Live Articles</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{userArticles.filter(a => !a.approved).length}</div>
                      <div className="stat-label">Pending Approval</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Reader Dashboard Content - Author Profile Creation
              <div className="reader-dashboard">
                <div className="dashboard-section become-author-section">
                  <h2>Become an Author</h2>
                  <p>Share your unique perspective with the Penn community.</p>
                  
                  {!authorForm.creatingProfile ? (
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setAuthorForm(prev => ({ ...prev, creatingProfile: true }))}
                    >
                      Create Author Profile
                    </button>
                  ) : (
                    <form className="author-profile-form" onSubmit={handleAuthorSubmit}>
                      <div className="image-upload-container">
                        <div 
                          className="profile-image-upload" 
                          onClick={triggerFileInput}
                          style={imagePreview ? { backgroundImage: `url(${imagePreview})` } : {}}
                        >
                          {!imagePreview && <span>Click to upload profile image</span>}
                        </div>
                        <input 
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden-file-input"
                        />
                        <small className="image-upload-help">Profile image is optional</small>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="bio">Bio</label>
                        <textarea
                          id="bio"
                          name="bio"
                          value={authorForm.bio}
                          onChange={handleAuthorFormChange}
                          required
                          placeholder="Tell readers about yourself (max 500 characters)"
                          maxLength={500}
                          rows={4}
                        ></textarea>
                      </div>
                      
                      <div className="form-actions">
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => {
                            setAuthorForm(prev => ({ ...prev, creatingProfile: false }));
                            setImagePreview(null);
                            setImageFile(null);
                          }}
                          disabled={formSubmitting || uploadingImage}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={formSubmitting || uploadingImage}
                        >
                          {formSubmitting ? 'Creating Profile...' : 'Create Profile'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
                
                <div className="dashboard-section">
                  <h2>Recommended Articles</h2>
                  <p>Explore these hand-picked articles based on your interests.</p>
                  
                  <div className="recommended-articles">
                    {recentArticles.length > 0 ? (
                      recentArticles.map(article => (
                        <div className="article-card" key={article._id}>
                          {article.image ? (
                            <div 
                              className="article-image" 
                              style={{ backgroundImage: `url(${getValidImageUrl(article.image)})` }}
                            ></div>
                          ) : (
                            <div className="article-image-placeholder"></div>
                          )}
                          <div className="article-card-content">
                            <h3>{article.title}</h3>
                            <p className="article-meta">
                              By {getAuthorName(article)} • {formatDate(article.createdAt)}
                            </p>
                            <Link 
                              to={`/articles/${article.slug}`} 
                              className="btn btn-small btn-secondary"
                            >
                              Read Article
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <p>No published articles found.</p>
                        <Link to="/articles" className="btn btn-secondary">Browse All Articles</Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 