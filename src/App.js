import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import Overview from './pages/Overview';
import Devices from './pages/Devices';
import Telemetry from './pages/Telemetry';
import MQTT from './pages/MQTT';
import Admin from './pages/Admin';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
              <Route path="/telemetry" element={<Telemetry />} />
              <Route path="/mqtt" element={<MQTT />} />
              <Route path="/analytics" element={<Analytics />} />
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
