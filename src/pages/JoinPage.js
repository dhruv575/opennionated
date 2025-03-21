import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './JoinPage.css';

const JoinPage = () => {
  const { isAuthenticated, register, login } = useAuth();
  const [activeTab, setActiveTab] = useState('register');
  
  // Form states
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    subscribed: true
  });
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  // Error and loading states
  const [registerError, setRegisterError] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  // Handle register form changes
  const handleRegisterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegisterForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // Handle login form changes
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle register submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError(null);
    
    // Validation
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError("Passwords don't match");
      return;
    }
    
    if (!registerForm.email.endsWith('upenn.edu')) {
      setRegisterError("Please use a valid Penn email address");
      return;
    }
    
    try {
      setIsLoading(true);
      await register(
        registerForm.name, 
        registerForm.email, 
        registerForm.password,
        registerForm.subscribed
      );
    } catch (error) {
      setRegisterError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    
    try {
      setIsLoading(true);
      await login(loginForm.email, loginForm.password);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="join-page">
      <div className="container">
        <div className="join-container">
          <h1 className="join-title">Welcome to Opennionated</h1>
          <p className="join-subtitle">
            {activeTab === 'register' 
              ? "Create an account to share your Penn perspective" 
              : "Sign in to continue the conversation"}
          </p>
          
          {/* Tabs */}
          <div className="join-tabs">
            <button 
              className={`join-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
            <button 
              className={`join-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
          </div>
          
          {/* Register Form */}
          {activeTab === 'register' && (
            <form className="join-form" onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label htmlFor="name">Display Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={registerForm.name}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Name you want displayed publicly"
                />
                <small className="form-hint">This will be visible to other users. You can use a pseudonym to remain anonymous.</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Penn Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  required
                  placeholder="youremail@upenn.edu"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Create a password (min. 8 characters)"
                  minLength={8}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={registerForm.confirmPassword}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Confirm your password"
                />
              </div>
              
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="subscribed"
                  name="subscribed"
                  checked={registerForm.subscribed}
                  onChange={handleRegisterChange}
                />
                <label htmlFor="subscribed" className="checkbox-label">
                  Subscribe to our newsletter
                </label>
              </div>
              
              {registerError && <div className="form-error">{registerError}</div>}
              
              <button 
                type="submit" 
                className="join-button"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
          
          {/* Login Form */}
          {activeTab === 'login' && (
            <form className="join-form" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="loginEmail">Penn Email</label>
                <input
                  type="email"
                  id="loginEmail"
                  name="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  required
                  placeholder="youremail@upenn.edu"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="loginPassword">Password</label>
                <input
                  type="password"
                  id="loginPassword"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required
                  placeholder="Enter your password"
                />
              </div>
              
              {loginError && <div className="form-error">{loginError}</div>}
              
              <button 
                type="submit" 
                className="join-button"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}
          
          <div className="join-footer">
            <p>
              {activeTab === 'register' 
                ? "Already have an account? " 
                : "Don't have an account? "}
              <button 
                className="text-button"
                onClick={() => setActiveTab(activeTab === 'register' ? 'login' : 'register')}
              >
                {activeTab === 'register' ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinPage; 