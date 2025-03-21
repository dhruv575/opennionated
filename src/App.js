import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import JoinPage from './pages/JoinPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ArticleEditorPage from './pages/ArticleEditorPage';
import ArticlePage from './pages/ArticlePage';
import ArticlesListPage from './pages/ArticlesListPage';
import AuthorProfilePage from './pages/AuthorProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { initGA, trackPageView } from './utils/analytics';
import './App.css';

// Analytics tracker component that monitors route changes
const AnalyticsTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Track page view whenever location changes
    trackPageView(location.pathname + location.search);
  }, [location]);
  
  return null;
};

// Placeholder components for different pages
const Articles = () => <div className="page-container"><h1>Articles</h1><p>Browse articles here</p></div>;

// AppContent component that contains everything inside the Router
const AppContent = () => {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        {/* Analytics Tracker is now within Router context */}
        <AnalyticsTracker />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/articles" element={<ArticlesListPage />} />
          <Route path="/articles/:slug" element={<ArticlePage />} />
          <Route 
            path="/articles/new" 
            element={
              <ProtectedRoute requireAuthor={true}>
                <ArticleEditorPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/authors/:email" element={<AuthorProfilePage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  // Initialize Google Analytics
  useEffect(() => {
    initGA();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
