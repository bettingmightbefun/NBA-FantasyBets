import axios from 'axios';

// Get the API URL from environment variables or use the default
const apiUrl = import.meta.env.VITE_API_URL || '/api';

console.log('API URL:', apiUrl);

// Create axios instance with base URL
const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Debug mode flag - set to true for debugging
const DEBUG = true;

// Helper function for conditional logging
const debugLog = (...args) => {
  if (DEBUG) {
    console.log(...args);
  }
};

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('Request data:', config.data);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('No auth token found');
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    console.log('Response data:', response.data);
    return response;
  },
  (error) => {
    // Log detailed error information
    console.error('API Response Error:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
      console.error('Request URL:', error.config.baseURL + error.config.url);
      console.error('Request Method:', error.config.method.toUpperCase());
      console.error('Request Data:', error.config.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      console.error('Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
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