import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../logo512.png';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.navbar-links') && 
          !event.target.closest('.menu-icon')) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Opennionated Logo" className="navbar-logo-img" />
        </Link>
        
        <div className="navbar-menu-container">
          <div className="menu-icon" onClick={toggleMenu}>
            <div className={menuOpen ? 'hamburger hamburger-open' : 'hamburger'}></div>
          </div>
          
          <div className={menuOpen ? 'navbar-links active' : 'navbar-links'}>
            <Link to="/articles" className="navbar-link" onClick={() => setMenuOpen(false)}>Articles</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="navbar-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <button onClick={() => {handleLogout(); setMenuOpen(false);}} className="navbar-link navbar-button">Logout</button>
              </>
            ) : (
              <Link to="/join" className="navbar-link navbar-button" onClick={() => setMenuOpen(false)}>Join</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 