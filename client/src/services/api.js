import axios from 'axios';

// Get the API URL from environment variables or use the default
const apiUrl = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Debug mode flag - set to false for production
const DEBUG = false;

// Helper function for conditional logging
const debugLog = (...args) => {
  if (DEBUG) {
    console.log(...args);
  }
};

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    debugLog(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      debugLog('No auth token found');
    }
    return config;
  },
  (error) => {
    if (DEBUG) {
      console.error('API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    debugLog(`API Response: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    debugLog('Response data:', response.data);
    return response;
  },
  (error) => {
    if (DEBUG) {
      // Log detailed error information
      console.error('API Response Error:', error.message);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error Status:', error.response.status);
        console.error('Error Data:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
      }
    }
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (userData) => api.post('/api/auth/login', userData),
  getProfile: () => api.get('/api/auth/profile'),
};

// User API
export const userAPI = {
  getLeaderboard: () => api.get('/api/users/leaderboard'),
  getUserBets: () => api.get('/api/users/bets'),
  updateProfile: (userData) => api.put('/api/users/profile', userData),
};

// Odds API
export const oddsAPI = {
  getUpcomingGames: () => api.get('/api/odds'),
  getLiveGames: () => api.get('/api/odds/live'),
  getFinishedGames: () => api.get('/api/odds/finished'),
  getGameById: (id) => api.get(`/api/odds/${id}`),
};

// Bet API
export const betAPI = {
  placeBet: (betData) => api.post('/api/bets', betData),
  getUserBets: () => api.get('/api/bets'),
  getBetById: (id) => api.get(`/api/bets/${id}`),
  cancelBet: (id) => api.delete(`/api/bets/${id}`),
};

export default api; 