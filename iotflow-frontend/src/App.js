import { Box, CircularProgress, Typography } from '@mui/material';
import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Admin from './pages/Admin';
import DeviceControl from './pages/DeviceControl';
import Devices from './pages/Devices';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Profile from './pages/Profile';
import Telemetry from './pages/Telemetry';

const AppContent = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <CircularProgress
            size={60}
            sx={{
              color: 'white',
              mb: 2
            }}
          />
          <Typography variant="h6" sx={{ mb: 1 }}>
            IoTFlow Dashboard
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Loading your workspace...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <WebSocketProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar open={sidebarOpen} onToggle={handleSidebarToggle} />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar onMenuClick={handleSidebarToggle} />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              backgroundColor: '#f5f5f5',
              minHeight: 'calc(100vh - 64px)',
              marginTop: '64px',
              marginLeft: { xs: 0, md: sidebarOpen ? '240px' : '70px' },
              transition: 'margin-left 0.3s ease',
            }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/device-control" element={<DeviceControl />} />
              <Route path="/telemetry" element={<Telemetry />} />
              <Route path="/profile" element={<Profile />} />
              {user?.role === 'admin' && (
                <Route path="/admin" element={<Admin />} />
              )}
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </WebSocketProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
