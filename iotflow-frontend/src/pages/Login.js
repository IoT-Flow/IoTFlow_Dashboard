import {
  Box,
  Card,
  CardContent,
  Container,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  Alert,
  IconButton,
  InputAdornment,
  Link,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Person, Lock, Security } from '@mui/icons-material';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loginData, setLoginData] = useState({
    emailOrUsername: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleLoginSubmit = async (e = null) => {
    // Completely prevent any event propagation
    if (e) {
      try {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') {
          e.stopImmediatePropagation();
        }
      } catch (err) {
        // Ignore any event handling errors
      }
    }

    console.log('🔍 Login process started - no page reload');

    setLoading(true);
    setError('');

    if (!loginData.emailOrUsername.trim() || !loginData.password.trim()) {
      console.log('❌ Validation failed - empty fields');
      setError('Please enter both email/username and password');
      setLoading(false);
      return false; // Explicitly return false
    }

    console.log('📡 Attempting login with:', {
      email: loginData.emailOrUsername,
      passwordLength: loginData.password.length,
    });

    try {
      const result = await login(loginData.emailOrUsername, loginData.password);
      console.log('📥 Login result:', result);

      if (!result.success) {
        console.log('❌ Login failed:', result.error);
        // Display the specific error message from the backend
        setError(result.error || 'Invalid credentials');
      } else {
        console.log('✅ Login successful');
      }
    } catch (err) {
      // Handle network errors or unexpected errors
      console.error('💥 Login error caught:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      console.log('🏁 Login process finished, setting loading to false');
      setLoading(false);
    }

    return false; // Explicitly return false to prevent any form submission
  };

  const handleRegisterSubmit = async () => {
    console.log('🔍 Registration process started - no page reload');
    setLoading(true);
    setError('');

    // Validation
    if (
      !registerData.username.trim() ||
      !registerData.email.trim() ||
      !registerData.password.trim()
    ) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const result = await register(registerData);
    if (!result.success) {
      setError(result.error || 'Registration failed');
    }
    setLoading(false);
  };

  const handleLoginChange = field => e => {
    setLoginData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleRegisterChange = field => e => {
    setRegisterData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleToggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
              color: 'white',
              p: 4,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Security sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              IoTFlow Dashboard
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Enterprise IoT Connectivity Platform
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} centered>
                <Tab label="Sign In" />
                <Tab label="Sign Up" />
              </Tabs>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            {activeTab === 0 && (
              <Box component="form" onSubmit={handleLoginSubmit} noValidate>
                <Typography
                  variant="h5"
                  component="h2"
                  gutterBottom
                  sx={{ fontWeight: 600, mb: 3 }}
                >
                  Welcome Back
                </Typography>

                <TextField
                  fullWidth
                  label="Email or Username"
                  value={loginData.emailOrUsername}
                  onChange={handleLoginChange('emailOrUsername')}
                  placeholder="Enter your email address or username"
                  variant="outlined"
                  sx={{ mb: 2 }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔘 Enter key pressed on email field - isolated handler');
                      setTimeout(() => {
                        handleLoginSubmit();
                      }, 0);
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginData.password}
                  onChange={handleLoginChange('password')}
                  placeholder="Enter your password"
                  variant="outlined"
                  sx={{ mb: 3 }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔘 Enter key pressed on password field - isolated handler');
                      setTimeout(() => {
                        handleLoginSubmit();
                      }, 0);
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleToggleShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="button"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  onClick={() => {
                    console.log('🔘 Login button clicked - isolated handler');
                    // Use setTimeout to completely isolate the login process
                    setTimeout(() => {
                      handleLoginSubmit();
                    }, 0);
                  }}
                  sx={{
                    py: 1.5,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => setActiveTab(1)}
                    sx={{ textDecoration: 'none' }}
                  >
                    Don't have an account? Sign up
                  </Link>
                </Box>
              </Box>
            )}

            {/* Registration Form */}
            {activeTab === 1 && (
              <Box component="div">
                <Typography
                  variant="h5"
                  component="h2"
                  gutterBottom
                  sx={{ fontWeight: 600, mb: 3 }}
                >
                  Create Account
                </Typography>

                <TextField
                  fullWidth
                  label="Username"
                  value={registerData.username}
                  onChange={handleRegisterChange('username')}
                  placeholder="Choose a username"
                  variant="outlined"
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                  required
                />

                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={registerData.email}
                  onChange={handleRegisterChange('email')}
                  placeholder="Enter your email address"
                  variant="outlined"
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                  required
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={registerData.password}
                  onChange={handleRegisterChange('password')}
                  placeholder="Create a password"
                  variant="outlined"
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleToggleShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  required
                />

                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange('confirmPassword')}
                  placeholder="Confirm your password"
                  variant="outlined"
                  sx={{ mb: 3 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={handleToggleShowConfirmPassword}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  required
                />

                <Button
                  type="button"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  onClick={() => {
                    setTimeout(() => {
                      handleRegisterSubmit();
                    }, 0);
                  }}
                  sx={{
                    py: 1.5,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => setActiveTab(0)}
                    sx={{ textDecoration: 'none' }}
                  >
                    Already have an account? Sign in
                  </Link>
                </Box>
              </Box>
            )}

            <Box sx={{ mt: 4, p: 3, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                <strong>Demo Credentials:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Admin:</strong> <code>admin@iotflow.com</code> / <code>admin</code> -
                Password: <code>admin123</code>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>User 1:</strong> <code>john@iotflow.com</code> / <code>john</code> -
                Password: <code>john123</code>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>User 2:</strong> <code>alice@iotflow.com</code> / <code>alice</code> -
                Password: <code>alice123</code>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Each user has their own set of devices to manage. Try different accounts to see
                user-specific device isolation.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Typography
          variant="caption"
          color="rgba(255,255,255,0.7)"
          align="center"
          sx={{ mt: 3, display: 'block' }}
        >
          IoTFlow Dashboard v1.0.0 • Secure Enterprise IoT Management
        </Typography>
      </Container>
    </Box>
  );
};

export default Login;
