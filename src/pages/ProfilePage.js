import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';
import config from '../config/api';

const ProfilePage = () => {
  const { isAuthenticated, currentUser, token, updateProfile } = useAuth();
  const [isAuthor, setIsAuthor] = useState(false);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState('error');
  const fileInputRef = useRef(null);
  
  // Form states
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    subscribed: false
  });
  
  const [authorForm, setAuthorForm] = useState({
    bio: ''
  });
  
  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form submission state
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
  
  // Fetch user data and author profile if available
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated || !token) {
        setLoading(false);
        return;
      }
      
      // Set user form with current user data
      if (currentUser) {
        setUserForm({
          name: currentUser.name || '',
          email: currentUser.email || '',
          subscribed: currentUser.subscribed !== false // Default to true if not specified
        });
      }
      
      try {
        // Check if user is an author
        const response = await fetch(config.getApiUrl('/api/authors/profile'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsAuthor(true);
          setAuthorProfile(data);
          
          // Set author form with current author data
          setAuthorForm({
            bio: data.bio || ''
          });
          
          // Set image preview if there is a profile image
          if (data.profileImage) {
            setImagePreview(data.profileImage);
          }
        } else if (response.status === 403) {
          // User is not an author - this is a valid state
          setIsAuthor(false);
          setAuthorProfile(null);
        } else if (response.status !== 404) {
          // If there's an error other than "not found" or "forbidden"
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to check author status');
        }
      } catch (err) {
        setErrorWithType('Server connection error. Please try again later.', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [isAuthenticated, currentUser, token]);
  
  // Handle user form changes
  const handleUserFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
  
  // Upload image to server
  const uploadImageToCloudinary = async () => {
    if (!imageFile) return null;
    
    setUploadingImage(true);
    setErrorWithType(null);
    
    try {
      // Check if server is running
      try {
        const pingResponse = await fetch(config.getApiUrl('/api'), { 
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        
        if (!pingResponse.ok) {
          throw new Error('Backend server is not responding');
        }
      } catch (err) {
        console.error('Server connection error:', err);
        throw new Error('Cannot connect to the backend server. Please make sure it is running.');
      }
      
      // Create form data for image upload
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // Send to our backend endpoint that will handle Cloudinary upload
      const uploadResponse = await fetch(config.getApiUrl('/api/upload/image'), {
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
      setErrorWithType('Server connection error. Please try again later.', 'error');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Handle user profile update
  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorWithType(null);
    
    try {
      await updateProfile(userForm);
      
      // Show success message
      setErrorWithType('Profile updated successfully!', 'success');
      
    } catch (err) {
      console.error('Profile update error:', err);
      setErrorWithType(err.message || 'Failed to update profile', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Handle author profile update
  const handleAuthorFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorWithType(null);
    
    try {
      // First upload image if there is one
      let profileImage = authorProfile?.profileImage;
      
      if (imageFile) {
        try {
          const uploadedImageUrl = await uploadImageToCloudinary();
          if (uploadedImageUrl) {
            profileImage = uploadedImageUrl;
          } else {
            // Image upload failed but we can continue with profile update
            setErrorWithType('Profile image upload failed, but your profile will still be updated.', 'warning');
          }
        } catch (imgErr) {
          console.error('Image upload failed:', imgErr);
          setErrorWithType('Could not upload your profile image, but we will still update your profile.', 'warning');
        }
      }
      
      // Create author data object
      const authorData = {
        bio: authorForm.bio
      };
      
      if (profileImage) {
        authorData.profileImage = profileImage;
      }
      
      const response = await fetch(config.getApiUrl('/api/authors/profile'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(authorData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update author profile');
      }
      
      const data = await response.json();
      setAuthorProfile(data);
      
      // Show success message
      setErrorWithType('Author profile updated successfully!', 'success');
      
    } catch (err) {
      console.error('Author profile update error:', err);
      setErrorWithType(err.message || 'Failed to update author profile', 'error');
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
      <div className="profile-page">
        <div className="container">
          <h2>Loading your profile...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>Edit Profile</h1>
        </div>
        
        {error && (
          <div className={`profile-message ${errorType}`}>
            <span className="message-text">{error}</span>
            <button className="message-close" onClick={clearError}>×</button>
          </div>
        )}
        
        <div className="profile-container">
          {/* User Profile Section */}
          <div className="profile-section">
            <h2>User Profile</h2>
            <div className="form-section">
              <h2>User Information</h2>
              <p className="section-description">Update your basic account information</p>
              
              <form onSubmit={handleUserFormSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Display Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={userForm.name}
                    onChange={handleUserFormChange}
                    required
                    placeholder="Name you want displayed publicly"
                  />
                  <small className="form-hint">This will be visible to other users. You can use a pseudonym to remain anonymous.</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userForm.email}
                    onChange={handleUserFormChange}
                    required
                    placeholder="Your email address"
                  />
                  <small>This email will be used for login and notifications.</small>
                </div>
                
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="subscribed"
                    name="subscribed"
                    checked={userForm.subscribed}
                    onChange={handleUserFormChange}
                  />
                  <label htmlFor="subscribed">Subscribe to newsletter and updates</label>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Author Profile Section - Only shown if user is an author */}
          {isAuthor && (
            <div className="profile-section author-profile-section">
              <h2>Author Profile</h2>
              <form className="profile-form" onSubmit={handleAuthorFormSubmit}>
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
                  <small className="image-upload-help">This image will be displayed with your articles</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="bio">Author Bio</label>
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
                    type="submit" 
                    className="btn btn-primary"
                    disabled={formSubmitting || uploadingImage}
                  >
                    {formSubmitting ? 'Saving...' : 'Save Author Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Danger Zone */}
          <div className="profile-section">
            <div className="danger-zone">
              <h3>Danger Zone</h3>
              <p>These actions cannot be undone. Please be certain.</p>
              
              <button className="btn btn-danger">Delete Account</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 