// API configuration
const config = {
  // Base URL for the backend API
  // API_BASE_URL: 'http://localhost:5000',
  API_BASE_URL: 'https://opennionated-api-10770567236a.herokuapp.com',
  // Helper method to get a complete API endpoint URL
  getApiUrl: (endpoint) => {
    // Make sure endpoint starts with a slash
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${config.API_BASE_URL}${path}`;
  }
};

export default config; 