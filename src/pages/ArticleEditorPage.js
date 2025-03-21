import React, { useState, useRef, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ArticleEditorPage.css';
import config from '../config/api';
const ArticleEditorPage = () => {
  const { isAuthenticated, currentUser, token, isAuthor } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState('error');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Form state
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: ''
  });
  
  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Function to set error with type
  const setErrorWithType = (message, type = 'error') => {
    setError(message);
    setErrorType(type);
  };
  
  // Function to clear error
  const clearError = () => {
    setError(null);
  };
  
  useEffect(() => {
    // Check author status and show warning if needed
    if (!isAuthor) {
      setErrorWithType('You need to be an author to create articles. Please create an author profile first.', 'warning');
    }
  }, [isAuthor]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setArticleForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) { // 500KB size limit
        setErrorWithType('Image is too large. Maximum size is 500KB.', 'error');
        return;
      }
      
      setImageFile(file);
      
      // Create a preview with 3:4 aspect ratio cropping
      const reader = new FileReader();
      reader.onloadend = () => {
        // Create a new image to get dimensions
        const img = new Image();
        img.onload = () => {
          // Calculate dimensions for 3:4 aspect ratio
          const targetRatio = 3 / 4; // height / width
          
          // Create canvas for cropping
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.width;
          let height = img.height;
          let x = 0;
          let y = 0;
          
          // Calculate dimensions to maintain 3:4 ratio
          const actualRatio = height / width;
          
          if (actualRatio > targetRatio) {
            // Image is taller than needed, crop top and bottom
            height = width * targetRatio;
            y = (img.height - height) / 2;
          } else {
            // Image is wider than needed, crop sides
            width = height / targetRatio;
            x = (img.width - width) / 2;
          }
          
          // Set canvas dimensions to target ratio
          canvas.width = width;
          canvas.height = height;
          
          // Draw the cropped image to the canvas
          ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
          
          // Get the cropped image data URL
          const croppedImageDataUrl = canvas.toDataURL('image/jpeg');
          setImagePreview(croppedImageDataUrl);
          
          // Convert data URL to blob for upload
          canvas.toBlob((blob) => {
            if (blob) {
              // Create a new file from the blob
              const croppedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: new Date().getTime()
              });
              setImageFile(croppedFile);
            }
          }, 'image/jpeg');
        };
        
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  // Upload image to Cloudinary
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
          throw new Error('Backend server is not responding properly');
        }
        
        const pingData = await pingResponse.json();
      } catch (err) {
        throw new Error('Cannot connect to the backend server. Please make sure it is running.');
      }
      
      // Create form data for image upload
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // Send to backend endpoint
      const uploadResponse = await fetch(config.getApiUrl('/api/upload/image?type=article'), {
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
      setErrorWithType(err.message || 'Failed to upload image. Please try again.', 'error');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!articleForm.title.trim() || articleForm.title.trim().length < 5) {
      setErrorWithType('Title must be at least 5 characters long.', 'error');
      return;
    }
    
    if (articleForm.title.trim().length > 200) {
      setErrorWithType('Title must be less than 200 characters long.', 'error');
      return;
    }
    
    if (!articleForm.content.trim() || articleForm.content.trim().length < 100) {
      setErrorWithType('Content must be at least 100 characters long.', 'error');
      return;
    }
    
    if (!imageFile) {
      setErrorWithType('Please upload a header image for your article.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    setErrorWithType(null);
    
    try {
      // First upload the image
      const imageUrl = await uploadImageToCloudinary();
      if (!imageUrl) {
        throw new Error('Failed to upload image. Please try again.');
      }
      
      // Create article data
      const articleData = {
        title: articleForm.title,
        content: articleForm.content,
        image: imageUrl
      };
      
      // Submit article
      const response = await fetch(config.getApiUrl('/api/articles'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(articleData)
      });
      
      // Get the raw response text first
      const responseText = await response.text();
      
      // Try to parse the JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Server returned invalid response: ${responseText.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        // Handle validation errors from the server
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map(err => err.msg).join('. ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        throw new Error(data.message || `Failed to create article (${response.status})`);
      }
      
      // Show success message
      setErrorWithType('Article submitted successfully! It is now being reviewed.', 'success');
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      setErrorWithType(err.message || 'Failed to submit article. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Insert markdown formatting
  const insertMarkdown = (type) => {
    const textarea = document.getElementById('content');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = articleForm.content.substring(start, end);
    let insertion = '';
    
    switch (type) {
      case 'h1':
        insertion = `# ${selectedText}`;
        break;
      case 'h2':
        insertion = `## ${selectedText}`;
        break;
      case 'h3':
        insertion = `### ${selectedText}`;
        break;
      case 'bold':
        insertion = `**${selectedText}**`;
        break;
      case 'italic':
        insertion = `*${selectedText}*`;
        break;
      case 'quote':
        insertion = `> ${selectedText}`;
        break;
      case 'code':
        insertion = `\`${selectedText}\``;
        break;
      case 'link':
        insertion = `[${selectedText}](url)`;
        break;
      case 'ul':
        insertion = `- ${selectedText}`;
        break;
      case 'ol':
        insertion = `1. ${selectedText}`;
        break;
      default:
        insertion = selectedText;
    }
    
    const newContent = articleForm.content.substring(0, start) + insertion + articleForm.content.substring(end);
    setArticleForm({ ...articleForm, content: newContent });
    
    // Restore focus to textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 0);
  };
  
  // Render markdown preview
  const renderMarkdown = () => {
    // For demonstration purposes, we're converting some basic markdown to HTML
    // In a production app, you'd use a proper markdown library
    let html = articleForm.content;
    
    // Headers
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    
    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Lists
    html = html.replace(/^\s*- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/^\s*\d+\. (.*$)/gm, '<li>$1</li>');
    
    // Add paragraph tags
    html = html.replace(/^\s*(.+)$/gm, '<p>$1</p>');
    
    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    return { __html: html };
  };
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/join" />;
  }
  
  // If still loading, show loading message
  if (loading) {
    return (
      <div className="article-editor-page">
        <div className="container">
          <h2>Loading editor...</h2>
        </div>
      </div>
    );
  }
  
  // If not an author, show message and link to dashboard
  if (!isAuthor) {
    return (
      <div className="article-editor-page">
        <div className="container">
          <div className="editor-message warning">
            <span className="message-text">You need to be an author to create articles. Please create an author profile first.</span>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="article-editor-page">
      <div className="article-editor-container">
        <div className="article-editor-header">
          <h1>Write a New Article</h1>
          <p>Share your thoughts with the Penn community.</p>
        </div>
        
        {error && (
          <div className={`editor-message ${errorType}`}>
            <span className="message-text">{error}</span>
            <button className="message-close" onClick={clearError}>×</button>
          </div>
        )}
        
        <form className="article-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Article Title <span className="required">*</span> <small>(5-200 characters)</small></label>
            <input
              type="text"
              id="title"
              name="title"
              value={articleForm.title}
              onChange={handleInputChange}
              placeholder="Enter a compelling title for your article (5-200 characters)"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="image">
              Header Image <span className="required-marker">*</span>
            </label>
            <div className="image-upload-container">
              <div 
                className="article-image-upload" 
                onClick={triggerFileInput}
                style={imagePreview ? { backgroundImage: `url(${imagePreview})` } : {}}
              >
                {!imagePreview && <span>Click to upload a header image</span>}
                <div className="aspect-ratio-indicator">3:4</div>
                {imagePreview && (
                  <div className="crop-overlay">
                    <div className="crop-message">Image will be cropped to 3:4 ratio</div>
                  </div>
                )}
              </div>
              <input 
                type="file"
                id="image"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden-file-input"
              />
              <small className="image-upload-help">Select an eye-catching image that represents your article (3:4 ratio, max 500KB)</small>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="content">Article Content <span className="required">*</span> <small>(minimum 100 characters)</small></label>
            <div className="markdown-editor-wrapper">
              <div className="markdown-editor-container">
                <h3 className="section-header">Editor</h3>
                <div className="editor-toolbar">
                  <button type="button" className="toolbar-button" onClick={() => insertMarkdown('h1')}>H1</button>
                  <button type="button" className="toolbar-button" onClick={() => insertMarkdown('h2')}>H2</button>
                  <button type="button" className="toolbar-button" onClick={() => insertMarkdown('h3')}>H3</button>
                  <button type="button" className="toolbar-button" onClick={() => insertMarkdown('bold')}>Bold</button>
                  <button type="button" className="toolbar-button" onClick={() => insertMarkdown('italic')}>Italic</button>
                  <button type="button" className="toolbar-button" onClick={() => insertMarkdown('quote')}>Quote</button>
                  <button type="button" className="toolbar-button" onClick={() => insertMarkdown('ul')}>List</button>
                  <button type="button" className="toolbar-button" onClick={() => insertMarkdown('ol')}>Numbered List</button>
                </div>
                <textarea
                  id="content"
                  name="content"
                  value={articleForm.content}
                  onChange={handleInputChange}
                  className="editor-textarea"
                  placeholder="Write your article in markdown..."
                  required
                ></textarea>
                <small>Use the toolbar buttons to format your text. Images are only allowed in the header.</small>
              </div>
              
              <div className="markdown-preview-container">
                <h3 className="section-header">Preview</h3>
                <div 
                  className="markdown-preview"
                  dangerouslySetInnerHTML={renderMarkdown()}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
              disabled={isSubmitting || uploadingImage}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || uploadingImage}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticleEditorPage; 