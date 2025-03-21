import ReactGA from 'react-ga4';

// Initialize Google Analytics
// Add your Google Analytics measurement ID here (format: G-XXXXXXXXXX)
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Replace with your actual GA4 measurement ID

export const initGA = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      testMode: process.env.NODE_ENV === 'development',
    });
  }
};

// Track page views
export const trackPageView = (path) => {
  if (typeof window !== 'undefined') {
    ReactGA.send({ 
      hitType: 'pageview', 
      page: path,
      title: document.title
    });
  }
};

// Track events
export const trackEvent = ({ category, action, label, value }) => {
  if (typeof window !== 'undefined') {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
  }
};

// Track user properties
export const setUserProperty = (userId) => {
  if (typeof window !== 'undefined' && userId) {
    ReactGA.set({ userId });
  }
}; 