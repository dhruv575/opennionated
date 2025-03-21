import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAuthor = false }) => {
  const { isAuthenticated, token, isAuthor } = useAuth();
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/join" state={{ from: location }} replace />;
  }
  
  // If checking for author status and still loading
  if (requireAuthor && loading) {
    return <div>Checking author status...</div>;
  }
  
  // If author check is required but user is not an author
  if (requireAuthor && !isAuthor) {
    return <Navigate to="/dashboard" state={{ authorRequired: true }} replace />;
  }
  
  // If all checks pass, render the children
  return children;
};

export default ProtectedRoute; 