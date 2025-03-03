import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api, { authAPI } from '../services/api.js';

const AuthContext = createContext();

// Debug mode flag - set to false to disable all console output
const DEBUG = false;

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token) {
          try {
            // Try to get fresh user data from the API
            const res = await authAPI.getProfile();
            setUser(res.data);
            setIsAuthenticated(true);
          } catch (apiError) {
            console.error('API profile fetch failed, using stored user data:', apiError);
            
            // If API call fails but we have stored user data, use that
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              // If no stored user data, clear token
              localStorage.removeItem('token');
            }
          }
        }
      } catch (err) {
        if (DEBUG) {
          console.error('Auth check error:', err);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Helper function to retry API calls with exponential backoff
  const retryApiCall = async (apiCall, maxRetries = 2) => {
    let retries = 0;
    let lastError;
    
    while (retries <= maxRetries) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${retries + 1} failed. ${maxRetries - retries} retries left.`);
        
        // If it's not a timeout error, don't retry
        if (!error.message.includes('timeout')) {
          throw error;
        }
        
        retries++;
        
        if (retries <= maxRetries) {
          // Wait with exponential backoff (2^retries * 1000ms)
          const delay = Math.pow(2, retries) * 1000;
          console.log(`Waiting ${delay}ms before retrying...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  };

  // Register user
  const register = async (userData) => {
    try {
      console.log('Register attempt with username:', userData.username);
      
      const response = await retryApiCall(async () => {
        console.log('Trying to register...');
        return await api.post('/api/auth/register', {
          username: userData.username
        });
      });
      
      console.log('Register response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
        setUser(response.data);
        setIsAuthenticated(true);
        return response.data;
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  // Login user
  const login = async (userData) => {
    try {
      console.log('Login attempt with username:', userData.username);
      
      const response = await retryApiCall(async () => {
        console.log('Trying to login...');
        return await api.post('/api/auth/login', {
          username: userData.username
        });
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
        setUser(response.data);
        setIsAuthenticated(true);
        return response.data;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout user
  const logout = useCallback(() => {
    // Remove data from local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.put('/users/profile', userData);
      
      setUser(prevUser => ({ ...prevUser, ...res.data }));
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    try {
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        if (DEBUG) {
          console.error('No token found when refreshing user data');
        }
        setUser(null);
        return null;
      }
      
      // Get user data using the configured API instance
      const res = await authAPI.getProfile();
      
      // Update localStorage with fresh user data
      localStorage.setItem('user', JSON.stringify(res.data));
      
      setUser(res.data);
      return res.data;
    } catch (err) {
      if (DEBUG) {
        console.error('Failed to refresh user data:', err.response?.data || err.message);
      }
      
      // If unauthorized (401), clear token and user
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
      
      setError(err.response?.data?.message || 'Failed to refresh user data');
      throw err;
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo(() => ({
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    refreshUserData,
    isAuthenticated
  }), [user, loading, error, register, login, logout, updateProfile, refreshUserData, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 