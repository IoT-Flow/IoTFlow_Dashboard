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
            // Ensure role is set (for backward compatibility with existing users)
            if (!parsedUser.role && parsedUser.is_admin !== undefined) {
              parsedUser.role = parsedUser.is_admin ? 'admin' : 'user';
            } else if (!parsedUser.role) {
              parsedUser.role = 'user';
            }

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
    console.log('🔐 AuthContext: Login attempt started');
    try {
      console.log('📡 AuthContext: Calling apiService.login');
      const response = await apiService.login(emailOrUsername, password);
      console.log('📥 AuthContext: API response received:', response);

      if (response.success) {
        console.log('✅ AuthContext: Login successful');
        const { token, user } = response.data;

        // Map is_admin to role for easier access
        const userWithRole = {
          ...user,
          role: user.is_admin ? 'admin' : 'user',
        };

        localStorage.setItem('iotflow_token', token);
        localStorage.setItem('iotflow_user', JSON.stringify(userWithRole));

        apiService.setAuthToken(token);
        setIsAuthenticated(true);
        setUser(userWithRole);

        toast.success(`Welcome back, ${user.username}!`);
        return { success: true };
      } else {
        console.log('❌ AuthContext: Login failed with response:', response);
        // Pass through the specific error message from the API
        return { success: false, error: response.error || response.message || 'Login failed' };
      }
    } catch (error) {
      console.error('💥 AuthContext: Login error caught:', error);
      // Handle different types of errors with specific messages
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error.response?.data?.message) {
        // Backend returned a specific error message
        errorMessage = error.response.data.message;
        console.log('🔍 AuthContext: Using backend error message:', errorMessage);
      } else if (error.message) {
        // Network or other error
        errorMessage = error.message;
        console.log('🔍 AuthContext: Using error message:', errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const register = async userData => {
    try {
      const response = await apiService.register(userData);

      if (response.success) {
        const { token, user } = response.data;

        // Map is_admin to role for easier access
        const userWithRole = {
          ...user,
          role: user.is_admin ? 'admin' : 'user',
        };

        localStorage.setItem('iotflow_token', token);
        localStorage.setItem('iotflow_user', JSON.stringify(userWithRole));

        apiService.setAuthToken(token);
        setIsAuthenticated(true);
        setUser(userWithRole);

        toast.success(`Welcome to IoTFlow, ${user.username}!`);
        return { success: true };
      } else {
        return { success: false, error: response.message || 'Registration failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.',
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

  const updateUser = updatedUser => {
    // Ensure role is set when updating user
    const userWithRole = {
      ...updatedUser,
      role: updatedUser.role || (updatedUser.is_admin ? 'admin' : 'user'),
    };
    setUser(userWithRole);
    localStorage.setItem('iotflow_user', JSON.stringify(userWithRole));
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
