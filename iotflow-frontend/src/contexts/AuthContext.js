import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';

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
    // Check if user is already authenticated with JWT token
    const checkAuthentication = async () => {
      try {
        const token = localStorage.getItem('iotflow_token');
        const userData = localStorage.getItem('iotflow_user');

        if (token && userData) {
          const parsedUser = JSON.parse(userData);

          // Validate that the user object has required fields
          if (parsedUser && parsedUser.id && parsedUser.email) {
            apiService.setAuthToken(token);
            setIsAuthenticated(true);
            setUser(parsedUser);
          } else {
            throw new Error('Invalid user data structure');
          }
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('iotflow_token');
        localStorage.removeItem('iotflow_user');
        localStorage.removeItem('iotflow_devices_cache');
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
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

        toast.success(`Welcome back, ${user.username}!`);
        return { success: true };
      } else {
        return { success: false, error: response.message || 'Login failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed. Please check your credentials.'
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

        toast.success(`Welcome to IoTFlow, ${user.username}!`);
        return { success: true };
      } else {
        return { success: false, error: response.message || 'Registration failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Ensure local state is cleared regardless of API call result
    localStorage.removeItem('iotflow_token');
    localStorage.removeItem('iotflow_user');
    localStorage.removeItem('iotflow_devices_cache');
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
