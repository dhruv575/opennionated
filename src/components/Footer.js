import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-title">Opennionated</h3>
          <p className="footer-description">
            A platform for UPenn students to share their thoughts, ideas, and opinions.
          </p>
        </div>
        
        <div className="footer-section">
          <h3 className="footer-title">Navigate</h3>
          <ul className="footer-links">
            <li><Link to="/" className="footer-link">Home</Link></li>
            <li><Link to="/articles" className="footer-link">Articles</Link></li>
            <li><Link to="/join" className="footer-link">Join Us</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3 className="footer-title">Contact</h3>
          <ul className="footer-links">
            <li><a href="mailto:info@opennionated.com" className="footer-link">Email Us</a></li>
            <li><a href="https://twitter.com/opennionated" className="footer-link">Twitter</a></li>
            <li><a href="https://instagram.com/opennionated" className="footer-link">Instagram</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p className="footer-copyright">
          &copy; {currentYear} Opennionated. All rights reserved.
        </p>
      </div>
      
      <div className="footer-disclaimer">
        <div className="disclaimer-content">
          <h4>Legal Disclaimer</h4>
          <p>
            The opinions and views expressed on Opennionated are those of the individual authors and do not 
            necessarily reflect the official policy or position of the University of Pennsylvania 
            or any affiliated organizations. All content is provided for informational purposes only.
          </p>
          <p>
            While we use AI moderation to review submissions, Opennionated does not endorse or take responsibility 
            for the accuracy, completeness, or reliability of any content published on this platform. Authors are 
            solely responsible for their contributions.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 