import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('iotflow_token');
    const userData = localStorage.getItem('iotflow_user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        apiService.setAuthToken(token);
        setIsAuthenticated(true);
        setUser(parsedUser);
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('iotflow_token');
        localStorage.removeItem('iotflow_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (emailOrUsername, password) => {
    try {
      const response = await apiService.login(emailOrUsername, password);
      
      if (response.success) {
        const { token, user } = response.data;
        
        localStorage.setItem('iotflow_token', token);
        localStorage.setItem('iotflow_user', JSON.stringify(user));
        
        apiService.setAuthToken(token);
        setIsAuthenticated(true);
        setUser(user);
        
        toast.success(`Welcome back, ${user.firstName}!`);
        return { success: true };
      } else {
        return { success: false, error: response.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      
      if (response.success) {
        const { token, user } = response.data;
        
        localStorage.setItem('iotflow_token', token);
        localStorage.setItem('iotflow_user', JSON.stringify(user));
        
        apiService.setAuthToken(token);
        setIsAuthenticated(true);
        setUser(user);
        
        toast.success(`Welcome to IoTFlow, ${user.firstName}!`);
        return { success: true };
      } else {
        return { success: false, error: response.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('iotflow_token');
    localStorage.removeItem('iotflow_user');
    apiService.setAuthToken(null);
    setIsAuthenticated(false);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('iotflow_user', JSON.stringify(updatedUser));
  };

  const value = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
