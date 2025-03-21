import React, { createContext, useState, useEffect, useContext } from 'react';
import { trackEvent, setUserProperty } from '../utils/analytics';
import config from '../config/api';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthor, setIsAuthor] = useState(localStorage.getItem('isAuthor') === 'true');
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (token) {
        try {
          const response = await fetch(config.getApiUrl('/api/auth/me'), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
            
            // Check author status if user is authenticated
            checkAuthorStatus(token);
          } else {
            // Token is invalid or expired
            localStorage.removeItem('token');
            localStorage.removeItem('isAuthor');
            setToken(null);
            setIsAuthor(false);
            setCurrentUser(null);
          }
        } catch (error) {
          // Token is invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('isAuthor');
          setToken(null);
          setIsAuthor(false);
          setCurrentUser(null);
        }
      }
      
      setLoading(false);
    };
    
    const checkAuthorStatus = async (authToken) => {
      try {
        const response = await fetch(config.getApiUrl('/api/authors/profile'), {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (response.ok) {
          setIsAuthor(true);
          localStorage.setItem('isAuthor', 'true');
        } else {
          setIsAuthor(false);
          localStorage.setItem('isAuthor', 'false');
        }
      } catch (authorError) {
        setIsAuthor(false);
        localStorage.setItem('isAuthor', 'false');
      }
    };
    
    checkAuthStatus();
  }, [token]);

  // Function to login a user
  const login = async (email, password) => {
    try {
      const response = await fetch(config.getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to login');
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      
      // Check if the user is an author after login
      try {
        const authorResponse = await fetch(config.getApiUrl('/api/authors/profile'), {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });
        
        if (authorResponse.ok) {
          setIsAuthor(true);
          localStorage.setItem('isAuthor', 'true');
        } else {
          setIsAuthor(false);
          localStorage.setItem('isAuthor', 'false');
        }
      } catch (authorError) {
        setIsAuthor(false);
        localStorage.setItem('isAuthor', 'false');
      }
      
      // Track successful login
      trackEvent({
        category: 'User',
        action: 'Login',
        label: 'Success'
      });
      
      // Set user ID for analytics
      if (data.user) {
        setUserProperty(data.user.email);
      }
      
      return data;
    } catch (error) {
      // Track failed login
      trackEvent({
        category: 'User',
        action: 'Login',
        label: 'Failed'
      });
      
      throw error;
    }
  };

  // Function to register a new user
  const register = async (name, email, password, subscribed = true) => {
    try {
      const response = await fetch(config.getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, subscribed }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      
      // New users are not authors by default
      setIsAuthor(false);
      localStorage.setItem('isAuthor', 'false');
      
      // Track successful registration
      trackEvent({
        category: 'User',
        action: 'Register',
        label: 'Success',
        value: subscribed ? 1 : 0 // Track if user subscribed to newsletter
      });
      
      // Set user ID for analytics
      if (data.user) {
        setUserProperty(data.user.email);
      }
      
      return data;
    } catch (error) {
      // Track failed registration
      trackEvent({
        category: 'User',
        action: 'Register',
        label: 'Failed'
      });
      
      throw error;
    }
  };

  // Update isAuthor status
  const updateAuthorStatus = (status) => {
    setIsAuthor(status);
    localStorage.setItem('isAuthor', status ? 'true' : 'false');
  };

  // Function to logout a user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthor');
    setToken(null);
    setCurrentUser(null);
    setIsAuthor(false);
    
    // Track logout
    trackEvent({
      category: 'User',
      action: 'Logout'
    });
  };

  // Function to update user profile
  const updateProfile = async (userData) => {
    try {
        const response = await fetch(config.getApiUrl('/api/users/profile'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      const updatedUser = await response.json();
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  // Provide auth context
  const value = {
    currentUser,
    isAuthenticated: !!token,
    isAuthor,
    token,
    loading,
    login,
    logout,
    register,
    updateAuthorStatus,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 