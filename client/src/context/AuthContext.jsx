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

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Get user data using the configured API instance
          const res = await authAPI.getProfile();
          setUser(res.data);
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
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await authAPI.register(userData);
      
      // Save token to local storage
      localStorage.setItem('token', res.data.token);
      
      setUser(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Login user
  const login = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check that at least one of username or email is provided
      if (!userData.username && !userData.email) {
        throw new Error('Either username or email is required');
      }
      
      const res = await authAPI.login(userData);
      
      // Save token to local storage
      localStorage.setItem('token', res.data.token);
      
      setUser(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout user
  const logout = useCallback(() => {
    // Remove token from local storage
    localStorage.removeItem('token');
    
    setUser(null);
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
    refreshUserData
  }), [user, loading, error, register, login, logout, updateProfile, refreshUserData]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 