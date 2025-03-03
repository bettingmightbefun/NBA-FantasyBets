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
        
        if (token) {
          // Get user data using the configured API instance
          const res = await authAPI.getProfile();
          setUser(res.data);
          setIsAuthenticated(true);
        }
      } catch (err) {
        if (DEBUG) {
          console.error('Auth check error:', err);
        }
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      console.log('Register attempt with username:', userData.username);
      
      const response = await api.post('/api/auth/register', {
        username: userData.username
      });
      
      console.log('Register response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
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
      
      const response = await api.post('/api/auth/login', {
        username: userData.username
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
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
    // Remove token from local storage
    localStorage.removeItem('token');
    
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